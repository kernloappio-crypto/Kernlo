'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { ParsedActivityData } from '@/lib/types';
import { supabase } from '@/lib/supabase-client';

const AVAILABLE_PLATFORMS = ['Khan Academy', 'IXL', 'YouTube', 'Epic!', 'Duolingo', 'Quizlet', 'Outschool', 'Twinkl', 'Acellus', 'Other'];
const AVAILABLE_SUBJECTS = [
  'English',
  'Math',
  'Science',
  'History',
  'Art',
  'PE',
  'Music',
  'Social Studies',
  'Language Arts',
  'Reading',
  'Writing',
  'Extracurricular',
];

interface IncompleteActivityModalProps {
  data: ParsedActivityData;
  userId: string;
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const IncompleteActivityModal: React.FC<IncompleteActivityModalProps> = ({
  data,
  userId,
  isOpen,
  onCancel,
  onConfirm,
}) => {
  // Safety guard
  if (!data || typeof data !== 'object') {
    return null;
  }

  // State for form fields
  const [selectedKids, setSelectedKids] = useState<Set<string>>(() => {
    // Pre-populate with kids from parsed data (if multiple) or single student
    const initial = new Set<string>();
    if (data?.students && Array.isArray(data.students)) {
      data.students.forEach(kid => initial.add(kid));
    } else if (data?.student && typeof data.student === 'string') {
      initial.add(data.student);
    }
    return initial;
  });

  const [subject, setSubject] = useState<string>(() => {
    return (data?.subject && typeof data.subject === 'string') ? data.subject : '';
  });

  const [minutes, setMinutes] = useState<string>(() => {
    if (data?.minutes && typeof data.minutes === 'number' && data.minutes > 0) {
      return data.minutes.toString();
    }
    return '';
  });

  const [notes, setNotes] = useState<string>(() => {
    return (data?.note && typeof data.note === 'string') ? data.note : '';
  });

  const [platform, setPlatform] = useState<string>(() => {
    return (data?.platform && typeof data.platform === 'string') ? data.platform : '';
  });

  const [date, setDate] = useState<string>(() => {
    return (data?.date && typeof data.date === 'string') ? data.date : '';
  });

  const [kids, setKids] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  // Initialize date on client only
  useEffect(() => {
    if (!date) {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      setDate(dateStr);
    }
  }, [date]);

  // Fetch kids list
  useEffect(() => {
    const fetchKids = async () => {
      try {
        const { data: kidsData } = await supabase
          .from('kids')
          .select('id, name')
          .eq('user_id', userId);
        if (kidsData) {
          setKids(kidsData);
        }
      } catch (err) {
        console.error('Failed to fetch kids:', err);
      }
    };
    if (isOpen && userId) {
      fetchKids();
    }
  }, [isOpen, userId]);

  // Determine missing fields (required only: at least one child, subject, duration)
  const missingFields = useMemo(() => {
    const missing: string[] = [];
    if (selectedKids.size === 0) missing.push('Child Name');
    if (!subject) missing.push('Subject');
    if (!minutes) missing.push('Duration');
    return missing;
  }, [selectedKids, subject, minutes]);

  const isComplete = missingFields.length === 0;

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, boolean> = {};
    if (selectedKids.size === 0) errors['kids'] = true;
    if (!subject) errors['subject'] = true;
    if (!minutes) errors['minutes'] = true;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle confirm - create activity for each selected kid
  const handleConfirm = async () => {
    if (!validateForm()) {
      return;
    }

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

      // Create activity for each selected kid
      const kidArray = Array.from(selectedKids);
      const promises = kidArray.map(childName =>
        fetch('/api/activities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            user_id: userId,
            child_name: childName,
            subject,
            duration: parseInt(minutes, 10),
            platform: platform || 'Not specified',
            date: date || new Date().toISOString().split('T')[0],
            notes: notes || null,
          }),
        })
      );

      const responses = await Promise.all(promises);
      const allOk = responses.every(r => r.ok);

      if (allOk) {
        onConfirm();
      } else {
        // Find first error
        for (const response of responses) {
          if (!response.ok) {
            const result = await response.json();
            setError(result.error || 'Failed to log activity');
            break;
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error logging activity');
    } finally {
      setIsLoading(false);
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
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
            Complete Activity
          </h2>
          <button
            onClick={onCancel}
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
          {/* Missing Fields Alert */}
          {missingFields.length > 0 && (
            <div
              style={{
                backgroundColor: '#fef3c7',
                border: '1px solid #fcd34d',
                borderRadius: '6px',
                padding: '0.75rem',
                marginBottom: '1rem',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#92400e',
                }}
              >
                ⚠️ Missing fields: {missingFields.join(', ')}
              </p>
            </div>
          )}

          {/* Form Fields - Compact */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Child Name - Checkboxes (Multi-select) */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#1a1a2e',
                  marginBottom: '0.5rem',
                }}
              >
                Child Name <span style={{ color: '#ff6b6b' }}>*</span>
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '0.5rem',
                  padding: fieldErrors['kids'] ? '0.5rem' : '0',
                  borderRadius: '6px',
                  backgroundColor: fieldErrors['kids'] ? '#fee2e2' : 'transparent',
                  border: fieldErrors['kids'] ? '2px solid #ff6b6b' : 'none',
                }}
              >
                {kids.map((kid) => (
                  <label
                    key={kid.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      cursor: 'pointer',
                      padding: '0.375rem',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseOver={(e) => {
                      (e.currentTarget as HTMLLabelElement).style.backgroundColor = 'rgba(0, 102, 204, 0.05)';
                    }}
                    onMouseOut={(e) => {
                      (e.currentTarget as HTMLLabelElement).style.backgroundColor = 'transparent';
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedKids.has(kid.name)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedKids);
                        if (e.target.checked) {
                          newSelected.add(kid.name);
                        } else {
                          newSelected.delete(kid.name);
                        }
                        setSelectedKids(newSelected);
                        if (newSelected.size > 0) {
                          setFieldErrors((prev) => ({ ...prev, kids: false }));
                        }
                      }}
                      style={{
                        cursor: 'pointer',
                        width: '16px',
                        height: '16px',
                      }}
                    />
                    <span style={{ fontSize: '0.875rem', color: '#1a1a2e' }}>
                      {kid.name}
                    </span>
                  </label>
                ))}
              </div>
              {fieldErrors['kids'] && (
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#ff6b6b', fontWeight: 600 }}>
                  Select at least one child
                </p>
              )}
            </div>

            {/* Subject - Dropdown */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#1a1a2e',
                  marginBottom: '0.375rem',
                }}
              >
                Subject <span style={{ color: '#ff6b6b' }}>*</span>
              </label>
              <select
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  if (e.target.value) {
                    setFieldErrors((prev) => ({ ...prev, subject: false }));
                  }
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: fieldErrors['subject'] ? '2px solid #ff6b6b' : '1px solid #d1d5db',
                  backgroundColor: fieldErrors['subject'] ? '#fee2e2' : 'white',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                <option value="">Select subject...</option>
                {AVAILABLE_SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {fieldErrors['subject'] && (
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#ff6b6b', fontWeight: 600 }}>
                  Required
                </p>
              )}
            </div>

            {/* Duration - Number input */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#1a1a2e',
                  marginBottom: '0.375rem',
                }}
              >
                Duration (minutes) <span style={{ color: '#ff6b6b' }}>*</span>
              </label>
              <input
                type="number"
                min="1"
                max="999"
                value={minutes}
                onChange={(e) => {
                  setMinutes(e.target.value);
                  if (e.target.value) {
                    setFieldErrors((prev) => ({ ...prev, minutes: false }));
                  }
                }}
                placeholder="e.g., 30"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: fieldErrors['minutes'] ? '2px solid #ff6b6b' : '1px solid #d1d5db',
                  backgroundColor: fieldErrors['minutes'] ? '#fee2e2' : 'white',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                }}
              />
              {fieldErrors['minutes'] && (
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#ff6b6b', fontWeight: 600 }}>
                  Required
                </p>
              )}
            </div>

            {/* Platform - Dropdown (Optional) */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#1a1a2e',
                  marginBottom: '0.375rem',
                }}
              >
                Platform <span style={{ fontSize: '0.75rem', color: '#999' }}>(optional)</span>
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                <option value="">Select or leave blank</option>
                {AVAILABLE_PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes - Textarea (Optional) */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#1a1a2e',
                  marginBottom: '0.375rem',
                }}
              >
                Notes <span style={{ fontSize: '0.75rem', color: '#999' }}>(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Fractions, Photosynthesis"
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Date - Input (Optional, hidden for now) */}
            <input
              type="hidden"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                backgroundColor: '#fee2e2',
                border: '1px solid #fca5a5',
                borderRadius: '6px',
                padding: '0.75rem',
                marginTop: '1rem',
              }}
            >
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#dc2626', fontWeight: 600 }}>
                {error}
              </p>
            </div>
          )}
        </div>

        {/* Footer - Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            padding: '1rem',
            borderTop: '1px solid #e0e7ff',
            backgroundColor: '#f0f7ff',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={handleConfirm}
            disabled={isLoading || !isComplete}
            style={{
              flex: 1,
              minWidth: '120px',
              padding: '0.75rem 1rem',
              backgroundColor: isLoading || !isComplete ? '#ccc' : '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: isLoading || !isComplete ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              if (!isLoading && isComplete) {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
              }
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            }}
          >
            {isLoading ? '⏳' : '✅'} Confirm
          </button>
          <button
            onClick={onCancel}
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
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncompleteActivityModal;
