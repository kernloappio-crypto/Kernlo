'use client';

import { useState } from 'react';
import TranscriptCard from '@/components/TranscriptCard';

/**
 * Isolated test page for TranscriptCard debugging
 * Navigate to /test-transcript to test the component in isolation
 * Check browser console for all debug logs
 */
export default function TestTranscriptPage() {
  const [kidId, setKidId] = useState('');
  const [showCard, setShowCard] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          TranscriptCard Debug Test
        </h1>
        
        <div className="bg-white rounded-lg p-6 shadow-md mb-6">
          <p className="text-gray-700 mb-4">
            Enter a kid ID to test the TranscriptCard component in isolation.
          </p>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="kidId" className="block text-sm font-medium text-gray-700 mb-2">
                Kid ID
              </label>
              <input
                id="kidId"
                type="text"
                value={kidId}
                onChange={(e) => setKidId(e.target.value)}
                placeholder="Enter a kid ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            
            <button
              onClick={() => setShowCard(!!kidId)}
              disabled={!kidId}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Load TranscriptCard
            </button>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>💡 Debug Instructions:</strong>
            </p>
            <ul className="text-sm text-yellow-800 mt-2 list-disc list-inside space-y-1">
              <li>Open DevTools (F12)</li>
              <li>Go to Console tab</li>
              <li>Enter a kid ID and click "Load TranscriptCard"</li>
              <li>Watch the console logs to track execution</li>
              <li>Look for any error messages</li>
            </ul>
          </div>
        </div>

        {showCard && kidId && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Component Output
            </h2>
            <TranscriptCard
              kidId={kidId}
              kidName="Test Kid"
              onClick={() => console.log('Card clicked')}
            />
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>📝 Expected Console Flow:</strong>
          </p>
          <ol className="text-xs text-blue-800 mt-2 list-decimal list-inside space-y-1">
            <li>[TranscriptCard] Component mounted, kidId: xxx</li>
            <li>[TranscriptCard] Checking localStorage for session...</li>
            <li>[TranscriptCard] Parsing session JSON...</li>
            <li>[TranscriptCard] JWT token extracted successfully</li>
            <li>[TranscriptCard] Fetching courses from API...</li>
            <li>[TranscriptCard] API response status: 200</li>
            <li>[TranscriptCard] API response data: {...}</li>
            <li>[TranscriptCard] Courses count: N</li>
            <li>[TranscriptCard] Rendering with courses: [...]</li>
            <li>[TranscriptCard] Calculating totalCredits...</li>
            <li>[TranscriptCard] Calculating GPA...</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
