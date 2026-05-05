'use client';

import React, { useState } from 'react';
import type { ParsedActivityData } from '@/lib/types';
import { supabase } from '@/lib/supabase-client';

interface CompleteActivityReviewProps {
  data: ParsedActivityData;
  userId: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const CompleteActivityReview: React.FC<CompleteActivityReviewProps> = ({
  data,
  userId,
  onCancel,
  onConfirm,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Safety guard
  if (!data || typeof data !== 'object') {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem',
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            maxWidth: '400px',
            width: '100%',
          }}
        >
          <p style={{ color: '#dc2626', fontWeight: 600 }}>Error: Invalid activity data</p>
          <button
            onClick={onCancel}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#d1d5db',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get auth token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('Not authenticated. Please log in.');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          child_name: data.student,
          subject: data.subject,
          duration: data.minutes,
          platform: data.platform || 'Not specified',
          date: data.date || new Date().toISOString().split('T')[0],
          notes: data.note || null,
        }),
      });

      if (response.ok) {
        onConfirm();
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to log activity');
      }
    } catch (err: any) {
      setError(err.message || 'Error logging activity');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '1rem',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
          maxWidth: '500px',
          width: '100%',
          padding: '1.5rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <h2
          style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#1a1a2e',
            marginBottom: '0.5rem',
          }}
        >
          Confirm Activity
        </h2>
        <p style={{ margin: '0 0 1.5rem', color: '#666', fontSize: '0.875rem' }}>
          Review the extracted details and confirm to save.
        </p>

        {/* Activity Summary Card */}
        <div
          style={{
            backgroundColor: '#f0f7ff',
            border: '2px solid #0066cc',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* Child Name */}
          <div style={{ marginBottom: '0.75rem' }}>
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>
              Student
            </p>
            <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#0066cc' }}>
              {data.student || 'Unknown'}
            </p>
          </div>

          {/* Subject */}
          <div style={{ marginBottom: '0.75rem' }}>
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>
              Subject
            </p>
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1a1a2e' }}>
              {data.subject || 'Unknown'}
            </p>
          </div>

          {/* Duration */}
          <div style={{ marginBottom: '0.75rem' }}>
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>
              Duration
            </p>
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1a1a2e' }}>
              {data.minutes ? `${data.minutes} minutes` : 'Unknown'}
            </p>
          </div>

          {/* Platform (if present) */}
          {data.platform && (
            <div style={{ marginBottom: '0.75rem' }}>
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>
                Platform
              </p>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#1a1a2e' }}>
                {data.platform}
              </p>
            </div>
          )}

          {/* Notes (if present) */}
          {data.note && (
            <div>
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>
                Notes
              </p>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#1a1a2e' }}>
                {data.note}
              </p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '6px',
              padding: '0.75rem',
              marginBottom: '1rem',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#dc2626', fontWeight: 600 }}>
              {error}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onCancel}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              border: '2px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              color: '#1a1a2e',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1,
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              if (!isLoading) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f3f4f6';
              }
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'white';
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              backgroundColor: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              if (!isLoading) {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
              }
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            }}
          >
            {isLoading ? '⏳ Saving...' : '✅ Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompleteActivityReview;
