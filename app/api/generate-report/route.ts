import { NextRequest, NextResponse } from "next/server";

interface SubjectEntry {
  id: string;
  subject: string;
  platform: string;
  topics: string;
  duration: string;
}

interface ReportRequest {
  childName: string;
  reportType: "daily" | "weekly";
  subjects: SubjectEntry[];
  notes: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: ReportRequest = await req.json();

    // Validate input
    if (!body.childName || !body.subjects || body.subjects.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate each subject has required fields
    for (const subject of body.subjects) {
      if (!subject.subject || !subject.platform || !subject.topics || !subject.duration) {
        return NextResponse.json(
          { error: "All subject fields are required" },
          { status: 400 }
        );
      }
    }

    // Format subjects for the prompt
    const subjectsText = body.subjects.map((s) => {
      const duration = body.reportType === "weekly" ? `${s.duration} hours` : `${s.duration} minutes`;
      return `Subject: ${s.subject}\nPlatform: ${s.platform}\nTopics: ${s.topics}\nDuration: ${duration}`;
    }).join("\n\n");

    const reportPeriod = body.reportType === "weekly" ? "this week" : "today";

    const prompt = `Generate a professional homeschool progress report based on this information:
    
Child's Name: ${body.childName}
Report Type: ${body.reportType === "weekly" ? "Weekly" : "Daily"}

Learning Activities:
${subjectsText}

Additional Notes: ${body.notes || "None"}

Format the report professionally with:
1. An overall summary of learning activities covered ${reportPeriod} (include all subjects and specific topics)
2. Skills developed and concepts mastered across all subjects
3. Engagement, effort, and progress observations
4. Strengths demonstrated
5. Areas for continued focus and recommendations for next steps

The report should synthesize all subjects into a cohesive narrative suitable for school district submission. Keep it detailed but concise (4-5 paragraphs).`;

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
