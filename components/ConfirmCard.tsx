'use client';

import React, { useState } from 'react';
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
  const [student, setStudent] = useState(data.student || '');
  const [subject, setSubject] = useState(data.subject);
  const [minutes, setMinutes] = useState(data.minutes.toString());
  const [notes, setNotes] = useState(data.note);
  const [platform, setPlatform] = useState(data.platform || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!student || !subject || !minutes || !platform) {
      setError('Please fill in all fields');
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
          platform,
          date: new Date().toISOString().split('T')[0],
          notes: notes || null,
        }),
      });

      if (response.ok) {
        // Success
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
        <h2 className="text-xl font-bold mb-4 text-gray-800">Confirm Activity</h2>

        <div className="space-y-4 mb-6">
          {/* Student */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <input
              type="text"
              value={student}
              onChange={(e) => setStudent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {AVAILABLE_SUBJECTS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Minutes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minutes</label>
            <input
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic/Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Fractions"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Platform */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select platform</option>
              {AVAILABLE_PLATFORMS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 disabled:bg-gray-400 transition"
          >
            {isLoading ? 'Logging...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmCard;
