import { NextRequest, NextResponse } from "next/server";

interface ReportRequest {
  childName: string;
  reportType: "daily" | "weekly";
  subject: string;
  activity: string;
  specificTopics: string;
  duration: string;
  notes: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: ReportRequest = await req.json();

    // Validate input
    if (!body.childName || !body.subject || !body.activity || !body.duration || !body.specificTopics) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Call OpenAI to generate report
    const durationText = body.reportType === "weekly" 
      ? `${body.duration} hours`
      : `${body.duration} minutes`;

    const reportPeriod = body.reportType === "weekly" ? "this week" : "today";

    const prompt = `Generate a professional homeschool progress report based on this information:
    
Child's Name: ${body.childName}
Report Type: ${body.reportType === "weekly" ? "Weekly" : "Daily"}
Subject: ${body.subject}
Platform/Resource: ${body.activity}
Specific Topics Covered: ${body.specificTopics}
Duration: ${durationText}
Additional Notes: ${body.notes || "None"}

Format the report professionally with:
1. A comprehensive summary of what was covered (specifically mention the topics listed above)
2. Specific skills developed or reinforced
3. Time spent and engagement level
4. Assessment/observations about understanding and performance
5. Recommendations for building on this learning

Keep it concise but detailed (3-4 paragraphs). Make it suitable for school district submission.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI error:", await response.text());
      return NextResponse.json(
        { error: "Failed to generate report" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const report = data.choices[0].message.content;

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
