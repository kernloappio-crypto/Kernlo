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

interface ReviewQueueProps {
  userId: string;
  onRefresh?: () => void;
  onActivityApproved?: () => void;
}

const ReviewQueue: React.FC<ReviewQueueProps> = ({ userId, onRefresh, onActivityApproved }) => {
  const [pending, setPending] = useState<PendingActivity[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [kids, setKids] = useState<Kid[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [approving, setApproving] = useState<Set<string>>(new Set());
  const [approvingBulk, setApprovingBulk] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Edit modal state
  const [editForm, setEditForm] = useState({
    child_name: '',
    subject: '',
    duration: 0,
  });

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

  const COLORS = {
    primary: '#0066cc',
    secondary: '#00d4ff',
    accent1: '#ff6b6b',
    accent3: '#6bcf7f',
    light: '#f0f7ff',
  };

  // Generate consistent color for child based on name hash
  const getChildColor = (childName: string): string => {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#a29bfe', '#fd79a8', '#fdcb6e'];
    let hash = 0;
    for (let i = 0; i < childName.length; i++) {
      hash = ((hash << 5) - hash) + childName.charCodeAt(i);
      hash = hash & hash;
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Toggle row expansion
  const toggleRowExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Fetch pending activities
  const fetchPending = useCallback(async () => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return;

      const response = await fetch('/api/activities/pending', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPending(data.activities || []);
      }
    } catch (err) {
      console.error('Failed to fetch pending:', err);
    }
  }, []);

  // Fetch kids for dropdown
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

  // Initial load
  useEffect(() => {
    fetchPending();
    fetchKids();
  }, [fetchPending, fetchKids]);

  // Auto-hide success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Open edit modal
  const handleEdit = (activity: PendingActivity) => {
    setEditingId(activity.id);
    setEditForm({
      child_name: activity.child_name,
      subject: activity.subject,
      duration: activity.duration,
    });
    setShowEditModal(true);
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!editingId) return;

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return;

      const response = await fetch(`/api/activities/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          child_name: editForm.child_name,
          subject: editForm.subject,
          duration: editForm.duration,
        }),
      });

      if (response.ok) {
        setSuccess('Activity updated ✅');
        setShowEditModal(false);
        setEditingId(null);
        await fetchPending();
        onRefresh?.();
      }
    } catch (err) {
      console.error('Failed to save edit:', err);
      setSuccess('Error updating activity ❌');
    }
  };

  // Approve single activity
  const handleApprove = async (id: string) => {
    setApproving((prev) => new Set(prev).add(id));

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return;

      const response = await fetch(`/api/activities/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccess('Activity approved ✅');
        await fetchPending();
        onRefresh?.();
        onActivityApproved?.();
      }
    } catch (err) {
      console.error('Failed to approve:', err);
      setSuccess('Error approving activity ❌');
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

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return;

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
        setPending([]);
        onRefresh?.();
        onActivityApproved?.();
      }
    } catch (err) {
      console.error('Failed bulk approve:', err);
      setSuccess('Error in bulk approval ❌');
    } finally {
      setApprovingBulk(false);
    }
  };

  // Delete activity
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this pending activity?')) return;

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return;

      const response = await fetch(`/api/activities/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccess('Activity deleted ✅');
        await fetchPending();
        onRefresh?.();
      }
    } catch (err) {
      console.error('Failed to delete:', err);
      setSuccess('Error deleting activity ❌');
    }
  };

  // Hide if no pending
  if (pending.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: '2rem' }}>
      {/* Header with bulk action */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          paddingBottom: '0.75rem',
          borderBottom: `1px solid #e0e7ff`,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: 600,
            color: COLORS.primary,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          Review Queue
          <span
            style={{
              backgroundColor: COLORS.accent1,
              color: 'white',
              borderRadius: '12px',
              padding: '0.2rem 0.5rem',
              fontSize: '12px',
              fontWeight: 600,
              minWidth: '20px',
              textAlign: 'center',
            }}
          >
            {pending.length}
          </span>
        </h2>

        {pending.length > 0 && (
          <button
            onClick={handleBulkApprove}
            disabled={approvingBulk}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: COLORS.accent3,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: approvingBulk ? 'not-allowed' : 'pointer',
              opacity: approvingBulk ? 0.6 : 1,
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
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
            {approvingBulk ? '⏳' : '✅'} All
          </button>
        )}
      </div>

      {/* Success message */}
      {success && (
        <div
          style={{
            backgroundColor: '#d4edda',
            color: '#155724',
            padding: '0.5rem 0.75rem',
            borderRadius: '4px',
            marginBottom: '0.75rem',
            fontSize: '12px',
          }}
        >
          {success}
        </div>
      )}

      {/* Compact list */}
      <div style={{ backgroundColor: 'white', borderRadius: '4px', border: '1px solid #e0e7ff', overflow: 'hidden' }}>
        {pending.map((activity, index) => {
          const isExpanded = expandedRows.has(activity.id);
          const childColor = getChildColor(activity.child_name);

          return (
            <div key={activity.id}>
              {/* Row */}
              <div
                onClick={(e) => {
                  // Don't expand if clicking action icons
                  const target = e.target as HTMLElement;
                  if (!target.closest('[data-action-icons]')) {
                    toggleRowExpand(activity.id);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 0.75rem',
                  minHeight: '48px',
                  borderBottom: index < pending.length - 1 ? '1px solid #f0f0f0' : 'none',
                  cursor: 'pointer',
                  backgroundColor: isExpanded ? '#f9fafb' : 'white',
                  transition: 'background-color 0.15s',
                }}
                onMouseOver={(e) => {
                  if (!isExpanded) {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = '#f9fafb';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isExpanded) {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = 'white';
                  }
                }}
              >
                {/* Expand toggle arrow */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    minWidth: '24px',
                    color: '#999',
                    fontSize: '12px',
                    transition: 'transform 0.2s',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  }}
                >
                  ›
                </div>

                {/* Column 1: Child badge */}
                <div
                  style={{
                    backgroundColor: childColor,
                    color: 'white',
                    borderRadius: '4px',
                    padding: '0.25rem 0.5rem',
                    fontSize: '11px',
                    fontWeight: 700,
                    minWidth: '50px',
                    textAlign: 'center',
                    marginRight: '0.75rem',
                    flexShrink: 0,
                  }}
                >
                  {activity.child_name.substring(0, 8)}
                </div>

                {/* Column 2: Subject and duration */}
                <div
                  style={{
                    flex: 1,
                    fontSize: '13px',
                    color: '#1a1a2e',
                    fontWeight: 500,
                    minWidth: 0,
                  }}
                >
                  {activity.duration}m of {activity.subject}
                </div>

                {/* Column 3: Action icons */}
                <div
                  data-action-icons="true"
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginLeft: '0.75rem',
                    flexShrink: 0,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Approve */}
                  <button
                    onClick={() => handleApprove(activity.id)}
                    disabled={approving.has(activity.id)}
                    title="Approve"
                    style={{
                      width: '32px',
                      height: '32px',
                      padding: 0,
                      backgroundColor: 'transparent',
                      border: 'none',
                      fontSize: '16px',
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

                  {/* Edit */}
                  <button
                    onClick={() => handleEdit(activity)}
                    title="Edit"
                    style={{
                      width: '32px',
                      height: '32px',
                      padding: 0,
                      backgroundColor: 'transparent',
                      border: 'none',
                      fontSize: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '4px',
                      color: '#00d4ff',
                      transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0, 212, 255, 0.1)';
                    }}
                    onMouseOut={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                    }}
                  >
                    ✏️
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(activity.id)}
                    title="Delete"
                    style={{
                      width: '32px',
                      height: '32px',
                      padding: 0,
                      backgroundColor: 'transparent',
                      border: 'none',
                      fontSize: '16px',
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

              {/* Expandable raw input */}
              {isExpanded && (
                <div
                  style={{
                    padding: '0.5rem 0.75rem 0.5rem 3rem',
                    backgroundColor: '#f9fafb',
                    borderTop: '1px solid #f0f0f0',
                    fontSize: '12px',
                    color: '#666',
                    fontStyle: 'italic',
                    lineHeight: '1.4',
                    maxHeight: '60px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  &quot;{activity.raw_input}&quot;
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => {
            setShowEditModal(false);
            setEditingId(null);
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '2rem',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: '0 0 1.5rem 0',
                fontSize: '1.25rem',
                fontWeight: 600,
                color: COLORS.primary,
              }}
            >
              Quick Edit
            </h3>

            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                  color: '#1a1a2e',
                }}
              >
                Child Name
              </label>
              <select
                value={editForm.child_name}
                onChange={(e) =>
                  setEditForm({ ...editForm, child_name: e.target.value })
                }
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid #ddd`,
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                }}
              >
                {kids.map((k) => (
                  <option key={k.id} value={k.name}>
                    {k.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                  color: '#1a1a2e',
                }}
              >
                Subject
              </label>
              <select
                value={editForm.subject}
                onChange={(e) =>
                  setEditForm({ ...editForm, subject: e.target.value })
                }
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid #ddd`,
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                }}
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                  color: '#1a1a2e',
                }}
              >
                Duration (hours)
              </label>
              <input
                type="number"
                value={editForm.duration}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    duration: parseFloat(e.target.value) || 0,
                  })
                }
                step="0.5"
                min="0"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid #ddd`,
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingId(null);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#f0f0f0',
                  color: '#1a1a2e',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleSaveEdit}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: COLORS.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewQueue;
