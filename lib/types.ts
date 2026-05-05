/**
 * Type definitions for Kernlo intelligent logging system
 */

// NLP Parsing
export interface ParsedActivityData {
  student: string | null;
  subject: string | null;  // Can be null if not extracted
  minutes: number | null;  // Can be null if duration not found
  note: string | null;     // Can be null if no topic
  platform: string | null;
  date: string | null;
  confidence: number;
}

export interface NLPParseRequest {
  text: string;
  user_id: string;
  available_students: string[];
}

export interface NLPParseResponse {
  success: boolean;
  data?: ParsedActivityData;
  error?: string;
}

// Sentiment Detection
export interface SentimentCheckRequest {
  text: string;
  user_id: string;
}

export interface SentimentCheckResponse {
  needs_support: boolean;
  support_message?: string;
  error?: string;
}

// Pending Confirmations
export interface PendingNLPConfirmation {
  id: string;
  user_id: string;
  message_id: string;
  parsed_data: ParsedActivityData;
  confirmation_step: 'awaiting_platform' | 'awaiting_confirmation';
  created_at: string;
}

// SMS Gateway
export interface SMSReceivePayload {
  From: string; // Twilio From number
  MessageBody: string;
  MessageSid: string;
}

export interface SMSResponsePayload {
  message: string;
  status: 'success' | 'error' | 'needs_clarification' | 'needs_confirmation';
}

// Activity (existing, for reference)
export interface Activity {
  id: string;
  user_id: string;
  child_name: string;
  subject: string;
  duration: number;
  platform: string;
  date: string;
  notes: string | null;
  status?: 'pending' | 'confirmed'; // pending for AI-logged, confirmed for manual
  raw_input?: string | null; // original text input from parent
  created_at: string;
  updated_at: string;
}

export interface ActivityCreatePayload {
  child_name: string;
  subject: string;
  duration: number;
  platform: string;
  date: string;
  notes?: string;
  status?: 'pending' | 'confirmed'; // optional: defaults to 'confirmed' if not provided
  raw_input?: string; // optional: original input text for audit trail
}
