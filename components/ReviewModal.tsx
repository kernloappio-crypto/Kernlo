'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';

interface PendingActivity {
  id: string;
  child_name: string;
  subject: string;
  duration: number;
  raw_input: string;
  status: string;
  platform?: string;
  date?: string;
}

interface Kid {
  id: string;
  name: string;
}

interface ReviewModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onActivityApproved?: () => void;
  onPendingCountChange?: (count: number) => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  userId,
  isOpen,
  onClose,
  onActivityApproved,
  onPendingCountChange,
}) => {
  const [pending, setPending] = useState<PendingActivity[]>([]);
  const [kids, setKids] = useState<Kid[]>([]);
  const [approving, setApproving] = useState<Set<string>>(new Set());
  const [approvingBulk, setApprovingBulk] = useState(false);
  const [animatingRows, setAnimatingRows] = useState<Set<string>>(new Set());
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const COLORS = {
    primary: '#0066cc',
    secondary: '#00d4ff',
    accent1: '#ff6b6b',
    accent3: '#6bcf7f',
    light: '#f0f7ff',
  };

  const SUBJECTS = [
    'Math',
    'English',
    'Science',
    'History',
    'Social Studies',
    'Arts',
    'Physical Education',
    'Other',
  ];

  // Generate consistent color for child
  const getChildColor = (childName: string): string => {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#a29bfe', '#fd79a8', '#fdcb6e'];
    let hash = 0;
    for (let i = 0; i < childName.length; i++) {
      hash = ((hash << 5) - hash) + childName.charCodeAt(i);
      hash = hash & hash;
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Fetch pending activities
  const fetchPending = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return;

      const response = await fetch('/api/activities/pending', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const activities = data.activities || [];
        setPending(activities);
        onPendingCountChange?.(activities.length);
      }
    } catch (err) {
      console.error('Failed to fetch pending:', err);
    } finally {
      setIsLoading(false);
    }
  }, [onPendingCountChange]);

  // Fetch kids
  const fetchKids = useCallback(async () => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return;

      const { data } = await supabase
        .from('kids')
        .select('id, name')
        .eq('user_id', userId);

      if (data) setKids(data);
    } catch (err) {
      console.error('Failed to fetch kids:', err);
    }
  }, [userId]);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPending();
      fetchKids();
    }
  }, [isOpen, fetchPending, fetchKids]);

  // Auto-hide success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Approve single activity
  const handleApprove = async (id: string) => {
    setAnimatingRows((prev) => new Set([...prev, id]));
    setApproving((prev) => new Set(prev).add(id));

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) {
        setSuccess('Error: No auth token ❌');
        setAnimatingRows((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        return;
      }

      const response = await fetch(`/api/activities/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccess('Activity approved ✅');
        setTimeout(() => {
          fetchPending();
          onActivityApproved?.();
        }, 300);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setSuccess(`Error: ${errorData.error || 'Failed to approve'} ❌`);
        setAnimatingRows((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    } catch (err) {
      console.error('Failed to approve:', err);
      setSuccess('Error approving activity ❌');
      setAnimatingRows((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } finally {
      setApproving((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Bulk approve
  const handleBulkApprove = async () => {
    if (pending.length === 0) return;

    setApprovingBulk(true);
    setAnimatingRows(new Set(pending.map((a) => a.id)));

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) {
        setSuccess('Error: No auth token ❌');
        setAnimatingRows(new Set());
        return;
      }

      const ids = pending.map((a) => a.id);
      const response = await fetch('/api/activities/bulk-approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids }),
      });

      if (response.ok) {
        setSuccess(`${ids.length} activities approved ✅`);
        setTimeout(() => {
          setPending([]);
          onPendingCountChange?.(0);
          onActivityApproved?.();
        }, 300);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setSuccess(`Error: ${errorData.error || 'Failed to approve'} ❌`);
        setAnimatingRows(new Set());
      }
    } catch (err) {
      console.error('Failed bulk approve:', err);
      setSuccess('Error in bulk approval ❌');
      setAnimatingRows(new Set());
    } finally {
      setApprovingBulk(false);
    }
  };

  // Dismiss activity
  const handleDismiss = async (id: string) => {
    if (!confirm('Dismiss this activity?')) return;

    setAnimatingRows((prev) => new Set([...prev, id]));

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return;

      const response = await fetch(`/api/activities/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccess('Activity dismissed ✅');
        await fetchPending();
      }
    } catch (err) {
      console.error('Failed to dismiss:', err);
      setSuccess('Error dismissing activity ❌');
      setAnimatingRows((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        padding: '1rem',
      }}
      onClick={onClose}
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
            backgroundColor: COLORS.light,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '1.125rem',
              fontWeight: 600,
              color: COLORS.primary,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            Review Activities
            <span
              style={{
                backgroundColor: COLORS.accent1,
                color: 'white',
                borderRadius: '12px',
                padding: '0.25rem 0.75rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                minWidth: '24px',
                textAlign: 'center',
              }}
            >
              {pending.length}
            </span>
          </h2>
          <button
            onClick={onClose}
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
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem',
          }}
        >
          {success && (
            <div
              style={{
                backgroundColor: '#d4edda',
                color: '#155724',
                padding: '0.75rem',
                borderRadius: '4px',
                marginBottom: '1rem',
                fontSize: '0.875rem',
              }}
            >
              {success}
            </div>
          )}

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
              Loading...
            </div>
          ) : pending.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
              No pending activities
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <style>{`
                .fade-slide-out {
                  opacity: 0 !important;
                  transform: translateX(100%) !important;
                  transition: all 0.3s ease-out !important;
                }
              `}</style>

              {pending.map((activity) => {
                const childColor = getChildColor(activity.child_name);
                const isAnimating = animatingRows.has(activity.id);

                return (
                  <div key={activity.id} className={isAnimating ? 'fade-slide-out' : ''}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        backgroundColor: '#f9fafb',
                        borderRadius: '6px',
                        border: '1px solid #e0e7ff',
                      }}
                    >
                      {/* Child badge */}
                      <div
                        style={{
                          backgroundColor: childColor,
                          color: 'white',
                          borderRadius: '4px',
                          padding: '0.375rem 0.625rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          minWidth: '48px',
                          textAlign: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {activity.child_name.substring(0, 8)}
                      </div>

                      {/* Activity info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#1a1a2e',
                            marginBottom: '0.25rem',
                          }}
                        >
                          {activity.duration}m of {activity.subject}
                        </div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: '#666',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {activity.raw_input}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.5rem',
                          flexShrink: 0,
                        }}
                      >
                        <button
                          onClick={() => handleApprove(activity.id)}
                          disabled={approving.has(activity.id)}
                          title="Confirm"
                          style={{
                            width: '28px',
                            height: '28px',
                            padding: 0,
                            backgroundColor: 'transparent',
                            border: 'none',
                            fontSize: '14px',
                            cursor: approving.has(activity.id) ? 'not-allowed' : 'pointer',
                            opacity: approving.has(activity.id) ? 0.5 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            color: '#6bcf7f',
                            transition: 'all 0.2s',
                          }}
                          onMouseOver={(e) => {
                            if (!approving.has(activity.id)) {
                              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(107, 207, 127, 0.1)';
                            }
                          }}
                          onMouseOut={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                          }}
                        >
                          {approving.has(activity.id) ? '⏳' : '✅'}
                        </button>

                        <button
                          onClick={() => handleDismiss(activity.id)}
                          title="Dismiss"
                          style={{
                            width: '28px',
                            height: '28px',
                            padding: 0,
                            backgroundColor: 'transparent',
                            border: 'none',
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            color: '#ff6b6b',
                            transition: 'all 0.2s',
                          }}
                          onMouseOver={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255, 107, 107, 0.1)';
                          }}
                          onMouseOut={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {pending.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              padding: '1rem',
              borderTop: '1px solid #e0e7ff',
              backgroundColor: COLORS.light,
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={handleBulkApprove}
              disabled={approvingBulk}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '0.75rem 1rem',
                backgroundColor: COLORS.accent3,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: approvingBulk ? 'not-allowed' : 'pointer',
                opacity: approvingBulk ? 0.6 : 1,
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                if (!approvingBulk) {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                }
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              }}
            >
              {approvingBulk ? '⏳' : '✅'} Confirm All
            </button>
            <button
              onClick={onClose}
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
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#e0e0e0';
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f0f0f0';
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewModal;
