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
  if (!courses || courses.length === 0) {
    return 0.0;
  }

  let totalGradePoints = 0;
  let totalCredits = 0;

  courses.forEach((course) => {
    const gradePoint = GRADE_POINTS[course.grade] ?? 0;
    const credits = parseFloat(String(course.credits)) || 0;

    totalGradePoints += gradePoint * credits;
    totalCredits += credits;
  });

  if (totalCredits === 0) {
    return 0.0;
  }

  const gpa = totalGradePoints / totalCredits;
  // Round to 2 decimal places
  return Math.round(gpa * 100) / 100;
}

/**
 * Calculate total credits
 * @param courses - Array of courses
 * @returns Sum of all credits
 */
export function calculateTotalCredits(courses: Course[]): number {
  if (!courses || courses.length === 0) {
    return 0;
  }

  const total = courses.reduce((sum, course) => {
    return sum + (parseFloat(String(course.credits)) || 0);
  }, 0);

  return Math.round(total * 10) / 10; // Round to 1 decimal place
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
