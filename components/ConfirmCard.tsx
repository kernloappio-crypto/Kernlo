'use client';

import React, { useState, useMemo } from 'react';
import type { ParsedActivityData } from '@/lib/types';

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

interface ConfirmCardProps {
  data: ParsedActivityData;
  userId: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmCard: React.FC<ConfirmCardProps> = ({ data, userId, onCancel, onConfirm }) => {
  // Safety guard: if data is invalid, show error
  if (!data || typeof data !== 'object') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
          <p className="text-red-600 font-semibold">Error: Invalid activity data</p>
          <button onClick={onCancel} className="mt-4 px-4 py-2 bg-gray-300 rounded">Close</button>
        </div>
      </div>
    );
  }

  // Safely initialize state from potentially null data
  const [student, setStudent] = useState<string>(() => {
    try {
      return (data?.student && typeof data.student === 'string') ? data.student : '';
    } catch {
      return '';
    }
  });
  
  const [subject, setSubject] = useState<string>(() => {
    try {
      return (data?.subject && typeof data.subject === 'string') ? data.subject : '';
    } catch {
      return '';
    }
  });
  
  const [minutes, setMinutes] = useState<string>(() => {
    try {
      if (data?.minutes && typeof data.minutes === 'number' && data.minutes > 0) {
        return data.minutes.toString();
      }
      return '';
    } catch {
      return '';
    }
  });
  
  const [notes, setNotes] = useState<string>(() => {
    try {
      return (data?.note && typeof data.note === 'string') ? data.note : '';
    } catch {
      return '';
    }
  });
  
  const [platform, setPlatform] = useState<string>(() => {
    try {
      return (data?.platform && typeof data.platform === 'string') ? data.platform : '';
    } catch {
      return '';
    }
  });
  
  const [date, setDate] = useState<string>(() => {
    try {
      return (data?.date && typeof data.date === 'string') ? data.date : '';
    } catch {
      return '';
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  // Initialize date on client only (after hydration) to prevent mismatch
  React.useEffect(() => {
    if (!date) {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      setDate(dateStr);
    }
  }, [date]);

  // Determine if NLP parse is complete or incomplete
  const missingFields = useMemo(() => {
    const missing: string[] = [];
    if (!student) missing.push('Student name');
    if (!subject) missing.push('Subject');
    if (!minutes) missing.push('Duration');
    return missing;
  }, [student, subject, minutes]);

  const isComplete = missingFields.length === 0;
  const isHighConfidence = typeof data?.confidence === 'number' && data.confidence >= 0.8;
  const shouldShowAsConfirm = isComplete && isHighConfidence;

  // Build detection summary
  const detectedFields = useMemo(() => {
    const detected: string[] = [];
    if (data?.subject && typeof data.subject === 'string') detected.push(data.subject);
    if (data?.minutes && typeof data.minutes === 'number' && data.minutes > 0) detected.push(`${data.minutes} minutes`);
    if (data?.platform && typeof data.platform === 'string') detected.push(data.platform);
    return detected;
  }, [data]);

  const validateForm = (): boolean => {
    const errors: Record<string, boolean> = {};
    if (!student) errors['student'] = true;
    if (!subject) errors['subject'] = true;
    if (!minutes) errors['minutes'] = true;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConfirm = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          child_name: student,
          subject,
          duration: parseInt(minutes, 10),
          platform: platform || 'Not specified',
          date: date || new Date().toISOString().split('T')[0],
          notes: notes || null,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        {/* Header */}
        <h2 className="text-2xl font-bold mb-2 text-gray-900">
          {shouldShowAsConfirm ? 'Confirm Activity' : 'Complete Your Activity Log'}
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          {shouldShowAsConfirm 
            ? 'Review the extracted details and confirm.'
            : 'Fill in the missing information to save your activity.'}
        </p>

        {/* Detection Summary - Show what was extracted */}
        {detectedFields.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-blue-900">
              ✓ Detected: <span className="font-semibold">{detectedFields.join(', ')}</span>
            </p>
          </div>
        )}

        {/* Missing Fields Alert - Prominently show what's missing */}
        {missingFields.length > 0 && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 mb-6">
            <p className="text-sm font-bold text-amber-900 flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <span>
                Missing required: <span className="text-red-700">{missingFields.join(', ')}</span>
              </span>
            </p>
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-5 mb-6">
          {/* Student - REQUIRED */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Student Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={student}
              onChange={(e) => {
                setStudent(e.target.value);
                if (e.target.value) {
                  setFieldErrors(prev => ({ ...prev, student: false }));
                }
              }}
              placeholder="e.g., Alerie"
              className={`w-full px-3 py-2 border-2 rounded-md focus:outline-none transition ${
                fieldErrors['student']
                  ? 'border-red-500 bg-red-50 focus:ring-2 focus:ring-red-300'
                  : 'border-gray-300 focus:ring-2 focus:ring-blue-400'
              }`}
            />
            {fieldErrors['student'] && (
              <p className="text-xs font-semibold text-red-600 mt-1">Required field</p>
            )}
          </div>

          {/* Subject - REQUIRED */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Subject <span className="text-red-600">*</span>
            </label>
            <select
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                if (e.target.value) {
                  setFieldErrors(prev => ({ ...prev, subject: false }));
                }
              }}
              className={`w-full px-3 py-2 border-2 rounded-md focus:outline-none transition ${
                fieldErrors['subject']
                  ? 'border-red-500 bg-red-50 focus:ring-2 focus:ring-red-300'
                  : 'border-gray-300 focus:ring-2 focus:ring-blue-400'
              }`}
            >
              <option value="">Select a subject...</option>
              {AVAILABLE_SUBJECTS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {fieldErrors['subject'] && (
              <p className="text-xs font-semibold text-red-600 mt-1">Required field</p>
            )}
          </div>

          {/* Duration - REQUIRED */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Duration (minutes) <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="999"
              value={minutes}
              onChange={(e) => {
                setMinutes(e.target.value);
                if (e.target.value) {
                  setFieldErrors(prev => ({ ...prev, minutes: false }));
                }
              }}
              placeholder="e.g., 30"
              className={`w-full px-3 py-2 border-2 rounded-md focus:outline-none transition ${
                fieldErrors['minutes']
                  ? 'border-red-500 bg-red-50 focus:ring-2 focus:ring-red-300'
                  : 'border-gray-300 focus:ring-2 focus:ring-blue-400'
              }`}
            />
            {fieldErrors['minutes'] && (
              <p className="text-xs font-semibold text-red-600 mt-1">Required field</p>
            )}
          </div>

          {/* Platform / Location - OPTIONAL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platform / Location <span className="text-xs text-gray-500">(optional)</span>
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            >
              <option value="">Select or leave blank</option>
              {AVAILABLE_PLATFORMS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Date - OPTIONAL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date <span className="text-xs text-gray-500">(optional)</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            />
          </div>

          {/* Notes/Topic - OPTIONAL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic / Notes <span className="text-xs text-gray-500">(optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Fractions, Photosynthesis"
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-md text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !isComplete}
            className={`flex-1 px-4 py-2 text-white font-semibold rounded-md transition ${
              isLoading || !isComplete
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isLoading ? 'Saving...' : shouldShowAsConfirm ? 'Confirm' : 'Complete & Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmCard;
