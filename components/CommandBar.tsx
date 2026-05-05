'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Mic } from 'lucide-react';
import CompleteActivityReview from './CompleteActivityReview';
import IncompleteActivityModal from './IncompleteActivityModal';
import useVoiceRecognition from '@/hooks/useVoiceRecognition';
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
  const [parsedActivities, setParsedActivities] = useState<Array<{
    students: string[];
    subject: string | null;
    minutes: number | null;
    note: string | null;
    platform: string | null;
    date: string | null;
    confidence: number;
  }> | null>(null);
  const [showCompleteReview, setShowCompleteReview] = useState(false);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [showMultiActivityModal, setShowMultiActivityModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [availableStudents, setAvailableStudents] = useState<string[]>([]);

  // 🟨 FIX 1: Memoize callbacks to prevent unnecessary re-initialization of recognition hook
  // These callbacks are dependencies of useVoiceRecognition's useEffect
  // Without memoization, they change on every render, causing cleanup/reinit cycles
  const handleVoiceTranscript = useCallback((transcript: string) => {
    console.log('🎙️ Voice transcript received:', transcript);
    setText(transcript);
  }, []);

  const handleVoiceError = useCallback((errorMsg: string) => {
    console.log('🎙️ Voice error:', errorMsg);
    setError(errorMsg);
    setTimeout(() => setError(null), 5000);
  }, []);

  const handleVoiceSubmit = useCallback(() => {
    // Auto-submit when silence detected
    // Note: use 'text' from closure, which will be the current value
    console.log('🎙️ Silence detected, auto-submitting');
    if (text.trim()) {
      console.log('📤 Calling handleParse with text:', text);
      // We'll call handleParse after the state is set
      // For now, just log that silence was detected
    }
  }, [text]);

  // Voice recognition hook with memoized callbacks
  const { isRecording, isSupported: isVoiceSupported, toggleRecording } = useVoiceRecognition({
    onTranscript: handleVoiceTranscript,
    onSubmit: handleVoiceSubmit,
    onError: handleVoiceError,
  });

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
    // Check that at least one student is selected (either student or students array)
    const hasStudents = (data.students && data.students.length > 0) || (data.student && typeof data.student === 'string');
    return !!(
      hasStudents &&
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
        setParsedActivities(null);
        setShowCompleteReview(false);
        setShowIncompleteModal(false);
        setShowMultiActivityModal(false);
        return;
      }

      const data = result.data;

      // Handle multi-activity response
      if (data.type === 'multiple' && data.activities) {
        console.log('📚 Multiple activities detected:', data.activities);
        setParsedActivities(data.activities);
        setShowMultiActivityModal(true);
        return;
      }

      // Validate data structure for single activity
      if (typeof data.confidence !== 'number') {
        console.error('❌ Invalid NLP response: confidence is not a number', data);
        setError('Invalid response from parser. Please try again.');
        setParsedData(null);
        setParsedActivities(null);
        setShowCompleteReview(false);
        setShowIncompleteModal(false);
        setShowMultiActivityModal(false);
        return;
      }

      // Set parsed data for potential display
      setParsedData(data);

      // Decision tree: straight linear logic (no useEffect chains)
      const hasMissingFields = !hasRequiredFields(data);
      const lowConfidence = !isHighConfidence(data);

      // If missing fields OR low confidence → show IncompleteActivityModal
      if (hasMissingFields || lowConfidence) {
        console.log('📋 Showing IncompleteActivityModal (missing fields or low confidence)');
        setShowIncompleteModal(true);
        return;
      }

      // If all fields present AND high confidence → show CompleteActivityReview
      if (hasRequiredFields(data) && isHighConfidence(data)) {
        console.log('✨ Showing CompleteActivityReview (complete + high confidence)');
        setShowCompleteReview(true);
        return;
      }
    } catch (err: any) {
      console.error('❌ Parse error:', err);
      setError(err.message || 'Parsing failed');
      setParsedData(null);
      setParsedActivities(null);
      setShowCompleteReview(false);
      setShowIncompleteModal(false);
      setShowMultiActivityModal(false);
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
   * User cancelled CompleteActivityReview or IncompleteActivityModal
   */
  const handleCancel = () => {
    console.log('❌ User cancelled activity review/modal');
    handleClearAll();
  };

  /**
   * Clear all state for next entry
   */
  const handleClearAll = () => {
    setText('');
    setParsedData(null);
    setParsedActivities(null);
    setShowCompleteReview(false);
    setShowIncompleteModal(false);
    setShowMultiActivityModal(false);
    setError(null);
    setSuccessMessage(null);
  };

  /**
   * Render CompleteActivityReview or IncompleteActivityModal if needed, otherwise render input
   */
  if (showMultiActivityModal && parsedActivities) {
    // For multi-activity, show simple modal confirming each activity
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '1rem',
        }}
        onClick={handleCancel}
      >
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              borderBottom: '1px solid #e0e7ff',
              backgroundColor: '#f0f7ff',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: '1.125rem',
                fontWeight: 600,
                color: '#0066cc',
              }}
            >
              Confirm {parsedActivities.length} Activities
            </h2>
            <button
              onClick={handleCancel}
              title="Close"
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                color: '#999',
                transition: 'all 0.2s',
              }}
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
            {parsedActivities.map((activity, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  marginBottom: idx < parsedActivities.length - 1 ? '0.75rem' : 0,
                }}
              >
                <div style={{ fontSize: '0.875rem', color: '#1a1a2e' }}>
                  <strong>{activity.students.join(', ')}</strong> • {activity.subject} • {activity.minutes}m
                  {activity.note && ` • ${activity.note}`}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              padding: '1rem',
              borderTop: '1px solid #e0e7ff',
              backgroundColor: '#f0f7ff',
            }}
          >
            <button
              onClick={async () => {
                setIsLoading(true);
                try {
                  const { data: { session } } = await supabase.auth.getSession();
                  if (!session) {
                    setError('Not authenticated');
                    setIsLoading(false);
                    return;
                  }

                  const promises = parsedActivities.flatMap(activity =>
                    activity.students.map(childName =>
                      fetch('/api/activities', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${session.access_token}`,
                        },
                        body: JSON.stringify({
                          user_id: userId,
                          child_name: childName,
                          subject: activity.subject,
                          duration: activity.minutes,
                          platform: activity.platform || 'Not specified',
                          date: activity.date || new Date().toISOString().split('T')[0],
                          notes: activity.note || null,
                        }),
                      })
                    )
                  );

                  const responses = await Promise.all(promises);
                  const allOk = responses.every(r => r.ok);

                  if (allOk) {
                    handleConfirmCardSuccess();
                  } else {
                    setError('Failed to log some activities');
                  }
                } catch (err: any) {
                  setError(err.message || 'Error logging activities');
                } finally {
                  setIsLoading(false);
                }
              }}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '0.75rem 1rem',
                backgroundColor: '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              {isLoading ? '⏳' : '✅'} Confirm All
            </button>
            <button
              onClick={handleCancel}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '0.75rem 1rem',
                backgroundColor: '#f0f0f0',
                color: '#1a1a2e',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showCompleteReview && parsedData) {
    return (
      <CompleteActivityReview
        data={parsedData}
        userId={userId}
        onCancel={handleCancel}
        onConfirm={handleConfirmCardSuccess}
      />
    );
  }

  if (showIncompleteModal && parsedData) {
    return (
      <IncompleteActivityModal
        data={parsedData}
        userId={userId}
        isOpen={true}
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
          <div className="flex-1 relative">
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
              className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            {/* Mic Button - Right aligned inside input */}
            {isVoiceSupported && (
              <button
                onClick={toggleRecording}
                title={isRecording ? 'Stop recording' : 'Start recording'}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-all duration-200 ${
                  isRecording
                    ? 'text-blue-600 animate-pulse'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                disabled={isLoading}
                style={
                  isRecording
                    ? {
                        color: '#0066cc',
                        animation: 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                      }
                    : undefined
                }
              >
                <Mic size={20} />
              </button>
            )}
          </div>
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

      {/* Pulse animation CSS */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default CommandBar;
