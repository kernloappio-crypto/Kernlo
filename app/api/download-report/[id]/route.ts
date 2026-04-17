import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Fetch report from database
    const { data: report, error } = await supabase
      .from("reports")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    // Generate PDF dynamically
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginLeft = 15;
    const marginRight = 15;
    const marginTop = 15;
    let yPosition = marginTop;

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("COMPREHENSIVE PROGRESS REPORT", marginLeft, yPosition);
    yPosition += 10;

    // Student info
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Student: ${report.child_name}`, marginLeft, yPosition);
    yPosition += 6;
    doc.text(`Period: ${report.start_date} to ${report.end_date}`, marginLeft, yPosition);
    yPosition += 6;
    doc.text(`Generated: ${new Date(report.generated_date).toLocaleDateString()}`, marginLeft, yPosition);
    yPosition += 12;

    // Narrative
    doc.setFontSize(10);
    const narrativeLines = (doc.splitTextToSize(report.report_content, pageWidth - marginLeft - marginRight)) as string[];
    narrativeLines.forEach((line) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = marginTop;
      }
      doc.text(line, marginLeft, yPosition);
      yPosition += 5;
    });

    yPosition += 8;

    // Summary
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = marginTop;
    }
    doc.text("REPORT SUMMARY", marginLeft, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Subjects: ${report.subjects}`, marginLeft, yPosition);
    yPosition += 6;
    doc.text(`Generated: ${new Date(report.generated_date).toLocaleDateString()}`, marginLeft, yPosition);

    // Return PDF
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${report.child_name}-report-${report.start_date}-${report.end_date}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating report PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate report PDF" },
      { status: 500 }
    );
  }
}
