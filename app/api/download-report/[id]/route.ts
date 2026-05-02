import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jsPDF from 'jspdf';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportId } = await params;
    console.log(`🔍 Download endpoint called for report: ${reportId}`);

    // Fetch report metadata
    const { data: report, error: reportError } = await supabase
      .from('generated_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      console.error('❌ Report not found:', reportError);
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    console.log(`📊 Report found:`, {
      id: report.id,
      childName: report.child_name,
      dateRange: report.date_range,
    });

    // Fetch activities for the kid within date range
    const startDate = report.start_date;
    const endDate = report.end_date;

    let activities: any[] = [];
    let extracurricular: any[] = [];
    let fieldTrips: any[] = [];

    // Fetch core subject activities
    if (report.selected_activity_types?.includes('Core Subject')) {
      const { data } = await supabase
        .from('activities')
        .select('*')
        .eq('kid_id', report.kid_id)
        .gte('date', startDate)
        .lte('date', endDate);
      activities = data || [];
    }

    // Fetch extracurricular
    if (report.selected_activity_types?.includes('Extracurricular')) {
      const { data } = await supabase
        .from('extracurricular_activities')
        .select('*')
        .eq('kid_id', report.kid_id)
        .gte('date', startDate)
        .lte('date', endDate);
      extracurricular = data || [];
    }

    // Fetch field trips
    if (report.selected_activity_types?.includes('Field Trips')) {
      const { data } = await supabase
        .from('field_trips')
        .select('*')
        .eq('kid_id', report.kid_id)
        .gte('date', startDate)
        .lte('date', endDate);
      fieldTrips = data || [];
    }

    console.log(`📊 Activities fetched:`, {
      coreSubjects: activities.length,
      extracurricular: extracurricular.length,
      fieldTrips: fieldTrips.length,
    });

    // Create simple narrative
    let narrative = `Progress Report for ${report.child_name}\n\n`;
    narrative += `Period: ${report.date_range}\n\n`;
    narrative += `Activities Completed:\n\n`;

    if (activities.length > 0) {
      narrative += `Core Subjects (${activities.length}):\n`;
      activities.forEach((a: any) => {
        narrative += `- ${a.date}: ${a.subject} (${a.duration}h)\n`;
      });
      narrative += '\n';
    }

    if (extracurricular.length > 0) {
      narrative += `Extracurricular (${extracurricular.length}):\n`;
      extracurricular.forEach((a: any) => {
        narrative += `- ${a.date}: ${a.activity_name}\n`;
      });
      narrative += '\n';
    }

    if (fieldTrips.length > 0) {
      narrative += `Field Trips (${fieldTrips.length}):\n`;
      fieldTrips.forEach((a: any) => {
        narrative += `- ${a.date}: ${a.trip_name}\n`;
      });
      narrative += '\n';
    }

    // Create PDF
    const doc = new jsPDF();
    let yPosition = 20;

    doc.setFontSize(16);
    doc.text('COMPREHENSIVE PROGRESS REPORT', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.text(`Student: ${report.child_name}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Period: ${report.date_range}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Generated: ${new Date(report.date_generated).toLocaleDateString()}`, 20, yPosition);
    yPosition += 15;

    // Add narrative with word wrapping
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidth = 170;
    const lines = doc.splitTextToSize(narrative, maxWidth);

    lines.forEach((line: string) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, 20, yPosition);
      yPosition += 5;
    });

    // Convert to bytes
    const pdfBytes = Buffer.from(doc.output('arraybuffer'));

    console.log(`📄 PDF created, size: ${pdfBytes.length} bytes`);

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${report.child_name}-report-${report.start_date}-${report.end_date}.pdf"`,
        'Content-Length': pdfBytes.length.toString(),
      },
    });
  } catch (err) {
    console.error('❌ Download endpoint error:', err);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
