'use client';

import React, { useState, useEffect } from 'react';
import ConfirmCard from './ConfirmCard';
import { supabase } from '@/lib/supabase-client';
import type { ParsedActivityData } from '@/lib/types';

interface CommandBarProps {
  userId: string;
  onActivityLogged?: () => void;
}

const CommandBar: React.FC<CommandBarProps> = ({ userId, onActivityLogged }) => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedActivityData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [availableStudents, setAvailableStudents] = useState<string[]>([]);

  // Fetch kids list on mount
  useEffect(() => {
    const fetchKids = async () => {
      try {
        const { data: kids } = await supabase
          .from('kids')
          .select('name')
          .eq('user_id', userId);
        if (kids) {
          setAvailableStudents(kids.map(k => k.name));
        }
      } catch (err) {
        console.error('Failed to fetch kids:', err);
      }
    };
    if (userId) fetchKids();
  }, [userId]);

  const handleParse = async () => {
    // NO pre-validation - send raw text directly to NLP
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/nlp-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim() || '',
          user_id: userId,
          available_students: availableStudents,
        }),
      });

      const result = await response.json();

      console.log('📥 NLP response:', result);
      console.log('📥 NLP response.data:', result.data);
      console.log('📥 NLP response.data?.student:', result.data?.student);
      console.log('📥 NLP response.data?.minutes:', result.data?.minutes);

      if (!result.data) {
        setError(result.error || 'Could not parse. Try: "Ella did 30m of Math"');
        return;
      }

      // Validate data structure - ensure critical fields are the right type
      const data = result.data;
      if (typeof data.confidence !== 'number') {
        console.error('❌ Invalid NLP response: confidence is not a number', data);
        setError('Invalid response from parser. Please try again.');
        return;
      }

      // Data is valid, set it for display
      setParsedData(data);
      
      if (!result.success) {
        setError(`Low confidence. Please review and edit if needed.`);
      }
    } catch (err: any) {
      console.error('❌ Parse error:', err);
      setError(err.message || 'Parsing failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = () => {
    setText('');
    setParsedData(null);
    setError(null);
  };

  const handleActivityLogged = () => {
    handleClearAll();
    onActivityLogged?.();
  };

  // Check if we have required fields for auto-save
  // Required: student, subject, minutes (all must be non-null and valid types)
  // Platform is optional (user can fill in confirm card)
  const hasRequiredFields = parsedData
    && parsedData.student
    && parsedData.subject
    && parsedData.minutes !== null
    && parsedData.minutes !== undefined
    && typeof parsedData.minutes === 'number'
    && parsedData.minutes > 0;
  
  // Auto-confirm if confidence >= 90%
  const isHighConfidence = parsedData && typeof parsedData.confidence === 'number' && parsedData.confidence >= 0.9;

  // Show confirm card only if parsing succeeded AND (missing required fields OR low confidence)
  const showConfirmCard = parsedData && (!hasRequiredFields || !isHighConfidence);
  
  if (showConfirmCard) {
    return (
      <ConfirmCard
        data={parsedData!}
        userId={userId}
        onCancel={handleClearAll}
        onConfirm={handleActivityLogged}
      />
    );
  }

  // Auto-save if required fields are present AND high confidence (90%+)
  // CRITICAL: Only run if ConfirmCard is NOT showing to prevent render race conditions
  useEffect(() => {
    // Only auto-save if we have all required fields, high confidence, AND ConfirmCard is NOT showing
    if (hasRequiredFields && isHighConfidence && parsedData && !showConfirmCard) {
      const submitActivity = async () => {
        try {
          // Get auth token from Supabase session
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;

          if (!token) {
            setError('Not authenticated');
            return;
          }

          const payload = {
            child_name: parsedData.student,
            subject: parsedData.subject,
            duration: parsedData.minutes,
            platform: parsedData.platform || 'Not specified',
            date: parsedData.date || new Date().toISOString().split('T')[0],
            notes: parsedData.note || null,
            // Auto-submitted via NLP gets 'pending' status + raw input for audit trail
            status: 'pending' as const,
            raw_input: text.trim(),
          };

          console.log('📤 Submitting activity (AI-logged, status=pending):', payload);

          const response = await fetch('/api/activities', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            setSuccessMessage(`✅ Activity logged - waiting for your approval`);
            setTimeout(() => setSuccessMessage(null), 3000); // Hide after 3 seconds
            handleActivityLogged();
            onActivityLogged?.();
          } else {
            const errorData = await response.json();
            setError(errorData.error || 'Failed to save activity');
          }
        } catch (err: any) {
          setError(err.message || 'Error saving activity');
        }
      };

      submitActivity();
    }
  }, [hasRequiredFields, isHighConfidence, parsedData, showConfirmCard, text]);

  return (
    <div className="w-full max-w-2xl mx-auto mb-6">
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          What did they learn today?
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isLoading) {
                handleParse();
              }
            }}
            placeholder="e.g., Ella did 45m of fractions"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={handleParse}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {isLoading ? 'Parsing...' : 'Tell Us'}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {successMessage && (
          <div className="mt-3 p-3 bg-green-100 border border-green-400 rounded-md text-green-700 text-sm font-medium">
            {successMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandBar;
