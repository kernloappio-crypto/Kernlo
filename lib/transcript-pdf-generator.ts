/**
 * Transcript PDF Generator
 * Generates professional homeschool transcripts with state-specific variants
 */

import jsPDF from 'jspdf';
import { calculateGPA, calculateTotalCredits, getGradeScale } from './gpa-calculator';

interface Course {
  id: string;
  course_name: string;
  description?: string;
  credits: number;
  grade: string;
  hours?: number;
  semester: string;
  year: number;
}

interface Kid {
  id: string;
  name: string;
  age?: number;
  grade?: string;
  dob?: string;
  graduation_date?: string;
}

interface Parent {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  address?: string;
  phone?: string;
  homeschool_name?: string;
  home_school_name?: string;
  website?: string;
}

const COLORS = {
  primary: '#0066cc',
  darkText: '#1a1a2e',
  lightText: '#666666',
  border: '#dddddd',
  lightBg: '#f0f7ff',
};

const STATE_REQUIREMENTS: { [key: string]: any } = {
  CA: {
    name: 'California',
    includeHours: false,
    disclaimer: 'This homeschool operates as a private educational entity in accordance with California Education Code § 33190.',
  },
  TX: {
    name: 'Texas',
    includeHours: false,
    disclaimer: 'This transcript certifies completion of a bona fide homeschool curriculum in accordance with Texas Education Code § 25.086(d).',
  },
  FL: {
    name: 'Florida',
    includeHours: true,
    disclaimer: 'This transcript documents compliance with Florida Statute § 1002.41 (homeschool hours requirement: 1,000 hours per year).',
  },
  NY: {
    name: 'New York',
    includeHours: true,
    disclaimer: 'This transcript documents compliance with New York Education Law § 3204 (home instruction program with required hours and assessments).',
  },
};

/**
 * Generate professional transcript PDF
 * @param kid - Student info
 * @param parent - Parent/homeschool info
 * @param courses - Array of courses taken
 * @param state - State code (CA, TX, FL, NY)
 * @returns jsPDF document
 */
export function generateTranscriptPDF(
  kid: Kid,
  parent: Parent,
  courses: Course[],
  state: string = 'CA'
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const lineHeight = 5;
  let yPos = margin;

  const stateConfig = STATE_REQUIREMENTS[state] || STATE_REQUIREMENTS.CA;
  const includeHours = stateConfig.includeHours;

  // ===== HEADER: School/Parent Info =====
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 102, 204);
  doc.text(parent.homeschool_name || parent.home_school_name || 'Homeschool', margin, yPos);
  yPos += 7;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(102, 102, 102);
  const parentName = `${parent.first_name} ${parent.last_name}`;
  doc.text(parentName, margin, yPos);
  yPos += 5;

  if (parent.address) {
    doc.text(parent.address, margin, yPos);
    yPos += 5;
  }

  if (parent.phone) {
    doc.text(`Phone: ${parent.phone}`, margin, yPos);
    yPos += 5;
  }

  yPos += 3;

  // ===== STUDENT INFO =====
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(26, 26, 46);
  doc.text('Student Information', margin, yPos);
  yPos += 6;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(102, 102, 102);

  const lines = [
    [`Name: ${kid.name}`],
    kid.dob ? [`Date of Birth: ${new Date(kid.dob).toLocaleDateString()}`] : [],
    kid.graduation_date ? [`Expected Graduation: ${new Date(kid.graduation_date).toLocaleDateString()}`] : [],
  ];

  lines.flat().forEach((line) => {
    if (line) {
      doc.text(line, margin, yPos);
      yPos += 5;
    }
  });

  yPos += 4;

  // ===== COURSE TABLE =====
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(26, 26, 46);
  doc.text('Academic Record', margin, yPos);
  yPos += 8;

  // Table headers
  const headerStartY = yPos;
  const col1X = margin;
  const col2X = margin + 65;
  const col3X = margin + 90;
  const col4X = includeHours ? margin + 110 : pageWidth - margin - 20;

  // Draw header background
  doc.setFillColor(240, 247, 255);
  doc.rect(margin, headerStartY - 4, pageWidth - 2 * margin, 6, 'F');

  // Header text
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(26, 26, 46);
  doc.text('Course Name', col1X, yPos);
  doc.text('Credits', col2X, yPos);
  doc.text('Grade', col3X, yPos);
  if (includeHours) {
    doc.text('Hours', col4X, yPos);
  }

  yPos += 7;

  // Course rows
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(26, 26, 46);

  courses.forEach((course) => {
    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = margin;
    }

    // Alternate row colors for readability
    if (courses.indexOf(course) % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, yPos - 3, pageWidth - 2 * margin, 5, 'F');
    }

    const courseName = course.course_name.substring(0, 30);
    doc.text(courseName, col1X, yPos);
    doc.text(course.credits.toString(), col2X, yPos);
    doc.text(course.grade, col3X, yPos);
    if (includeHours && course.hours) {
      doc.text(course.hours.toString(), col4X, yPos);
    }

    yPos += 6;
  });

  yPos += 5;

  // ===== SUMMARY =====
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(26, 26, 46);

  const totalCredits = calculateTotalCredits(courses);
  const gpa = calculateGPA(courses);

  doc.text('Cumulative Summary', margin, yPos);
  yPos += 6;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(102, 102, 102);

  doc.text(`Total Credits Earned: ${totalCredits.toFixed(1)}`, margin + 5, yPos);
  yPos += 5;
  doc.text(`Cumulative GPA: ${gpa.toFixed(2)}`, margin + 5, yPos);
  yPos += 8;

  // ===== GRADE SCALE =====
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(26, 26, 46);
  doc.text('Grade Scale', margin, yPos);
  yPos += 5;

  const gradeScale = getGradeScale();
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(102, 102, 102);

  const gradeText = Object.entries(gradeScale)
    .map(([grade, points]) => `${grade} = ${points.toFixed(1)}`)
    .join('   |   ');

  const wrappedGrades = doc.splitTextToSize(gradeText, pageWidth - 2 * margin);
  doc.text(wrappedGrades, margin, yPos);
  yPos += wrappedGrades.length * lineHeight + 3;

  yPos += 3;

  // ===== STATE DISCLAIMER =====
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(26, 26, 46);
  doc.text('Statement of Completion', margin, yPos);
  yPos += 5;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(102, 102, 102);

  const disclaimerText = `${stateConfig.disclaimer}`;
  const wrappedDisclaimer = doc.splitTextToSize(disclaimerText, pageWidth - 2 * margin - 2);
  doc.text(wrappedDisclaimer, margin + 1, yPos);
  yPos += wrappedDisclaimer.length * lineHeight + 4;

  // ===== STATE-SPECIFIC SECTIONS =====

  // TX: Notary note
  if (state === 'TX') {
    yPos += 2;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(102, 102, 102);
    doc.text('Parent/Guardian Signature:', margin, yPos);
    yPos += 4;
    doc.line(margin, yPos, margin + 40, yPos);
    yPos += 2;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Date: _______________', margin, yPos);
  }

  // CA: Affidavit
  if (state === 'CA') {
    if (yPos > pageHeight - 15) {
      doc.addPage();
      yPos = margin;
    }
    yPos += 2;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(26, 26, 46);
    doc.text('Private School Affidavit (California)', margin, yPos);
    yPos += 4;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(102, 102, 102);
    const affidavitText =
      'This homeschool is operated as a private school and operates in compliance with California Education Code § 33190. The student has been taught courses of study and for the time periods as required by law.';
    const wrappedAffidavit = doc.splitTextToSize(affidavitText, pageWidth - 2 * margin - 2);
    doc.text(wrappedAffidavit, margin + 1, yPos);
  }

  // ===== FOOTER =====
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  const footerText = `Generated ${new Date().toLocaleDateString()} | ${stateConfig.name}`;
  doc.text(footerText, margin, pageHeight - 5);

  return doc;
}

/**
 * Download transcript PDF
 * @param doc - jsPDF document
 * @param kidName - Student name for filename
 */
export function downloadTranscript(doc: jsPDF, kidName: string): void {
  const filename = `${kidName}-Transcript-${new Date().getFullYear()}.pdf`;
  doc.save(filename);
}
