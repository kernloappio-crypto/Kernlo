/**
 * GPA Calculator
 * Calculates cumulative GPA from courses using standard 4.0 scale
 * Formula: (sum of grade points * credits) / (sum of credits)
 */

interface Course {
  id: string;
  course_name: string;
  grade: string; // "A", "B", "C", "D", "F"
  credits: number;
  semester?: string;
  year?: number;
}

// Grade to point mapping (standard 4.0 scale)
const GRADE_POINTS: { [key: string]: number } = {
  A: 4.0,
  B: 3.0,
  C: 2.0,
  D: 1.0,
  F: 0.0,
};

/**
 * Calculate cumulative GPA from a list of courses
 * @param courses - Array of courses with grade and credits
 * @returns Cumulative GPA (0.0 to 4.0) or 0 if no courses
 */
export function calculateGPA(courses: Course[]): number {
  try {
    if (!courses || courses.length === 0) {
      console.log('[GPA Calculator] No courses provided, returning 0.0');
      return 0.0;
    }

    console.log('[GPA Calculator] Processing', courses.length, 'courses');
    let totalGradePoints = 0;
    let totalCredits = 0;

    courses.forEach((course, idx) => {
      try {
        console.log(`[GPA Calculator] Course ${idx}:`, { 
          id: course.id, 
          course_name: course.course_name, 
          grade: course.grade,
          credits: course.credits,
          type: typeof course.credits
        });
        
        const gradePoint = GRADE_POINTS[course.grade] ?? 0;
        const credits = parseFloat(String(course.credits)) || 0;

        console.log(`[GPA Calculator] Calculated for course ${idx}:`, { gradePoint, credits });
        
        totalGradePoints += gradePoint * credits;
        totalCredits += credits;
      } catch (err) {
        console.error(`[GPA Calculator] Error processing course ${idx}:`, err, course);
      }
    });

    console.log('[GPA Calculator] Totals:', { totalGradePoints, totalCredits });

    if (totalCredits === 0) {
      console.log('[GPA Calculator] Total credits is 0, returning 0.0');
      return 0.0;
    }

    const gpa = totalGradePoints / totalCredits;
    const rounded = Math.round(gpa * 100) / 100;
    console.log('[GPA Calculator] Final GPA:', { gpa, rounded });
    
    return rounded;
  } catch (err) {
    console.error('[GPA Calculator] Fatal error calculating GPA:', err);
    return 0.0;
  }
}

/**
 * Calculate total credits
 * @param courses - Array of courses
 * @returns Sum of all credits
 */
export function calculateTotalCredits(courses: Course[]): number {
  try {
    if (!courses || courses.length === 0) {
      console.log('[Total Credits Calculator] No courses provided, returning 0');
      return 0;
    }

    console.log('[Total Credits Calculator] Processing', courses.length, 'courses');
    
    const total = courses.reduce((sum, course, idx) => {
      try {
        const credits = parseFloat(String(course.credits)) || 0;
        console.log(`[Total Credits Calculator] Course ${idx} credits:`, credits);
        return sum + credits;
      } catch (err) {
        console.error(`[Total Credits Calculator] Error processing course ${idx}:`, err, course);
        return sum;
      }
    }, 0);

    const rounded = Math.round(total * 10) / 10;
    console.log('[Total Credits Calculator] Final total:', { total, rounded });
    
    return rounded;
  } catch (err) {
    console.error('[Total Credits Calculator] Fatal error:', err);
    return 0;
  }
}

/**
 * Get grade scale legend
 * @returns Object mapping grades to points
 */
export function getGradeScale(): { [key: string]: number } {
  return { ...GRADE_POINTS };
}

/**
 * Validate course grade
 * @param grade - Grade to validate
 * @returns true if valid, false otherwise
 */
export function isValidGrade(grade: string): boolean {
  return Object.keys(GRADE_POINTS).includes(grade);
}
