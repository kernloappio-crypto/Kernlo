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
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [kids, setKids] = useState<Kid[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [approving, setApproving] = useState<Set<string>>(new Set());
  const [approvingBulk, setApprovingBulk] = useState(false);

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

  // Fetch pending activities
  const fetchPending = useCallback(async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
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
          borderBottom: `2px solid ${COLORS.primary}`,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '1.25rem',
            fontWeight: 600,
            color: COLORS.primary,
          }}
        >
          Review Queue{' '}
          <span
            style={{
              backgroundColor: COLORS.accent1,
              color: 'white',
              borderRadius: '20px',
              padding: '0.25rem 0.75rem',
              fontSize: '0.875rem',
              marginLeft: '0.5rem',
            }}
          >
            {pending.length} Pending
          </span>
        </h2>

        <button
          onClick={handleBulkApprove}
          disabled={approvingBulk}
          style={{
            padding: '0.75rem 1.5rem',
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
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                '0 4px 12px rgba(107, 207, 127, 0.3)';
            }
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
          }}
        >
          {approvingBulk ? '⏳ Approving...' : '✅ Bulk Approve'}
        </button>
      </div>

      {/* Success message */}
      {success && (
        <div
          style={{
            backgroundColor: '#d4edda',
            color: '#155724',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            marginBottom: '1rem',
            fontSize: '0.875rem',
          }}
        >
          {success}
        </div>
      )}

      {/* Pending items */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        {pending.map((activity) => (
          <div
            key={activity.id}
            style={{
              backgroundColor: 'white',
              border: `1px solid #e0e7ff`,
              borderRadius: '8px',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                '0 4px 12px rgba(0, 102, 204, 0.1)';
              (e.currentTarget as HTMLDivElement).style.borderColor = COLORS.primary;
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                '0 1px 3px rgba(0, 0, 0, 0.05)';
              (e.currentTarget as HTMLDivElement).style.borderColor = '#e0e7ff';
            }}
          >
            {/* Content */}
            <div style={{ marginBottom: '1rem' }}>
              <div
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: COLORS.primary,
                  marginBottom: '0.5rem',
                }}
              >
                {activity.child_name}
              </div>

              <div
                style={{
                  fontSize: '1rem',
                  color: '#1a1a2e',
                  marginBottom: '0.5rem',
                }}
              >
                {activity.duration}m of {activity.subject}
              </div>

              <div
                style={{
                  fontSize: '0.875rem',
                  color: '#666',
                  fontStyle: 'italic',
                  textDecoration: 'underline #ddd',
                }}
              >
                "{activity.raw_input}"
              </div>
            </div>

            {/* Action buttons */}
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center',
              }}
            >
              <button
                onClick={() => handleApprove(activity.id)}
                disabled={approving.has(activity.id)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: COLORS.accent3,
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: approving.has(activity.id) ? 'not-allowed' : 'pointer',
                  opacity: approving.has(activity.id) ? 0.6 : 1,
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  if (!approving.has(activity.id)) {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                }}
              >
                {approving.has(activity.id) ? '⏳' : '✅'} Approve
              </button>

              <button
                onClick={() => handleEdit(activity)}
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: COLORS.secondary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                }}
              >
                ✏️ Edit
              </button>

              <button
                onClick={() => handleDelete(activity.id)}
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#f0f0f0',
                  color: '#666',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffebee';
                  (e.currentTarget as HTMLButtonElement).style.color = COLORS.accent1;
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f0f0f0';
                  (e.currentTarget as HTMLButtonElement).style.color = '#666';
                }}
              >
                ✕ Delete
              </button>
            </div>
          </div>
        ))}
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
