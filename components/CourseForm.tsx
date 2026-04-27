'use client';

import { useState, useEffect } from 'react';
import { CourseInput } from '@/lib/supabase-transcript';

interface CourseFormProps {
  onSubmit: (courseData: CourseInput) => Promise<void>;
  onCancel: () => void;
  initialData?: CourseInput & { id?: string };
  isLoading?: boolean;
}

const SEMESTERS = ['Fall', 'Spring', 'Summer'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i);
const GRADES = ['A', 'B', 'C', 'D', 'F'];

export default function CourseForm({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}: CourseFormProps) {
  const [formData, setFormData] = useState<CourseInput & { id?: string }>(
    initialData || {
      course_name: '',
      description: '',
      credits: 0.5,
      grade: 'A',
      hours: undefined,
      semester: 'Fall',
      year: CURRENT_YEAR,
    }
  );

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'credits' || name === 'hours' || name === 'year') {
      setFormData({
        ...formData,
        [name]: name === 'year' ? parseInt(value) : parseFloat(value),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.course_name.trim()) {
      newErrors.course_name = 'Course name is required';
    }

    if (formData.credits < 0 || formData.credits > 10) {
      newErrors.credits = 'Credits must be between 0 and 10';
    }

    if (!GRADES.includes(formData.grade)) {
      newErrors.grade = 'Invalid grade';
    }

    if (formData.hours !== undefined && (formData.hours < 0 || formData.hours > 500)) {
      newErrors.hours = 'Hours must be between 0 and 500';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Course Name */}
      <div>
        <label htmlFor="course_name" className="block text-sm font-medium text-gray-700 mb-1">
          Course Name *
        </label>
        <input
          type="text"
          id="course_name"
          name="course_name"
          value={formData.course_name}
          onChange={handleChange}
          placeholder="e.g., Algebra II, World History"
          className={`w-full px-3 py-2 border rounded-lg font-sans ${
            errors.course_name ? 'border-red-500' : 'border-gray-300'
          } focus:outline-none focus:border-blue-500`}
        />
        {errors.course_name && (
          <p className="text-red-500 text-sm mt-1">{errors.course_name}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description (Optional)
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          placeholder="Brief course description or topics covered"
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg font-sans focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Credits */}
      <div>
        <label htmlFor="credits" className="block text-sm font-medium text-gray-700 mb-1">
          Credits *
        </label>
        <input
          type="number"
          id="credits"
          name="credits"
          value={formData.credits}
          onChange={handleChange}
          min="0"
          max="10"
          step="0.5"
          className={`w-full px-3 py-2 border rounded-lg font-sans ${
            errors.credits ? 'border-red-500' : 'border-gray-300'
          } focus:outline-none focus:border-blue-500`}
        />
        {errors.credits && (
          <p className="text-red-500 text-sm mt-1">{errors.credits}</p>
        )}
      </div>

      {/* Grade */}
      <div>
        <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
          Grade *
        </label>
        <select
          id="grade"
          name="grade"
          value={formData.grade}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg font-sans ${
            errors.grade ? 'border-red-500' : 'border-gray-300'
          } focus:outline-none focus:border-blue-500`}
        >
          {GRADES.map((grade) => (
            <option key={grade} value={grade}>
              {grade}
            </option>
          ))}
        </select>
        {errors.grade && (
          <p className="text-red-500 text-sm mt-1">{errors.grade}</p>
        )}
      </div>

      {/* Hours (Optional) */}
      <div>
        <label htmlFor="hours" className="block text-sm font-medium text-gray-700 mb-1">
          Instructional Hours (Optional)
        </label>
        <input
          type="number"
          id="hours"
          name="hours"
          value={formData.hours || ''}
          onChange={handleChange}
          min="0"
          max="500"
          step="1"
          placeholder="e.g., 180"
          className={`w-full px-3 py-2 border rounded-lg font-sans ${
            errors.hours ? 'border-red-500' : 'border-gray-300'
          } focus:outline-none focus:border-blue-500`}
        />
        {errors.hours && (
          <p className="text-red-500 text-sm mt-1">{errors.hours}</p>
        )}
        <p className="text-gray-500 text-xs mt-1">
          Required for FL & NY transcripts; optional for others
        </p>
      </div>

      {/* Semester */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">
            Semester *
          </label>
          <select
            id="semester"
            name="semester"
            value={formData.semester}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg font-sans focus:outline-none focus:border-blue-500"
          >
            {SEMESTERS.map((sem) => (
              <option key={sem} value={sem}>
                {sem}
              </option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
            Year *
          </label>
          <select
            id="year"
            name="year"
            value={formData.year}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg font-sans focus:outline-none focus:border-blue-500"
          >
            {YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Save Course'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
