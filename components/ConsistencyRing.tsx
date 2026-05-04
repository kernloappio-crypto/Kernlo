'use client';

import React, { useState, useEffect } from 'react';

interface ConsistencyRingProps {
  childId: string;
  childName: string;
  userId: string;
  refreshCounter?: number;
}

const ConsistencyRing: React.FC<ConsistencyRingProps> = ({
  childId,
  childName,
  userId,
  refreshCounter = 0,
}) => {
  const [daysLogged, setDaysLogged] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const TARGET_DAYS = 5;

  // Fetch consistency data
  useEffect(() => {
    const fetchConsistency = async () => {
      try {
        console.log(`🔄 ConsistencyRing refetching for ${childName} (childId: ${childId}, refreshCounter: ${refreshCounter})`);
        setLoading(true);
        setError(null);

        // Get auth token from localStorage
        let token = '';
        if (typeof window !== 'undefined') {
          const sessionStr = localStorage.getItem('kernlo_session');
          if (sessionStr) {
            try {
              const session = JSON.parse(sessionStr);
              token = session.access_token;
            } catch (e) {
              token = localStorage.getItem('kernlo_access_token') || '';
            }
          } else {
            token = localStorage.getItem('kernlo_access_token') || '';
          }
        }

        if (!token) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/consistency/${childId}?week=current`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch consistency data');
        }

        const data = await response.json();
        console.log(`✅ ConsistencyRing data: ${childName} has ${data.daysLogged} days logged this week`);
        setDaysLogged(data.daysLogged || 0);
      } catch (err: any) {
        console.error('Error fetching consistency:', err);
        setError(err.message || 'Failed to load consistency data');
        setDaysLogged(0);
      } finally {
        setLoading(false);
      }
    };

    fetchConsistency();
  }, [childId, refreshCounter]);

  // Determine color based on progress
  const isComplete = daysLogged >= TARGET_DAYS;
  const ringColor = isComplete ? '#22c55e' : '#b3d9ff'; // green or light blue
  const textColor = isComplete ? '#22c55e' : '#0066cc';

  // SVG dimensions
  const size = 60;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (daysLogged / TARGET_DAYS) * circumference;

  if (loading) {
    return (
      <div
        className="flex flex-col items-center justify-center"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#ccc',
            animation: 'pulse 2s infinite',
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="relative flex flex-col items-center justify-center"
      style={{ width: `${size}px` }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* SVG Ring */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />

        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.5s ease-in-out, stroke 0.3s ease-in-out',
          }}
        />
      </svg>

      {/* Text in center */}
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            fontSize: '12px',
            fontWeight: 'bold',
            color: textColor,
            lineHeight: '1',
          }}
        >
          {daysLogged}/{TARGET_DAYS}
        </div>
        <div
          style={{
            fontSize: '7px',
            color: '#666',
            marginTop: '2px',
            textAlign: 'center',
            lineHeight: '1',
          }}
        >
          days
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            bottom: '-30px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1a1a2e',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            zIndex: 10,
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          {daysLogged}/{TARGET_DAYS} days logged this week
          <div
            style={{
              position: 'absolute',
              top: '-4px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '0',
              height: '0',
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderBottom: '4px solid #1a1a2e',
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
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

export default ConsistencyRing;
