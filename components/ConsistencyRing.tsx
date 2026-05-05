'use client';

import React, { useState, useEffect } from 'react';

interface ConsistencyRingProps {
  childId: string;
  childName: string;
  userId: string;
  refreshCounter?: number;
}

interface ConsistencyData {
  daysLogged: number;
  weeklyTarget: number;
  monthlyDaysLogged: number;
  daysInMonth: number;
}

const ConsistencyRing: React.FC<ConsistencyRingProps> = ({
  childId,
  childName,
  userId,
  refreshCounter = 0,
}) => {
  const [data, setData] = useState<ConsistencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState<'weekly' | 'monthly' | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const WEEKLY_TARGET = 5;

  // Track when component is mounted (client-side only)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch consistency data
  useEffect(() => {
    if (!isMounted) return; // Don't fetch until component is mounted

    const fetchConsistency = async () => {
      try {
        console.log(`🔄 ConsistencyRing refetching for ${childName} (childId: ${childId}, refreshCounter: ${refreshCounter})`);
        setLoading(true);
        setError(null);

        // Get auth token from localStorage
        let token = '';
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

        const respData = await response.json();
        console.log(`✅ ConsistencyRing data: ${childName} has ${respData.daysLogged}/${respData.weeklyTarget} days this week, ${respData.monthlyDaysLogged}/${respData.daysInMonth} days this month`);
        setData({
          daysLogged: respData.daysLogged || 0,
          weeklyTarget: respData.weeklyTarget || WEEKLY_TARGET,
          monthlyDaysLogged: respData.monthlyDaysLogged || 0,
          daysInMonth: respData.daysInMonth || 31,
        });
      } catch (err: any) {
        console.error('Error fetching consistency:', err);
        setError(err.message || 'Failed to load consistency data');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchConsistency();
  }, [childId, refreshCounter, isMounted]);

  // SVG dimensions and render helper
  const size = 60;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Helper to render a single ring
  const renderRing = (
    current: number,
    target: number,
    color: string,
    onMouseEnter: () => void,
    onMouseLeave: () => void
  ) => {
    const isComplete = current >= target;
    const ringColor = isComplete ? color : '#e5e7eb';
    const textColor = isComplete ? color : '#999';
    const strokeDashoffset = circumference - (current / target) * circumference;

    return (
      <div
        className="relative flex flex-col items-center justify-center"
        style={{ width: `${size}px` }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
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
            stroke="#f0f0f0"
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
              fontSize: '11px',
              fontWeight: 'bold',
              color: textColor,
              lineHeight: '1',
            }}
          >
            {current}/{target}
          </div>
          <div
            style={{
              fontSize: '6px',
              color: '#999',
              marginTop: '1px',
              textAlign: 'center',
              lineHeight: '1',
            }}
          >
            days
          </div>
        </div>
      </div>
    );
  };

  // Always show loading state until component is mounted to avoid hydration mismatch
  if (!isMounted || loading) {
    return (
      <div
        className="flex gap-2"
        style={{ width: '140px', justifyContent: 'flex-end' }}
      >
        {/* Weekly skeleton */}
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
        {/* Monthly skeleton */}
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
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div
      className="flex gap-2"
      style={{ width: '140px', justifyContent: 'flex-end' }}
    >
      {/* Weekly Ring (Blue) */}
      {renderRing(
        data.daysLogged,
        data.weeklyTarget,
        '#0066cc',
        () => setShowTooltip('weekly'),
        () => setShowTooltip(null)
      )}

      {/* Monthly Ring (Green) */}
      {renderRing(
        data.monthlyDaysLogged,
        data.daysInMonth,
        '#66bb6a',
        () => setShowTooltip('monthly'),
        () => setShowTooltip(null)
      )}

      {/* Tooltips */}
      {showTooltip === 'weekly' && (
        <div
          style={{
            position: 'absolute',
            bottom: '-32px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1a1a2e',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            whiteSpace: 'nowrap',
            zIndex: 10,
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          {data.daysLogged}/{data.weeklyTarget} days this week
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

      {showTooltip === 'monthly' && (
        <div
          style={{
            position: 'absolute',
            bottom: '-32px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1a1a2e',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            whiteSpace: 'nowrap',
            zIndex: 10,
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          {data.monthlyDaysLogged}/{data.daysInMonth} days this month
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
