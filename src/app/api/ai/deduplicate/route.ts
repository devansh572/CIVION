import { NextRequest, NextResponse } from "next/server";
import { runAiDeduplicationPipeline, IncomingCitizenReport } from "@/lib/ai-dedup-agent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, category, latitude, longitude, photoUrl, residentName, isUrgent, existingIssues } = body;

    if (!text || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: text, latitude, longitude" },
        { status: 400 }
      );
    }

    const report: IncomingCitizenReport = {
      text,
      category,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      photoUrl,
      residentName: residentName || "Citizen Reporter",
      isUrgent: !!isUrgent
    };

    const issuesToCompare = existingIssues || [];

    // If external FastAPI Agent microservice is configured, attempt delegating to it
    const fastApiUrl = process.env.FASTAPI_AGENT_URL;
    if (fastApiUrl) {
      try {
        const fastApiResponse = await fetch(`${fastApiUrl}/api/v1/report`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resident_name: report.residentName,
            resident_contact: body.residentContact || "citizen@civion.org",
            description: report.text,
            latitude: report.latitude,
            longitude: report.longitude,
            radius_meters: 100.0,
          }),
          signal: AbortSignal.timeout(3000),
        });

        if (fastApiResponse.ok) {
          const fastApiData = await fastApiResponse.json();
          return NextResponse.json({
            success: true,
            source: "fastapi_microservice",
            data: fastApiData,
          });
        }
      } catch (err) {
        // Fallback to local embedded pipeline
      }
    }

    const decision = runAiDeduplicationPipeline(report, issuesToCompare);

    return NextResponse.json({
      success: true,
      source: "embedded_pipeline",
      decision: {
        action: decision.action,
        distanceMeters: decision.distanceMeters,
        similarityScore: decision.similarityScore,
        candidateCountInRadius: decision.candidateCountInRadius,
        reSummarized: decision.reSummarized,
        message: decision.message,
        masterIssue: decision.targetMasterIssue
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process deduplication pipeline" },
      { status: 500 }
    );
  }
}
