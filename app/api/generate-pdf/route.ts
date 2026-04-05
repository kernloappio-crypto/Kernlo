import { NextRequest, NextResponse } from "next/server";

interface SubjectEntry {
  id: string;
  date: string;
  subject: string;
  platform: string;
  topics: string;
  duration: string;
}

interface PDFRequest {
  childName: string;
  reportType: "daily" | "weekly";
  subjects: SubjectEntry[];
  notes: string;
  reportContent: string;
  generatedDate: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: PDFRequest = await req.json();

    // Build the activities section HTML
    let activitiesHTML = "";

    if (body.reportType === "weekly") {
      // Group by date
      const byDate: { [key: string]: SubjectEntry[] } = {};
      body.subjects.forEach((subject: SubjectEntry) => {
        if (!byDate[subject.date]) byDate[subject.date] = [];
        byDate[subject.date].push(subject);
      });

      Object.keys(byDate)
        .sort()
        .forEach((date: string) => {
          const dateObj = new Date(date);
          const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
          const formattedDate = dateObj.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });

          activitiesHTML += `
            <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #ddd;">
              <div style="font-weight: 600; color: #000; margin-bottom: 10px;">${dayName}, ${formattedDate}</div>
          `;

          byDate[date].forEach((subject: SubjectEntry) => {
            activitiesHTML += `
              <div style="margin-bottom: 8px; margin-left: 10px;">
                <div><span style="font-weight: 600; color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; width: 80px;">Subject:</span> <span style="color: #1a1a1a;">${subject.subject}</span></div>
                <div><span style="font-weight: 600; color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; width: 80px;">Platform:</span> <span style="color: #1a1a1a;">${subject.platform}</span></div>
                <div><span style="font-weight: 600; color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; width: 80px;">Topics:</span> <span style="color: #1a1a1a;">${subject.topics}</span></div>
                <div><span style="font-weight: 600; color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; width: 80px;">Duration:</span> <span style="color: #1a1a1a;">${subject.duration} hrs</span></div>
              </div>
            `;
          });

          activitiesHTML += `</div>`;
        });
    } else {
      // Daily format
      body.subjects.forEach((subject: SubjectEntry) => {
        const dateObj = new Date(subject.date);
        const formattedDate = dateObj.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        activitiesHTML += `
          <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #ddd;">
            <div><span style="font-weight: 600; color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; width: 80px;">Date:</span> <span style="color: #1a1a1a;">${formattedDate}</span></div>
            <div><span style="font-weight: 600; color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; width: 80px;">Subject:</span> <span style="color: #1a1a1a;">${subject.subject}</span></div>
            <div><span style="font-weight: 600; color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; width: 80px;">Platform:</span> <span style="color: #1a1a1a;">${subject.platform}</span></div>
            <div><span style="font-weight: 600; color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; width: 80px;">Topics:</span> <span style="color: #1a1a1a;">${subject.topics}</span></div>
            <div><span style="font-weight: 600; color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; width: 80px;">Duration:</span> <span style="color: #1a1a1a;">${subject.duration} min</span></div>
          </div>
        `;
      });
    }

    if (body.notes) {
      activitiesHTML += `
        <div style="margin-top: 12px;"><span style="font-weight: 600; color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; width: 80px;">Notes:</span> <span style="color: #1a1a1a;">${body.notes}</span></div>
      `;
    }

    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #1a1a1a;
              line-height: 1.6;
              padding: 0;
              margin: 0;
            }
            .container {
              width: 100%;
              max-width: 850px;
              padding: 40px;
              box-sizing: border-box;
              background: white;
            }
            .header {
              border-bottom: 2px solid #000;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .metadata {
              display: flex;
              justify-content: space-between;
              margin-top: 15px;
              font-size: 12px;
              color: #555;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 14px;
              font-weight: 600;
              margin-bottom: 12px;
              color: #000;
            }
            .activity-box {
              background: #f9f9f9;
              padding: 15px;
              border-radius: 4px;
              border: 1px solid #e5e5e5;
              font-size: 12px;
            }
            .activity-item {
              margin-bottom: 8px;
            }
            .label {
              font-weight: 600;
              color: #666;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              display: inline-block;
              width: 80px;
            }
            .value {
              color: #1a1a1a;
            }
            .section-content {
              font-size: 12px;
              color: #333;
              line-height: 1.6;
              text-align: justify;
              white-space: pre-wrap;
              word-break: break-word;
            }
            .footer {
              margin-top: 40px;
              padding-top: 15px;
              border-top: 1px solid #ddd;
              font-size: 10px;
              color: #999;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Learning Progress Report</h1>
              <div class="metadata">
                <div><span class="label">Student:</span> <span class="value">${body.childName}</span></div>
                <div><span class="label">Date:</span> <span class="value">${body.generatedDate}</span></div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">${body.reportType === "weekly" ? "Learning by Day" : "Learning Activities"}</div>
              <div class="activity-box">
                ${activitiesHTML}
              </div>
            </div>

            <div class="section">
              <div class="section-title">Learning Assessment</div>
              <div class="section-content">${body.reportContent}</div>
            </div>

            <div class="footer">
              Generated by Kernlo • kernlo.app
            </div>
          </div>
        </body>
      </html>
    `;

    // For now, return HTML as downloadable file
    // In production, use a PDF library like puppeteer or similar
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${body.childName}-progress-report.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
