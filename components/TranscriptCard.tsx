'use client';

import Link from 'next/link';
import { Course } from '@/lib/supabase-transcript';
import { calculateGPA, calculateTotalCredits } from '@/lib/gpa-calculator';

interface TranscriptCardProps {
  kidId: string;
  kidName: string;
  courses: Course[];
  onClick?: () => void;
}

export default function TranscriptCard({
  kidId,
  kidName,
  courses,
  onClick,
}: TranscriptCardProps) {
  try {
    const totalCredits = calculateTotalCredits(courses || []);
    const gpa = calculateGPA(courses || []);

    const handleCardClick = () => {
      if (onClick) {
        onClick();
      }
    };

    return (
      <div
        onClick={handleCardClick}
        className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Transcript
          </h3>
          <p className="text-sm text-gray-600">
            {courses.length} {courses.length === 1 ? 'course' : 'courses'} completed
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600">
            {gpa.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500">GPA</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6 py-4 border-y border-gray-200">
        <div>
          <p className="text-sm text-gray-600 mb-1">Total Credits</p>
          <p className="text-xl font-semibold text-gray-900">
            {totalCredits.toFixed(1)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Status</p>
          <p className="text-xl font-semibold text-green-600">
            Active
          </p>
        </div>
      </div>

      {/* Courses Preview */}
      {courses.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-2">Recent Courses</p>
          <div className="space-y-2">
            {courses.slice(0, 3).map((course) => (
              <div key={course.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 truncate">{course.course_name}</span>
                <span className="ml-2 px-2 py-1 bg-blue-50 text-blue-700 rounded font-medium text-xs">
                  {course.grade}
                </span>
              </div>
            ))}
            {courses.length > 3 && (
              <p className="text-xs text-gray-500 pt-1">
                +{courses.length - 3} more {courses.length - 3 === 1 ? 'course' : 'courses'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Link
          href={`/app/dashboard/${kidId}/transcript`}
          className="flex-1 inline-block text-center bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Manage Courses
        </Link>
        <Link
          href={`/app/dashboard/${kidId}/transcript?action=generate`}
          className="flex-1 inline-block text-center bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          Generate PDF
        </Link>
      </div>

      {courses.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 mb-3">
            No courses added yet
          </p>
          <Link
            href={`/app/dashboard/${kidId}/transcript`}
            className="inline-block bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Add Your First Course
          </Link>
        </div>
      )}
      </div>
    );
  } catch (err) {
    console.error("Error rendering TranscriptCard:", err);
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Transcript</h3>
        <p className="text-sm text-gray-600 mb-4">
          Unable to load transcript. Please try again.
        </p>
        <Link
          href={`/app/dashboard/${kidId}/transcript`}
          className="inline-block bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          View Transcript
        </Link>
      </div>
    );
  }
}
