/**
 * Supabase Transcript Data Layer
 * Handles all course and transcript-related database operations
 */

import { supabase } from './supabase-client';

export interface Course {
  id: string;
  kid_id: string;
  user_id: string;
  course_name: string;
  description?: string;
  credits: number;
  grade: string;
  hours?: number;
  semester: string;
  year: number;
  created_at: string;
  updated_at: string;
}

export interface CourseInput {
  course_name: string;
  description?: string;
  credits: number;
  grade: string;
  hours?: number;
  semester: string;
  year: number;
}

// ============ COURSES ============

/**
 * Get all courses for a specific kid
 */
export async function getCoursesByKid(kidId: string): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('kid_id', kidId)
    .order('year', { ascending: false })
    .order('semester', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Add a new course
 */
export async function addCourse(
  userId: string,
  kidId: string,
  courseData: CourseInput
): Promise<Course> {
  const { data, error } = await supabase
    .from('courses')
    .insert({
      user_id: userId,
      kid_id: kidId,
      ...courseData,
    })
    .select();

  if (error) throw error;
  return data?.[0] as Course;
}

/**
 * Update an existing course
 */
export async function updateCourse(
  courseId: string,
  updates: Partial<CourseInput>
): Promise<Course> {
  const { data, error } = await supabase
    .from('courses')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', courseId)
    .select();

  if (error) throw error;
  return data?.[0] as Course;
}

/**
 * Delete a course
 */
export async function deleteCourse(courseId: string): Promise<void> {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId);

  if (error) throw error;
}

/**
 * Get a single course by ID
 */
export async function getCourseById(courseId: string): Promise<Course> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (error) throw error;
  return data as Course;
}

/**
 * Get courses by semester and year
 */
export async function getCoursesBySemester(
  kidId: string,
  semester: string,
  year: number
): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('kid_id', kidId)
    .eq('semester', semester)
    .eq('year', year)
    .order('course_name', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Get total hours for a specific year
 */
export async function getTotalHoursByYear(
  kidId: string,
  year: number
): Promise<number> {
  const { data, error } = await supabase
    .from('courses')
    .select('hours')
    .eq('kid_id', kidId)
    .eq('year', year);

  if (error) throw error;

  const total = (data || []).reduce((sum, course) => {
    return sum + (parseFloat(String(course.hours)) || 0);
  }, 0);

  return Math.round(total * 100) / 100;
}

// ============ KID PROFILE (for transcript) ============

/**
 * Get kid profile with parent info for transcript generation
 */
export async function getTranscriptData(
  userId: string,
  kidId: string
): Promise<{ kid: any; parent: any; courses: Course[] }> {
  // Get kid
  const { data: kidData, error: kidError } = await supabase
    .from('kids')
    .select('*')
    .eq('id', kidId)
    .single();

  if (kidError) throw kidError;

  // Get parent profile
  const { data: parentData, error: parentError } = await supabase
    .from('parent_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (parentError) throw parentError;

  // Get courses
  const courses = await getCoursesByKid(kidId);

  return {
    kid: kidData,
    parent: parentData,
    courses,
  };
}
