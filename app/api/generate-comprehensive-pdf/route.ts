import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";

interface Subject {
  id: string;
  date: string;
  subject: string;
  platform: string;
  topics: string;
  duration: string;
}

interface Report {
  id: string;
  child_name: string;
  report_type: string;
  generated_date: string;
  subjects: Subject[];
  report_content: string;
  notes?: string;
}

interface ComprehensiveRequest {
  childName: string;
  subjects: string[];
  reports: Report[];
  dateRange: { start: string; end: string };
}

export async function POST(req: NextRequest) {
  try {
    const body: ComprehensiveRequest = await req.json();

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    let yPos = 20;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;

    // Header
    pdf.setFontSize(24);
    pdf.setTextColor(0, 102, 204);
    pdf.text("Comprehensive Learning Report", margin, yPos);

    yPos += 15;
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Student: ${body.childName}`, margin, yPos);
    yPos += 6;
    pdf.text(
      `Period: ${new Date(body.dateRange.start).toLocaleDateString()} to ${new Date(body.dateRange.end).toLocaleDateString()}`,
      margin,
      yPos
    );

    yPos += 12;
    pdf.setDrawColor(0, 102, 204);
    pdf.line(margin, yPos, pageWidth - margin, yPos);

    yPos += 8;

    // Summary Statistics
    const totalReports = body.reports.length;
    const totalHours = body.reports.reduce(
      (sum, r) =>
        sum +
        r.subjects.reduce(
          (s, sub) => s + (parseInt(sub.duration) || 0) / 60,
          0
        ),
      0
    );

    pdf.setFontSize(12);
    pdf.setTextColor(26, 26, 46);
    pdf.setFont("helvetica", "bold");
    pdf.text("Summary", margin, yPos);
    yPos += 8;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(60, 60, 60);
    pdf.text(`Total Reports: ${totalReports}`, margin + 3, yPos);
    yPos += 5;
    pdf.text(`Total Hours: ${totalHours.toFixed(1)}`, margin + 3, yPos);
    yPos += 5;
    pdf.text(`Subjects: ${body.subjects.join(", ")}`, margin + 3, yPos);

    yPos += 10;
    pdf.setDrawColor(230, 230, 230);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    // Subject Sections
    body.subjects.forEach((subjectName, subjectIndex) => {
      if (yPos > 250) {
        pdf.addPage();
        yPos = 20;
      }

      // Subject Header
      pdf.setFontSize(14);
      pdf.setTextColor(26, 26, 46);
      pdf.setFont("helvetica", "bold");
      pdf.text(subjectName, margin, yPos);
      yPos += 8;

      // Get reports for this subject
      const subjectReports = body.reports.filter((r) =>
        r.subjects.some((s) => s.subject === subjectName)
      );

      if (subjectReports.length === 0) {
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(150, 150, 150);
        pdf.text("No reports for this subject in the selected period.", margin + 3, yPos);
        yPos += 10;
      } else {
        // Subject Statistics
        const subjectHours = subjectReports.reduce(
          (sum, r) =>
            sum +
            r.subjects
              .filter((s) => s.subject === subjectName)
              .reduce((s, sub) => s + (parseInt(sub.duration) || 0) / 60, 0),
          0
        );

        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(100, 100, 100);
        pdf.text(`${subjectReports.length} reports • ${subjectHours.toFixed(1)} hours`, margin + 3, yPos);
        yPos += 6;

        // Reports List
        subjectReports.forEach((report, reportIdx) => {
          if (yPos > 260) {
            pdf.addPage();
            yPos = 20;
          }

          const reportDate = new Date(report.generated_date).toLocaleDateString(
            "en-US",
            { month: "short", day: "numeric", year: "numeric" }
          );

          pdf.setFontSize(9);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(0, 102, 204);
          pdf.text(
            `${report.report_type === "weekly" ? "📅 Weekly" : "📝 Daily"} - ${reportDate}`,
            margin + 5,
            yPos
          );
          yPos += 5;

          // Activities
          const subjectData = report.subjects.find((s) => s.subject === subjectName);
          if (subjectData) {
            pdf.setFontSize(8);
            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(60, 60, 60);
            pdf.text(`Platform: ${subjectData.platform}`, margin + 8, yPos);
            yPos += 3;
            pdf.text(`Duration: ${subjectData.duration} min`, margin + 8, yPos);
            yPos += 3;
            pdf.text(`Topics: ${subjectData.topics}`, margin + 8, yPos);
            yPos += 5;
          }

          // Assessment
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(60, 60, 60);
          const splitText = pdf.splitTextToSize(report.report_content, contentWidth - 10);
          const textHeight = Math.min(splitText.length * 3, 30);

          if (yPos + textHeight > 260) {
            pdf.addPage();
            yPos = 20;
          }

          pdf.text(splitText.slice(0, 10), margin + 8, yPos);
          yPos += textHeight;
          yPos += 4;
        });
      }

      if (subjectIndex < body.subjects.length - 1) {
        yPos += 4;
        pdf.setDrawColor(230, 230, 230);
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 8;
      }
    });

    // Footer
    const pageCount = pdf.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `Generated by Kernlo • kernlo.app`,
        pageWidth / 2,
        pdf.internal.pageSize.getHeight() - 8,
        { align: "center" }
      );
    }

    const pdfBuffer = Buffer.from(pdf.output("arraybuffer"));

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${body.childName}-comprehensive-report.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF", details: String(error) },
      { status: 500 }
    );
  }
}
