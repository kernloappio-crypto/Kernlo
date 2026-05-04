import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type {
  SMSReceivePayload,
  SMSResponsePayload,
  ParsedActivityData,
  PendingNLPConfirmation,
} from '@/lib/types';
import twilio from 'twilio';

// Initialize Supabase admin client (using anon key for now, RLS handles auth)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Format phone number to E.164 standard
 */
function formatPhoneE164(phone: string): string {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');

  // If it's a 10-digit US number, add +1
  if (cleaned.length === 10) {
    cleaned = '1' + cleaned;
  }

  // If it doesn't start with +, add it
  if (!phone.includes('+')) {
    return '+' + cleaned;
  }

  return phone;
}

/**
 * Lookup user by phone number
 */
async function getUserByPhone(phone: string): Promise<{ id: string; name: string } | null> {
  const formattedPhone = formatPhoneE164(phone);

  const { data, error } = await supabase
    .from('users')
    .select('id, email')
    .eq('phone_number', formattedPhone)
    .single();

  if (error) {
    console.log(`📱 No user found for phone: ${formattedPhone}`);
    return null;
  }

  return { id: data.id, name: data.email };
}

/**
 * Get user's kids for NLP parsing context
 */
async function getUserKids(user_id: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('kids')
    .select('name')
    .eq('user_id', user_id);

  if (error) {
    console.error('🔴 Error fetching kids:', error);
    return [];
  }

  return (data || []).map((k: any) => k.name);
}

/**
 * Call NLP parse endpoint
 */
async function callNLPParse(
  text: string,
  user_id: string,
  available_students: string[]
): Promise<{ success: boolean; data?: ParsedActivityData; error?: string }> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/nlp-parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        user_id,
        available_students,
      }),
    });

    return await response.json();
  } catch (error: any) {
    console.error('🔴 NLP call error:', error);
    return { success: false, error: 'NLP parsing failed' };
  }
}

/**
 * Call sentiment check endpoint
 */
async function callSentimentCheck(
  text: string,
  user_id: string
): Promise<{ needs_support: boolean; support_message?: string }> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/sentiment-check`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, user_id }),
      }
    );

    return await response.json();
  } catch (error: any) {
    console.error('🔴 Sentiment check call error:', error);
    return { needs_support: false };
  }
}

/**
 * Send SMS response via Twilio
 */
async function sendTwilioSMS(toPhone: string, message: string): Promise<boolean> {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      console.warn('⚠️ Twilio credentials not configured');
      return false;
    }

    const client = twilio(accountSid, authToken);
    await client.messages.create({
      body: message,
      from: fromNumber,
      to: toPhone,
    });

    console.log(`✅ SMS sent to ${toPhone}: "${message}"`);
    return true;
  } catch (error: any) {
    console.error('🔴 Twilio SMS send error:', error);
    return false;
  }
}

/**
 * Check for existing pending confirmation and handle response
 */
async function handlePendingConfirmation(
  user_id: string,
  message_text: string,
  fromPhone: string
): Promise<{ response: string; handled: boolean; activity_created?: boolean }> {
  // Get latest pending confirmation for user
  const { data: pending, error } = await supabase
    .from('pending_nlp_confirmations')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !pending || pending.length === 0) {
    return { response: '', handled: false };
  }

  const confirmation = pending[0] as PendingNLPConfirmation;
  const lowerText = message_text.toLowerCase().trim();

  // Handle "awaiting_platform" step
  if (confirmation.confirmation_step === 'awaiting_platform') {
    // Extract platform from message (simple keyword matching)
    const platforms = ['khan', 'ixl', 'youtube', 'epic', 'duolingo', 'quizlet', 'outschool', 'twinkl', 'acellus', 'other'];
    let detected_platform: string | null = null;

    for (const platform of platforms) {
      if (lowerText.includes(platform)) {
        detected_platform = platform.charAt(0).toUpperCase() + platform.slice(1);
        break;
      }
    }

    if (!detected_platform && !lowerText.includes('other') && message_text.length > 0) {
      // Use NLP to detect platform
      const nlpResult = await callNLPParse(message_text, user_id, []);
      if (nlpResult.data?.platform) {
        detected_platform = nlpResult.data.platform;
      }
    }

    if (detected_platform) {
      // Update pending confirmation
      const updated_data = {
        ...confirmation.parsed_data,
        platform: detected_platform,
      };

      await supabase
        .from('pending_nlp_confirmations')
        .update({
          parsed_data: updated_data,
          confirmation_step: 'awaiting_confirmation',
        })
        .eq('id', confirmation.id);

      const { student, subject, minutes, platform } = updated_data;
      return {
        response: `✓ Got it, ${student} did ${minutes}m of ${subject} (${platform}). Confirm? Reply Y/N`,
        handled: true,
      };
    } else {
      return {
        response: `Platform not recognized. Try: Khan, IXL, YouTube, Epic, Duolingo, or "Other"`,
        handled: true,
      };
    }
  }

  // Handle "awaiting_confirmation" step
  if (confirmation.confirmation_step === 'awaiting_confirmation') {
    const confirmKeywords = ['yes', 'y', 'confirm', 'ok', 'yep', 'yup', 'sure', 'agreed'];
    const isConfirmed = confirmKeywords.some(kw => lowerText.includes(kw));

    if (isConfirmed) {
      // Log activity with status='pending' so parent can approve
      const { student, subject, minutes, platform, note } = confirmation.parsed_data;

      const { error: insertError } = await supabase.from('activities').insert({
        user_id,
        child_name: student,
        subject,
        duration: minutes,
        platform,
        date: new Date().toISOString().split('T')[0],
        notes: note,
        status: 'pending',  // SMS activities start as pending
        raw_input: `[SMS] ${confirmation.parsed_data.student} ${minutes}m ${subject}`, // Store SMS context
      });

      if (insertError) {
        console.error('🔴 Activity insert error:', insertError);
        return {
          response: `Error logging activity. Try again.`,
          handled: true,
        };
      }

      // Delete pending confirmation
      await supabase.from('pending_nlp_confirmations').delete().eq('id', confirmation.id);

      // Send confirmation SMS to parent
      await sendTwilioSMS(fromPhone, `✅ Got it! I've added that to your review queue. Head to the dashboard to approve. 🚀`);

      return {
        response: `✅ Got it! I've added that to your review queue. Head to the dashboard to approve. 🚀`,
        handled: true,
        activity_created: true,
      };
    } else {
      // Delete pending confirmation and ask for retry
      await supabase.from('pending_nlp_confirmations').delete().eq('id', confirmation.id);

      return {
        response: `Cancelled. Try again: "Ella did 30m of Math on Khan"`,
        handled: true,
      };
    }
  }

  return { response: '', handled: false };
}

export async function POST(req: NextRequest): Promise<NextResponse<SMSResponsePayload>> {
  try {
    const body = await req.formData();
    const from = body.get('From') as string;
    const messageBody = body.get('Body') as string;
    const messageSid = body.get('MessageSid') as string;

    console.log(`📱 SMS Received from ${from}: "${messageBody}"`);

    if (!from || !messageBody) {
      return NextResponse.json(
        { message: 'Invalid SMS payload', status: 'error' },
        { status: 400 }
      );
    }

    // Lookup user
    const user = await getUserByPhone(from);
    if (!user) {
      // Send error SMS to phone
      await sendTwilioSMS(from, `📱 Phone not recognized. Update your profile at kernlo.app to enable SMS.`);
      
      return NextResponse.json(
        {
          message: '📱 Phone number not recognized. Update your profile at kernlo.app',
          status: 'error',
        },
        { status: 200 }
      );
    }

    // Check sentiment first
    const sentiment = await callSentimentCheck(messageBody, user.id);
    if (sentiment.needs_support) {
      return NextResponse.json(
        {
          message: sentiment.support_message || '💙 We hear you. Homeschooling is a marathon. You\'ve got this.',
          status: 'success',
        },
        { status: 200 }
      );
    }

    // Check for pending confirmations
    const pending = await handlePendingConfirmation(user.id, messageBody, from);
    if (pending.handled) {
      return NextResponse.json(
        { message: pending.response, status: 'success' },
        { status: 200 }
      );
    }

    // Parse with NLP
    const kids = await getUserKids(user.id);
    if (kids.length === 0) {
      // Send error SMS
      await sendTwilioSMS(from, `👨‍👩‍👧 Add your kids to your profile first at kernlo.app`);
      
      return NextResponse.json(
        {
          message: '👨‍👩‍👧 Add your kids to your profile first at kernlo.app',
          status: 'error',
        },
        { status: 200 }
      );
    }

    const nlpResult = await callNLPParse(messageBody, user.id, kids);

    if (!nlpResult.success && nlpResult.data) {
      // Low confidence - ask for clarification
      const { student, subject, minutes } = nlpResult.data;
      const clarificationMsg = `Not sure I understood. Did you mean: ${student} did ${minutes}m of ${subject}?`;
      
      // Send SMS back
      await sendTwilioSMS(from, clarificationMsg);
      
      return NextResponse.json(
        {
          message: clarificationMsg,
          status: 'needs_clarification',
        },
        { status: 200 }
      );
    }

    if (!nlpResult.success) {
      const errorMsg = `Could not parse. Try: "Ella did 30m of Math on Khan"`;
      
      // Send SMS error
      await sendTwilioSMS(from, errorMsg);
      
      return NextResponse.json(
        {
          message: errorMsg,
          status: 'error',
        },
        { status: 200 }
      );
    }

    const parsed = nlpResult.data!;
    const { platform, student, subject, minutes } = parsed;

    // HIGH CONFIDENCE SMS: Insert directly with status='pending'
    // (NLP has all required fields and high confidence)
    if (parsed.confidence >= 0.85 && student && subject && minutes && platform) {
      console.log('✅ High confidence SMS parse - inserting directly...');
      
      const { error: insertError } = await supabase.from('activities').insert({
        user_id: user.id,
        child_name: student,
        subject,
        duration: minutes,
        platform,
        date: new Date().toISOString().split('T')[0],
        notes: parsed.note || null,
        status: 'pending',  // SMS activities start as pending
        raw_input: messageBody,  // Store original SMS text
      });

      if (insertError) {
        console.error('🔴 Activity insert error:', insertError);
        return NextResponse.json(
          {
            message: 'Error logging activity. Try again.',
            status: 'error',
          },
          { status: 200 }
        );
      }

      // Send confirmation SMS
      await sendTwilioSMS(from, `✅ Got it! I've added that to your review queue. Head to the dashboard to approve. 🚀`);

      return NextResponse.json(
        { message: `✅ Got it! I've added that to your review queue. Head to the dashboard to approve. 🚀`, status: 'success' },
        { status: 200 }
      );
    }

    // LOW CONFIDENCE or MISSING FIELDS: Create pending confirmation record
    const step = platform ? 'awaiting_confirmation' : 'awaiting_platform';

    const { error: insertError } = await supabase.from('pending_nlp_confirmations').insert({
      user_id: user.id,
      message_id: messageSid,
      parsed_data: parsed,
      confirmation_step: step,
    });

    if (insertError) {
      console.error('🔴 Pending confirmation insert error:', insertError);
      return NextResponse.json(
        {
          message: 'Error processing request. Try again.',
          status: 'error',
        },
        { status: 200 }
      );
    }

    // Send appropriate reply
    let reply_message: string;
    if (step === 'awaiting_platform') {
      reply_message = `✓ Got it, ${student} did ${minutes}m of ${subject}. Platform?`;
    } else {
      reply_message = `✓ Got it, ${student} did ${minutes}m of ${subject} (${platform}). Confirm? Y/N`;
    }

    return NextResponse.json(
      { message: reply_message, status: 'needs_confirmation' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('🔴 SMS receive error:', error);
    return NextResponse.json(
      { message: error?.message || 'SMS processing failed', status: 'error' },
      { status: 500 }
    );
  }
}
