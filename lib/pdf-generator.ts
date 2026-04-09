import jsPDF from "jspdf";

interface Report {
  id: string;
  child_name: string;
  report_type: "daily" | "weekly";
  generated_date: string;
  subjects: Array<{
    id: string;
    date: string;
    subject: string;
    platform: string;
    topics: string;
    duration: string;
  }>;
  report_content: string;
  notes?: string;
}

export function generateComprehensiveReport(
  reports: Report[],
  childName: string,
  subjects: string[],
  startDate: string,
  endDate: string
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;
  const margin = 15;
  const lineHeight = 7;
  const maxWidth = pageWidth - 2 * margin;

  // Title
  doc.setFontSize(20);
  doc.setTextColor(0, 102, 204);
  doc.text(`${childName} - Progress Report`, margin, yPosition);
  yPosition += 12;

  // Date range
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  const dateStr = `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
  doc.text(`Report Period: ${dateStr}`, margin, yPosition);
  yPosition += 10;

  // Filter reports by date range and subjects
  const filteredReports = reports.filter((report) => {
    const reportDate = new Date(report.generated_date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return (
      reportDate >= start &&
      reportDate <= end &&
      report.subjects.some((s) => subjects.includes(s.subject))
    );
  });

  if (filteredReports.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(150, 150, 150);
    doc.text("No reports found for the selected period and subjects.", margin, yPosition);
    return doc;
  }

  // Group reports by subject
  const reportsBySubject: { [key: string]: Report[] } = {};
  subjects.forEach((subject) => {
    reportsBySubject[subject] = filteredReports.filter((r) =>
      r.subjects.some((s) => s.subject === subject)
    );
  });

  // Generate sections per subject
  Object.entries(reportsBySubject).forEach(([subject, subjectReports]) => {
    if (subjectReports.length === 0) return;

    // Check if we need a new page
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = 20;
    }

    // Subject header
    doc.setFontSize(14);
    doc.setTextColor(0, 102, 204);
    doc.text(subject, margin, yPosition);
    yPosition += 8;

    // Subject reports
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);

    subjectReports.forEach((report) => {
      const subjectDetails = report.subjects.filter((s) => s.subject === subject);

      subjectDetails.forEach((detail) => {
        if (yPosition > pageHeight - 25) {
          doc.addPage();
          yPosition = 20;
        }

        // Report info
        const hours = (parseInt(detail.duration) || 0) / 60;
        const infoText = `${new Date(report.generated_date).toLocaleDateString()} | ${hours.toFixed(1)}h | ${detail.platform}`;
        doc.text(infoText, margin, yPosition);
        yPosition += 6;

        // Topics
        if (detail.topics) {
          doc.setTextColor(100, 100, 100);
          const topicsText = `Topics: ${detail.topics}`;
          const wrappedTopics = doc.splitTextToSize(topicsText, maxWidth);
          doc.text(wrappedTopics, margin, yPosition);
          yPosition += wrappedTopics.length * lineHeight + 2;
        }

        // Report content if available
        if (report.report_content && report.report_content.length > 0) {
          doc.setTextColor(80, 80, 80);
          const contentText = `${report.report_content}`;
          const wrappedContent = doc.splitTextToSize(contentText, maxWidth);
          doc.text(wrappedContent, margin, yPosition);
          yPosition += wrappedContent.length * lineHeight + 4;
        }

        doc.setTextColor(50, 50, 50);
        yPosition += 2;
      });
    });

    yPosition += 8;
  });

  return doc;
}
