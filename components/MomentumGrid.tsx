'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { startOfYear, endOfYear, eachDayOfInterval, format, isToday } from 'date-fns';
import { supabase } from '@/lib/supabase-client';

interface HeatmapDay {
  date: string;
  count: number;
}

interface MomentumGridProps {
  userId: string;
  refreshCounter?: number;
}

const MomentumGrid: React.FC<MomentumGridProps> = ({ userId, refreshCounter = 0 }) => {
  const [heatmapData, setHeatmapData] = useState<HeatmapDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [tokenFetched, setTokenFetched] = useState(false);

  // Fetch heatmap data
  const fetchHeatmapData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the session token
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const year = new Date().getFullYear();
      const response = await fetch(`/api/activities/heatmap?year=${year}`, {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch heatmap data');
      }

      const result = await response.json();
      setHeatmapData(result.heatmapData || []);
      setTokenFetched(true);
    } catch (err: any) {
      console.error('Error fetching heatmap:', err);
      setError(err.message || 'Failed to load momentum data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!tokenFetched) {
      fetchHeatmapData();
    }
  }, [fetchHeatmapData, tokenFetched]);

  // Refetch when refreshCounter changes
  useEffect(() => {
    if (refreshCounter > 0) {
      setTokenFetched(false);
      fetchHeatmapData();
    }
  }, [refreshCounter, fetchHeatmapData]);

  // Get color based on activity count
  const getColorClass = (count: number): string => {
    if (count === 0) return 'bg-white border border-gray-200';
    if (count === 1) return 'bg-green-100'; // Light green
    if (count >= 2 && count <= 3) return 'bg-green-300'; // Medium green
    return 'bg-green-500'; // Dark green
  };

  const getActivityCount = (date: string): number => {
    const dayData = heatmapData.find((d) => d.date === date);
    return dayData?.count || 0;
  };

  // Generate all days of the year
  const year = new Date().getFullYear();
  const startDate = startOfYear(new Date(year, 0, 1));
  const endDate = endOfYear(new Date(year, 11, 31));
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });

  // Group days into weeks (7 columns)
  const weeks: (typeof allDays)[] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Your Momentum</h2>
        <div className="flex justify-center items-center h-48">
          <div className="text-gray-500">Loading momentum data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Your Momentum</h2>
          <p className="text-sm text-gray-500 mt-1">
            Activity heatmap for {year} • {heatmapData.length} days with confirmed activities
          </p>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 mb-4 bg-red-50 p-3 rounded">
          {error}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-6 mb-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white border border-gray-200 rounded"></div>
          <span className="text-gray-600">No logs</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 rounded"></div>
          <span className="text-gray-600">1 activity</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-300 rounded"></div>
          <span className="text-gray-600">2-3 activities</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-gray-600">4+ activities</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Day headers (Sun-Sat) */}
          <div className="flex gap-1 mb-2 ml-8">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="w-6 text-center text-xs font-semibold text-gray-600">
                {day}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex flex-col gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex gap-1">
                {week.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const count = getActivityCount(dateStr);
                  const isTodayDate = isToday(day);

                  return (
                    <div
                      key={dateStr}
                      className={`relative w-6 h-6 rounded cursor-pointer transition-all hover:scale-110 hover:shadow-md ${getColorClass(
                        count
                      )} ${isTodayDate ? 'ring-2 ring-blue-500' : ''}`}
                      onMouseEnter={() => setHoveredDate(dateStr)}
                      onMouseLeave={() => setHoveredDate(null)}
                      title={`${format(day, 'MMM d')}: ${count} ${count === 1 ? 'activity' : 'activities'}`}
                    >
                      {/* Tooltip */}
                      {hoveredDate === dateStr && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10 pointer-events-none">
                          {format(day, 'MMM d')}: {count} {count === 1 ? 'activity' : 'activities'}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex gap-4 text-sm text-gray-600">
          <div>
            <span className="font-semibold text-gray-800">{heatmapData.length}</span> days with activities
          </div>
          <div>
            <span className="font-semibold text-gray-800">
              {heatmapData.reduce((sum, d) => sum + d.count, 0)}
            </span>{' '}
            total activities
          </div>
        </div>
      </div>
    </div>
  );
};

export default MomentumGrid;
