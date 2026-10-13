import { NextRequest, NextResponse } from "next/server";
import { runAiDeduplicationPipeline, IncomingCitizenReport } from "@/lib/ai-dedup-agent";

// Persistent issues registry on globalThis across route invocations
const g = globalThis as any;
if (!g.__civion_server_issues) {
  g.__civion_server_issues = [
    {
      id: "iss-1048",
      code: "CIV-1048",
      title: "Deep hazardous pothole near Indiranagar Metro",
      description: "Large crater under metro pillar 42 right on 100 Feet Road causing vehicle rim damage and severe traffic slowdown.",
      category: "Pothole",
      location: "100 Feet Road, Indiranagar Metro",
      coordinates: [12.9784, 77.6408],
      ward: "Ward 112 - Indiranagar",
      status: "Submitted",
      severity: "critical",
      priorityScore: 92,
      reportedBy: "Anita Das & 3 others",
      reportedAt: "Today, 08:30 AM",
      upvotes: 14,
      hasUpvoted: false,
      slaDeadlineHours: 24,
      slaDeadlineTime: "Within 18 hours",
      beforePhoto: "/images/issues/pothole.jpg",
      fieldNotes: [],
      comments: []
    },
    {
      id: "iss-1038",
      code: "CIV-1038",
      title: "Open stormwater drain cover missing",
      description: "Concrete slab collapsed into stormwater canal, opening a 4-foot deep hazard on the pedestrian walkway near the bus shelter.",
      category: "Drainage",
      location: "8th Cross, Jeevan Bima Nagar",
      coordinates: [12.9654, 77.6582],
      ward: "Ward 114 - Jeevan Bima Nagar",
      status: "Submitted",
      severity: "critical",
      priorityScore: 88,
      reportedBy: "Rohan Verma",
      reportedAt: "Yesterday, 06:15 PM",
      upvotes: 9,
      hasUpvoted: false,
      slaDeadlineHours: 12,
      slaDeadlineTime: "Urgent · 4 hours left",
      beforePhoto: "/images/issues/drain-cover.jpg",
      fieldNotes: [],
      comments: []
    }
  ];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resident_name, resident_contact, description, latitude, longitude, radius_meters } = body;

    if (!description || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: description, latitude, longitude" },
        { status: 400 }
      );
    }

    const report: IncomingCitizenReport = {
      text: description,
      category: "Pothole",
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      residentName: resident_name || "Aarav Sharma",
      residentContact: resident_contact || "+919876543210",
      isUrgent: /skid|hazard|danger|deep|severe|urgent|crater|damage/i.test(description)
    };

    const decision = runAiDeduplicationPipeline(report, g.__civion_server_issues);

    if (decision.action === "merged") {
      const master = decision.targetMasterIssue;
      g.__civion_server_issues = g.__civion_server_issues.map((i: any) => (i.id === master.id ? master : i));

      const numericId = parseInt(master.code.replace(/\D/g, ""), 10) || 1048;

      return NextResponse.json({
        status: "success",
        action_taken: "merged_into_master_issue",
        master_issue_id: numericId,
        report_count: master.reportCount || master.upvotes || 2,
        combined_reports_count: master.combinedReports ? master.combinedReports.length : (master.reportCount || 2),
        title: master.title,
        summary: master.description,
        combined_reports: master.combinedReports
      });
    } else {
      const newIssue = decision.targetMasterIssue;
      g.__civion_server_issues = [newIssue, ...g.__civion_server_issues];

      const numericId = parseInt(newIssue.code.replace(/\D/g, ""), 10) || 1050;

      return NextResponse.json({
        status: "success",
        action_taken: "created_new_master_issue",
        master_issue_id: numericId,
        report_count: 1,
        combined_reports_count: 1,
        title: newIssue.title,
        summary: newIssue.description,
        combined_reports: newIssue.combinedReports
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process civic report" },
      { status: 500 }
    );
  }
}
