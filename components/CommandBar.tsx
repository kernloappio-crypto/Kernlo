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
  // State: pure and simple
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedActivityData | null>(null);
  const [showConfirmCard, setShowConfirmCard] = useState(false);
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

  /**
   * Check if parsed data has all required fields
   */
  const hasRequiredFields = (data: ParsedActivityData | null): boolean => {
    if (!data) return false;
    return !!(
      data.student &&
      typeof data.student === 'string' &&
      data.subject &&
      typeof data.subject === 'string' &&
      data.minutes !== null &&
      data.minutes !== undefined &&
      typeof data.minutes === 'number' &&
      data.minutes > 0
    );
  };

  /**
   * Check if parsed data has high confidence (≥90%)
   */
  const isHighConfidence = (data: ParsedActivityData | null): boolean => {
    return !!(
      data &&
      typeof data.confidence === 'number' &&
      data.confidence >= 0.9
    );
  };

  /**
   * Auto-save activity to database
   * Called directly after NLP response in handleParse (no useEffect)
   */
  const autoSaveActivity = async (data: ParsedActivityData): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setError('Not authenticated');
        return false;
      }

      const payload = {
        child_name: data.student,
        subject: data.subject,
        duration: data.minutes,
        platform: data.platform || 'Not specified',
        date: data.date || new Date().toISOString().split('T')[0],
        notes: data.note || null,
        status: 'pending' as const,
        raw_input: text.trim(),
      };

      console.log('📤 Auto-saving activity (high confidence):', payload);

      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save activity');
        return false;
      }

      setSuccessMessage('✅ Activity logged - waiting for your approval');
      setTimeout(() => setSuccessMessage(null), 3000);
      return true;
    } catch (err: any) {
      console.error('❌ Auto-save failed:', err);
      setError(err.message || 'Error saving activity');
      return false;
    }
  };

  /**
   * Main handler: Parse text → check confidence → auto-save or show ConfirmCard
   * This is the ONLY place where we decide what to do next
   */
  const handleParse = async () => {
    if (!text.trim()) {
      setError('Please enter what they learned');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/nlp-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          user_id: userId,
          available_students: availableStudents,
        }),
      });

      const result = await response.json();

      console.log('📥 NLP response:', result);

      if (!result.data) {
        setError(result.error || 'Could not parse. Try: "Ella did 30m of Math"');
        setParsedData(null);
        setShowConfirmCard(false);
        return;
      }

      const data = result.data;

      // Validate data structure
      if (typeof data.confidence !== 'number') {
        console.error('❌ Invalid NLP response: confidence is not a number', data);
        setError('Invalid response from parser. Please try again.');
        setParsedData(null);
        setShowConfirmCard(false);
        return;
      }

      // Set parsed data for potential display
      setParsedData(data);

      // Decision tree: straight linear logic (no useEffect chains)
      const hasMissingFields = !hasRequiredFields(data);
      const lowConfidence = !isHighConfidence(data);

      // If missing fields OR low confidence → show ConfirmCard
      if (hasMissingFields || lowConfidence) {
        console.log('📋 Showing ConfirmCard (missing fields or low confidence)');
        setShowConfirmCard(true);
        return;
      }

      // If all fields present AND high confidence → auto-save
      if (hasRequiredFields(data) && isHighConfidence(data)) {
        console.log('✨ Auto-saving (complete + high confidence)');
        const success = await autoSaveActivity(data);
        if (success) {
          handleClearAll();
          onActivityLogged?.();
        }
        return;
      }
    } catch (err: any) {
      console.error('❌ Parse error:', err);
      setError(err.message || 'Parsing failed');
      setParsedData(null);
      setShowConfirmCard(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * User confirmed via ConfirmCard and activity was saved
   */
  const handleConfirmCardSuccess = () => {
    console.log('✅ ConfirmCard saved successfully');
    handleClearAll();
    onActivityLogged?.();
  };

  /**
   * User cancelled ConfirmCard
   */
  const handleCancel = () => {
    console.log('❌ User cancelled ConfirmCard');
    handleClearAll();
  };

  /**
   * Clear all state for next entry
   */
  const handleClearAll = () => {
    setText('');
    setParsedData(null);
    setShowConfirmCard(false);
    setError(null);
    setSuccessMessage(null);
  };

  /**
   * Render ConfirmCard if needed, otherwise render input
   */
  if (showConfirmCard && parsedData) {
    return (
      <ConfirmCard
        data={parsedData}
        userId={userId}
        onCancel={handleCancel}
        onConfirm={handleConfirmCardSuccess}
      />
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto mb-6 sticky top-0 z-40 sm:static bg-white rounded-lg shadow-md sm:shadow-none sm:rounded-none sm:bg-transparent">
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 sm:shadow-md sm:rounded-lg sm:border">
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
