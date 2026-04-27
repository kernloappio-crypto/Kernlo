'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import CourseForm from '@/components/CourseForm';
import {
  getCoursesByKid,
  addCourse,
  updateCourse,
  deleteCourse,
  getTranscriptData,
  CourseInput,
  Course,
} from '@/lib/supabase-transcript';
import { calculateGPA, calculateTotalCredits, isValidGrade } from '@/lib/gpa-calculator';
import { generateTranscriptPDF, downloadTranscript } from '@/lib/transcript-pdf-generator';
import { supabase } from '@/lib/supabase-client';

export const dynamic = 'force-dynamic';

const COLORS = {
  primary: '#0066cc',
  secondary: '#00d4ff',
  accent1: '#ff6b6b',
  accent2: '#ffd93d',
  accent3: '#6bcf7f',
  dark: '#1a1a2e',
  light: '#f0f7ff',
};

const STATES = ['CA', 'TX', 'FL', 'NY'];

export default function TranscriptPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const kidId = params.id as string;

  const [courses, setCourses] = useState<Course[]>([]);
  const [kid, setKid] = useState<any>(null);
  const [parent, setParent] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [state, setState] = useState('CA');
  const [sortBy, setSortBy] = useState<'year' | 'semester' | 'name'>('year');

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        setUserId(user.id);

        // Get transcript data
        const data = await getTranscriptData(user.id, kidId);
        setKid(data.kid);
        setParent(data.parent);
        setCourses(data.courses);

        // Load state from URL or localStorage
        const urlState = searchParams.get('state');
        if (urlState && STATES.includes(urlState)) {
          setState(urlState);
          localStorage.setItem('transcript-state', urlState);
        } else {
          const savedState = localStorage.getItem('transcript-state') || 'CA';
          setState(savedState);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load transcript data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [kidId, router, searchParams]);

  // Check for generate action
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'generate' && kid && parent && courses.length > 0) {
      handleGeneratePDF();
    }
  }, [searchParams, kid, parent, courses]);

  const handleAddCourse = async (courseData: CourseInput) => {
    if (!userId) return;

    try {
      setSaving(true);
      setError(null);

      const newCourse = await addCourse(userId, kidId, courseData);
      setCourses([...courses, newCourse]);
      setShowForm(false);
    } catch (err) {
      console.error('Error adding course:', err);
      setError('Failed to add course. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCourse = async (courseData: CourseInput) => {
    if (!editingCourse || !userId) return;

    try {
      setSaving(true);
      setError(null);

      const updated = await updateCourse(editingCourse.id, courseData);
      setCourses(courses.map((c) => (c.id === editingCourse.id ? updated : c)));
      setEditingCourse(null);
      setShowForm(false);
    } catch (err) {
      console.error('Error updating course:', err);
      setError('Failed to update course. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;

    try {
      setSaving(true);
      setError(null);

      await deleteCourse(courseId);
      setCourses(courses.filter((c) => c.id !== courseId));
    } catch (err) {
      console.error('Error deleting course:', err);
      setError('Failed to delete course. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePDF = () => {
    if (!kid || !parent) {
      setError('Unable to generate transcript. Missing student or parent information.');
      return;
    }

    try {
      const doc = generateTranscriptPDF(kid, parent, courses, state);
      downloadTranscript(doc, kid.name);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. Please try again.');
    }
  };

  const sortedCourses = [...courses].sort((a, b) => {
    if (sortBy === 'year') {
      return b.year - a.year || b.semester.localeCompare(a.semester);
    } else if (sortBy === 'semester') {
      return b.year - a.year || b.semester.localeCompare(a.semester);
    }
    return a.course_name.localeCompare(b.course_name);
  });

  const gpa = calculateGPA(courses);
  const totalCredits = calculateTotalCredits(courses);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading transcript...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/app/dashboard/${kidId}`} className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back to Student
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {kid?.name ? `${kid.name}'s Transcript` : 'Transcript'}
          </h1>
          <p className="text-gray-600">Manage courses and generate official transcripts</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Top Stats & Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* GPA Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-600">
            <p className="text-gray-600 text-sm mb-2">Cumulative GPA</p>
            <p className="text-4xl font-bold text-blue-600">{gpa.toFixed(2)}</p>
            <p className="text-gray-500 text-xs mt-2">Based on {courses.length} courses</p>
          </div>

          {/* Total Credits Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-600">
            <p className="text-gray-600 text-sm mb-2">Total Credits</p>
            <p className="text-4xl font-bold text-green-600">{totalCredits.toFixed(1)}</p>
            <p className="text-gray-500 text-xs mt-2">Earned</p>
          </div>

          {/* State Selection */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <label htmlFor="state" className="text-gray-600 text-sm mb-2 block">
              Transcript State
            </label>
            <select
              id="state"
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                localStorage.setItem('transcript-state', e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            >
              {STATES.map((s) => (
                <option key={s} value={s}>
                  {s === 'CA'
                    ? 'California'
                    : s === 'TX'
                      ? 'Texas'
                      : s === 'FL'
                        ? 'Florida'
                        : 'New York'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => {
              setEditingCourse(null);
              setShowForm(true);
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            + Add Course
          </button>

          <button
            onClick={handleGeneratePDF}
            disabled={courses.length === 0}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Generate Transcript (PDF)
          </button>
        </div>

        {/* Modal for Course Form */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingCourse ? 'Edit Course' : 'Add New Course'}
              </h2>

              <CourseForm
                initialData={editingCourse || undefined}
                isLoading={saving}
                onSubmit={async (data) => {
                  if (editingCourse) {
                    await handleUpdateCourse(data);
                  } else {
                    await handleAddCourse(data);
                  }
                }}
                onCancel={() => {
                  setShowForm(false);
                  setEditingCourse(null);
                }}
              />
            </div>
          </div>
        )}

        {/* Course List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Courses ({courses.length})
              </h2>

              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-sm text-gray-600">
                  Sort by:
                </label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="year">Year</option>
                  <option value="name">Name</option>
                </select>
              </div>
            </div>
          </div>

          {courses.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 mb-4">No courses added yet</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                Add Your First Course
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Course Name
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                      Credits
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                      Semester
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCourses.map((course, index) => (
                    <tr
                      key={course.id}
                      className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {course.course_name}
                          </p>
                          {course.description && (
                            <p className="text-xs text-gray-500 mt-1">
                              {course.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-gray-700">
                          {course.credits.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded font-semibold text-sm">
                          {course.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-gray-700">
                          {course.semester} {course.year}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingCourse(course);
                              setShowForm(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCourse(course.id)}
                            disabled={saving}
                            className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Grade Scale Legend */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Scale</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {['A', 'B', 'C', 'D', 'F'].map((grade) => (
              <div key={grade} className="text-center">
                <p className="text-2xl font-bold text-blue-600 mb-1">{grade}</p>
                <p className="text-sm text-gray-600">
                  {grade === 'A' ? '4.0' : grade === 'B' ? '3.0' : grade === 'C' ? '2.0' : grade === 'D' ? '1.0' : '0.0'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
