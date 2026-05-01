import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportId } = await params;
    console.log("🔍 [download-report] Endpoint called with reportId:", reportId);

    // Fetch report metadata from generated_reports table
    const { data: reportMetadata, error: metadataError } = await supabase
      .from("generated_reports")
      .select("*")
      .eq("id", reportId)
      .single();

    console.log("🔍 [download-report] Generated reports query result:", {
      found: !!reportMetadata,
      id: reportMetadata?.id,
      childName: reportMetadata?.child_name,
      dateRange: `${reportMetadata?.start_date} to ${reportMetadata?.end_date}`,
      error: metadataError,
    });

    if (metadataError || !reportMetadata) {
      console.error("❌ [download-report] Report metadata not found:", metadataError);
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    const {
      user_id,
      kid_id,
      child_name,
      start_date,
      end_date,
      selected_subjects = [],
      selected_activity_types = ["Core Subject", "Extracurricular", "Field Trip / Enrichment"],
    } = reportMetadata;

    // Fetch activities for the kid within the date range
    const { data: activities = [] } = await supabase
      .from("activities")
      .select("*")
      .eq("user_id", user_id)
      .eq("child_name", child_name)
      .gte("date", start_date)
      .lte("date", end_date);

    // Fetch extracurricular activities
    const { data: extracurricularActivities = [] } = await supabase
      .from("extracurricular_activities")
      .select("*")
      .eq("user_id", user_id)
      .eq("kid_id", kid_id)
      .gte("date", start_date)
      .lte("date", end_date);

    // Fetch field trips
    const { data: fieldTrips = [] } = await supabase
      .from("field_trips")
      .select("*")
      .eq("user_id", user_id)
      .eq("kid_id", kid_id)
      .gte("date", start_date)
      .lte("date", end_date);

    console.log("📊 [download-report] Activity counts fetched:", {
      coreSubjects: activities?.length || 0,
      extracurricular: extracurricularActivities?.length || 0,
      fieldTrips: fieldTrips?.length || 0,
    });

    // Build summaries for AI prompt
    let coreSubjectsSummary = "";
    if (activities && activities.length > 0) {
      const subjectMap: { [key: string]: any[] } = {};
      activities.forEach((activity: any) => {
        const subject = activity.subject || "Other";
        if (!subjectMap[subject]) {
          subjectMap[subject] = [];
        }
        subjectMap[subject].push(activity);
      });

      coreSubjectsSummary = Object.entries(subjectMap)
        .map(([subject, acts]) => {
          const totalHours = (acts as any[]).reduce((sum, a) => sum + (a.duration || 0), 0);
          const platformSet = new Set((acts as any[]).map((a) => a.platform));
          const platforms = Array.from(platformSet).join(", ");
          return `${subject}: ${totalHours} hours (${acts.length} sessions) via ${platforms || "various platforms"}`;
        })
        .join("\n");
    }

    let extracurricularSummary = "";
    if (extracurricularActivities && extracurricularActivities.length > 0) {
      extracurricularSummary = extracurricularActivities
        .map((activity: any) => `${activity.activity_name}: ${activity.notes || ""}`)
        .join("\n");
    }

    let fieldTripsSummary = "";
    if (fieldTrips && fieldTrips.length > 0) {
      fieldTripsSummary = fieldTrips
        .map((trip: any) => `${trip.location}: ${trip.date} - ${trip.notes || ""}`)
        .join("\n");
    }

    // Build AI prompt
    const prompt = `
Student: ${child_name}
Period: ${start_date} to ${end_date}

Core Subject Activities:
${coreSubjectsSummary || "No core subject activities recorded"}

${
  extracurricularSummary
    ? `Extracurricular Activities:
${extracurricularSummary}`
    : ""
}

${
  fieldTripsSummary
    ? `Field Trips & Enrichment:
${fieldTripsSummary}`
    : ""
}

Create a narrative-style report that:
1. Opens with a summary of learning progress
2. Details accomplishments in each subject
3. Mentions extracurricular activities and their educational value
4. References field trips and enrichment experiences
5. Highlights engagement and effort across all areas
6. Notes any challenges or areas for growth
7. Concludes with recommendations for continued learning

Format as professional homeschool compliance documentation. Include mentions of extracurricular and field trip experiences in the narrative, demonstrating well-rounded education.`;

    // Call generate-report API to get the narrative
    let narrative = "";
    try {
      console.log("🤖 [download-report] Calling generate-report API...");
      const reportResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/generate-report`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            studentName: child_name,
            startDate: start_date,
            endDate: end_date,
          }),
        }
      );

      console.log("🤖 [download-report] generate-report response status:", reportResponse.status);

      if (reportResponse.ok) {
        const reportData = await reportResponse.json();
        narrative = reportData.narrative || "";
        console.log("🤖 [download-report] Narrative generated successfully, length:", narrative.length);
      } else {
        console.warn("⚠️ [download-report] Failed to generate narrative from AI, using fallback");
        narrative =
          "A comprehensive report of the student's progress during the specified period. The student engaged in various learning activities across multiple subjects and participated in enrichment experiences.";
      }
    } catch (error) {
      console.warn("⚠️ [download-report] Error calling generate-report API:", error);
      narrative =
        "A comprehensive report of the student's progress during the specified period. The student engaged in various learning activities across multiple subjects and participated in enrichment experiences.";
    }

    // Generate PDF
    console.log("📄 [download-report] Creating PDF document...");
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
    doc.text(`Student: ${child_name}`, marginLeft, yPosition);
    yPosition += 6;
    doc.text(`Period: ${start_date} to ${end_date}`, marginLeft, yPosition);
    yPosition += 6;
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, marginLeft, yPosition);
    yPosition += 12;

    // Narrative
    doc.setFontSize(10);
    const narrativeLines = (doc.splitTextToSize(
      narrative,
      pageWidth - marginLeft - marginRight
    )) as string[];
    narrativeLines.forEach((line) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = marginTop;
      }
      doc.text(line, marginLeft, yPosition);
      yPosition += 5;
    });

    // Return PDF
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    const filename = `${child_name}-report-${start_date}-${end_date}.pdf`;
    
    console.log("📄 [download-report] PDF created successfully:", {
      size: pdfBuffer.length,
      filename,
      pages: (doc as any).internal.pages.length,
    });
    console.log("📦 [download-report] Response headers:", {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": pdfBuffer.length,
    });

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("❌ [download-report] CRITICAL ERROR generating report PDF:", {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Failed to generate report PDF" },
      { status: 500 }
    );
  }
}
