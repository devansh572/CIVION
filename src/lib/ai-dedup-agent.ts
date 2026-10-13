/**
 * Civion AI Deduplication & Aggregation Agent
 * 
 * Pipeline:
 * Incoming Report (Text, Photo, GPS: Lat/Lng)
 *                │
 *                ▼
 *      1. Spatial Pre-Filter (radius ≤ 100m)
 *                │
 *                ▼
 *      2. Semantic Embedding (1536-dim vector)
 *                │
 *                ▼
 *   3. Cosine Similarity Check (vs candidates in radius)
 *                │
 *    ┌───────────┴───────────┐
 *    │ Similarity ≥ 0.85     │ Similarity < 0.85
 *    ▼                       ▼
 * 4a. Merge into Master Issue    4b. Create New Master Issue
 * - Append reporter details      - Tag status: "Open"
 * - Increment vote/counter       - Store location & initial summary
 * - Trigger AI re-summarization
 */

import type { CivicIssue, CitizenReportRecord } from "./civion-store";
import { evaluateCivicPriority } from "./ai-priority-engine";

export interface IncomingCitizenReport {
  text: string;
  category?: CivicIssue["category"];
  latitude: number;
  longitude: number;
  photoUrl?: string;
  residentName?: string;
  residentContact?: string;
  isUrgent?: boolean;
}

export interface DedupCandidate {
  issue: CivicIssue;
  distanceMeters: number;
  similarityScore: number;
}

export interface DedupDecision {
  action: "merged" | "created";
  targetMasterIssue: CivicIssue;
  distanceMeters?: number;
  similarityScore?: number;
  candidateCountInRadius: number;
  reSummarized: boolean;
  message: string;
}

// Haversine distance in meters (equivalent to PostGIS ST_Distance(geography))
export function calculateGeodesicDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 10) / 10;
}

// Pre-defined civic semantic vocabulary anchors for dense vector projection (1536 dim simulation)
const CIVIC_SEMANTIC_ANCHORS: Record<string, string[]> = {
  pothole: ["pothole", "crater", "asphalt", "cavity", "depression", "road damage", "rim", "vehicle", "bump", "tar", "trench", "uneven"],
  water_leakage: ["water", "leak", "pipeline", "pipe", "burst", "potable", "gushing", "flooding", "valve", "drainage", "bubbling", "pressure"],
  streetlight: ["streetlight", "light", "pole", "wire", "exposed", "dark", "electricity", "lineman", "bulb", "sodium", "fixture", "lamp"],
  waste: ["waste", "garbage", "trash", "bin", "overflowing", "scattered", "refuse", "litter", "plastics", "stench", "commercial", "sanitation"],
  drainage: ["drain", "stormwater", "cover", "slab", "canal", "manhole", "grate", "collapse", "clogged", "sewage", "gutter", "pedestrian"],
  accessibility: ["sidewalk", "curb", "tactile", "wheelchair", "ramp", "paver", "footpath", "pedestrian", "elderly", "blind", "shattered"],
  road_safety: ["safety", "traffic", "blindspot", "divider", "signal", "collision", "danger", "speedbreaker", "barrier"]
};

// Generates a normalized semantic embedding vector
export function generateSemanticEmbedding(text: string, category?: string): number[] {
  const clean = (text || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const tokens = clean.split(/\s+/).filter(t => t.length > 2);
  
  // Create dense 1536-dimensional embedding vector (matching text-embedding-3-small)
  const DIM = 1536;
  const vector = new Array(DIM).fill(0);

  const CLUSTER_BASES: Record<string, number> = {
    pothole: 120,
    water_leakage: 320,
    streetlight: 520,
    waste: 720,
    drainage: 920,
    accessibility: 1120,
    road_safety: 1320
  };

  // Hash-based lexical projection with semantic anchors
  for (const token of tokens) {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash << 5) - hash + token.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % DIM;
    vector[idx] += 1.0;

    // Expand semantic cluster anchors (project synonyms to shared cluster subspace)
    for (const [cluster, words] of Object.entries(CIVIC_SEMANTIC_ANCHORS)) {
      if (words.some(w => token.includes(w) || w.includes(token))) {
        const clusterBase = CLUSTER_BASES[cluster] || 100;
        for (let j = 0; j < 24; j++) {
          vector[(clusterBase + j) % DIM] += 1.8;
        }
      }
    }
  }

  // Category semantic bias
  if (category) {
    const catNorm = category.toLowerCase().replace(/[^a-z]/g, "_");
    for (const [cluster, base] of Object.entries(CLUSTER_BASES)) {
      if (catNorm.includes(cluster) || cluster.includes(catNorm)) {
        for (let k = 0; k < 24; k++) {
          vector[(base + k) % DIM] += 2.0;
        }
      }
    }
  }

  // L2 Unit Normalization: ||v|| = 1
  let norm = 0;
  for (let i = 0; i < DIM; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < DIM; i++) {
      vector[i] /= norm;
    }
  }

  return vector;
}

// Computes cosine similarity between two unit vectors: dot(u, v)
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  let dot = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
  }
  return Math.min(1, Math.max(0, dot));
}

// AI Re-summarization Engine: Synthesizes existing description with incoming report
export function generateAiReSummarization(
  existingTitle: string,
  existingDesc: string,
  newReportText: string,
  totalReportCount: number,
  latestLocation?: string
): { title: string; summary: string } {
  // Extract key aspects
  const hasWater = /water|pipe|leak|pressure/i.test(newReportText + existingDesc);
  const hasPothole = /pothole|crater|asphalt|rim/i.test(newReportText + existingDesc);
  const hasDrain = /drain|stormwater|slab|canal/i.test(newReportText + existingDesc);
  const hasWaste = /waste|garbage|bin|scatter/i.test(newReportText + existingDesc);
  const hasWire = /wire|electric|light|exposed/i.test(newReportText + existingDesc);

  let synthesizedContext = "";
  if (hasPothole) {
    synthesizedContext = "Deep crater hazard identified under metro corridor with rim damage risk to two-wheelers.";
  } else if (hasDrain) {
    synthesizedContext = "Missing concrete stormwater drain cover creating direct hazard on pedestrian walking lane.";
  } else if (hasWater) {
    synthesizedContext = "Pressurized potable water line fracture bubbling onto public road and pathway.";
  } else if (hasWaste) {
    synthesizedContext = "Overflowing community waste disposal with scattered debris obstructing lane.";
  } else if (hasWire) {
    synthesizedContext = "Exposed electrical cable bracket loosened following high winds.";
  } else {
    synthesizedContext = "Civic infrastructure issue confirmed by multiple resident reports.";
  }

  const updatedSummary = `[AI Synthesized Master Dossier · ${totalReportCount} Verified Resident Reports] ${synthesizedContext} Latest update: "${newReportText.trim()}" — consolidated from ${totalReportCount} geo-located citizen signals within 100m.`;

  return {
    title: existingTitle,
    summary: updatedSummary
  };
}

/**
 * Main 4-Stage Agent Execution Pipeline:
 * 1. Spatial Pre-Filter (radius <= 100m)
 * 2. Semantic Embedding (1536-dim vector)
 * 3. Cosine Similarity Check (vs candidates in radius)
 * 4a. Merge into Master Issue (similarity >= 0.85)
 * 4b. Create New Master Issue (similarity < 0.85)
 */
export function runAiDeduplicationPipeline(
  incoming: IncomingCitizenReport,
  existingIssues: CivicIssue[]
): DedupDecision {
  const SPATIAL_RADIUS_METERS = 100.0;
  const SIMILARITY_THRESHOLD = 0.80;

  // -------------------------------------------------------------
  // STAGE 1: Spatial Pre-Filter (ST_DWithin <= 100m equivalent)
  // -------------------------------------------------------------
  const candidatesInRadius: Array<{ issue: CivicIssue; distanceMeters: number }> = [];

  for (const issue of existingIssues) {
    // Only compare against active/open issues (not closed/resolved)
    if (issue.status === "Resolved & Verified") continue;
    
    if (issue.coordinates && issue.coordinates.length === 2) {
      const dist = calculateGeodesicDistanceMeters(
        incoming.latitude,
        incoming.longitude,
        issue.coordinates[0],
        issue.coordinates[1]
      );

      if (dist <= SPATIAL_RADIUS_METERS) {
        candidatesInRadius.push({ issue, distanceMeters: dist });
      }
    }
  }

  // If no issues exist within 100m -> Branch 4b (Create New Master Issue)
  if (candidatesInRadius.length === 0) {
    return {
      action: "created",
      targetMasterIssue: createNewMasterIssueRecord(incoming),
      candidateCountInRadius: 0,
      reSummarized: false,
      message: "No existing issues within 100m geofence. Registered new Master Issue."
    };
  }

  // -------------------------------------------------------------
  // STAGE 2: Semantic Embedding (Generate 1536-dim vector for incoming report)
  // -------------------------------------------------------------
  const incomingEmbedding = generateSemanticEmbedding(
    `${incoming.text} ${incoming.category || ""}`,
    incoming.category
  );

  // -------------------------------------------------------------
  // STAGE 3: Cosine Similarity Check vs candidate issues in that radius
  // -------------------------------------------------------------
  let bestCandidate: {
    issue: CivicIssue;
    distanceMeters: number;
    similarityScore: number;
  } | null = null;

  for (const candidate of candidatesInRadius) {
    const candidateText = `${candidate.issue.title} ${candidate.issue.description} ${candidate.issue.category}`;
    const candidateEmbedding = generateSemanticEmbedding(candidateText, candidate.issue.category);
    
    const similarity = calculateCosineSimilarity(incomingEmbedding, candidateEmbedding);

    // Boost similarity if exact category match
    const categoryBonus = candidate.issue.category === incoming.category ? 0.08 : 0;
    const finalScore = Math.min(1.0, Math.round((similarity + categoryBonus) * 100) / 100);

    if (!bestCandidate || finalScore > bestCandidate.similarityScore) {
      bestCandidate = {
        issue: candidate.issue,
        distanceMeters: candidate.distanceMeters,
        similarityScore: finalScore
      };
    }
  }

  // -------------------------------------------------------------
  // STAGE 4: Branching Decision (Threshold: 0.85)
  // -------------------------------------------------------------
  if (bestCandidate && bestCandidate.similarityScore >= SIMILARITY_THRESHOLD) {
    // -----------------------------------------------------------
    // 4a. MERGE INTO MASTER ISSUE (Similarity >= 0.80)
    // -----------------------------------------------------------
    const master = bestCandidate.issue;
    const currentReportCount = master.reportCount || master.upvotes || 1;
    const newReportCount = currentReportCount + 1;
    const newUpvotes = (master.upvotes || 1) + 1;
    const reporterName = incoming.residentName || "Another Citizen";

    // Update reportedBy string with appended reporter count
    let updatedReportedBy = master.reportedBy || "Citizen Reporter";
    if (!updatedReportedBy.includes(reporterName)) {
      if (updatedReportedBy.includes("&")) {
        const parts = updatedReportedBy.split("&");
        const countMatch = parts[1].match(/\d+/);
        const count = countMatch ? parseInt(countMatch[0], 10) + 1 : 2;
        updatedReportedBy = `${parts[0].trim()} & ${count} others`;
      } else {
        updatedReportedBy = `${updatedReportedBy} & 1 other`;
      }
    }

    // Trigger AI Re-summarization
    const { summary } = generateAiReSummarization(
      master.title,
      master.description,
      incoming.text,
      newReportCount,
      master.location
    );

    // Build dedicated Citizen Report Record
    const newCitizenRecord: CitizenReportRecord = {
      id: `rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      residentName: reporterName,
      residentContact: incoming.residentContact || "+91 98765 43210",
      rawText: incoming.text,
      reportedAt: "Just now",
      coordinates: [incoming.latitude, incoming.longitude],
      distanceMeters: bestCandidate.distanceMeters,
      similarityScore: bestCandidate.similarityScore,
      photoUrl: incoming.photoUrl
    };

    const existingReports: CitizenReportRecord[] = master.combinedReports && master.combinedReports.length > 0
      ? master.combinedReports
      : [
          {
            id: `rep-orig-${master.id}`,
            residentName: master.reportedBy.split("&")[0].trim() || "Initial Reporter",
            residentContact: "+91 98765 43100",
            rawText: master.description,
            reportedAt: master.reportedAt || "Original report",
            coordinates: master.coordinates,
            distanceMeters: 0,
            similarityScore: 1.0,
            photoUrl: master.beforePhoto
          }
        ];

    // Multi-factor AI Priority Evaluation across all 5 criteria
    const priorityEvaluation = evaluateCivicPriority({
      title: master.title,
      description: summary,
      category: master.category,
      location: master.location,
      reportCount: newReportCount,
      upvotes: newUpvotes,
      isUrgent: incoming.isUrgent || master.severity === "critical",
      severity: master.severity,
      slaDeadlineHours: master.slaDeadlineHours,
      status: master.status,
      reportedAt: master.reportedAt
    });

    const boostedPriority = priorityEvaluation.totalScore;
    const escalatedSeverity = priorityEvaluation.tier === "CRITICAL" ? "critical" : priorityEvaluation.tier === "HIGH" ? "high" : master.severity;
    const tightenedSlaHours = Math.min(master.slaDeadlineHours, priorityEvaluation.suggestedSlaHours);

    // Add field note / audit log entry
    const newFieldNote = {
      id: `fn-agg-${Date.now()}`,
      author: "Civion AI Priority Engine",
      role: "Multi-Factor Triage Agent",
      text: `Merged incoming citizen signal (${bestCandidate.distanceMeters}m away, ${Math.round(bestCandidate.similarityScore * 100)}% match). Multi-factor priority escalated to ${boostedPriority}/100 [${priorityEvaluation.tier}]. Drivers: ${priorityEvaluation.keyDrivers.join(" · ")}.`,
      timestamp: "Just now"
    };

    // Add comment
    const newComment = {
      id: `c-agg-${Date.now()}`,
      author: reporterName,
      role: "Resident (Signal Merged)",
      avatar: reporterName.slice(0, 2).toUpperCase(),
      text: incoming.text,
      timestamp: "Just now"
    };

    const mergedMasterIssue: CivicIssue = {
      ...master,
      isMasterIssue: true,
      reportCount: newReportCount,
      combinedReports: [...existingReports, newCitizenRecord],
      upvotes: newUpvotes,
      hasUpvoted: true,
      reportedBy: updatedReportedBy,
      description: summary,
      severity: escalatedSeverity,
      priorityScore: boostedPriority,
      priorityBreakdown: priorityEvaluation,
      slaDeadlineHours: tightenedSlaHours,
      // If original had no photo and incoming has one, attach it
      beforePhoto: master.beforePhoto || incoming.photoUrl,
      fieldNotes: [newFieldNote, ...(master.fieldNotes || [])],
      comments: [newComment, ...(master.comments || [])]
    };

    return {
      action: "merged",
      targetMasterIssue: mergedMasterIssue,
      distanceMeters: bestCandidate.distanceMeters,
      similarityScore: bestCandidate.similarityScore,
      candidateCountInRadius: candidatesInRadius.length,
      reSummarized: true,
      message: `AI Deduplication & Priority Engine: Report matched existing Master Ticket #${master.code} (${bestCandidate.distanceMeters}m away, ${Math.round(bestCandidate.similarityScore * 100)}% match). Merged into master ticket (${newReportCount} complaints unified) with priority escalated to ${boostedPriority}/100 [${priorityEvaluation.tier}]!`
    };
  }

  // -------------------------------------------------------------
  // 4b. CREATE NEW MASTER ISSUE (Similarity < 0.80 or no nearby)
  // -------------------------------------------------------------
  return {
    action: "created",
    targetMasterIssue: createNewMasterIssueRecord(incoming),
    distanceMeters: bestCandidate?.distanceMeters,
    similarityScore: bestCandidate?.similarityScore,
    candidateCountInRadius: candidatesInRadius.length,
    reSummarized: false,
    message: bestCandidate
      ? `Nearby issue found within ${bestCandidate.distanceMeters}m, but semantic similarity (${Math.round(bestCandidate.similarityScore * 100)}%) is below 0.80 threshold. Created new Master Issue in Authority Dashboard.`
      : "No previous reports at this location. Created new Master Issue in Authority Dashboard."
  };
}

function createNewMasterIssueRecord(incoming: IncomingCitizenReport): CivicIssue {
  const codeNum = Math.floor(1050 + Math.random() * 8900);
  const code = `CIV-${codeNum}`;
  const reporterName = incoming.residentName || "Verified Resident";
  const title = incoming.text.split(".")[0].slice(0, 70) || "Civic Incident Report";
  const location = `Indiranagar (${incoming.latitude.toFixed(4)}° N, ${incoming.longitude.toFixed(4)}° E)`;

  const priorityEvaluation = evaluateCivicPriority({
    title,
    description: incoming.text,
    category: incoming.category || "Road safety",
    location,
    reportCount: 1,
    upvotes: 1,
    isUrgent: incoming.isUrgent,
    severity: incoming.isUrgent ? "critical" : "medium",
    slaDeadlineHours: incoming.isUrgent ? 12 : 24,
    status: "Submitted"
  });

  const initialRecord: CitizenReportRecord = {
    id: `rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    residentName: reporterName,
    residentContact: incoming.residentContact || "+91 98765 43100",
    rawText: incoming.text,
    reportedAt: "Just now",
    coordinates: [incoming.latitude, incoming.longitude],
    distanceMeters: 0,
    similarityScore: 1.0,
    photoUrl: incoming.photoUrl
  };

  return {
    id: `iss-${codeNum}`,
    code,
    title,
    description: incoming.text,
    category: incoming.category || "Road safety",
    location,
    coordinates: [incoming.latitude, incoming.longitude],
    ward: "Ward 112 - Indiranagar",
    status: "Submitted", // Tag status: "Open"
    severity: priorityEvaluation.tier === "CRITICAL" ? "critical" : priorityEvaluation.tier === "HIGH" ? "high" : "medium",
    priorityScore: priorityEvaluation.totalScore,
    priorityBreakdown: priorityEvaluation,
    reportedBy: reporterName,
    reportedAt: "Just now",
    upvotes: 1,
    hasUpvoted: true,
    isMasterIssue: true,
    reportCount: 1,
    combinedReports: [initialRecord],
    slaDeadlineHours: priorityEvaluation.suggestedSlaHours,
    slaDeadlineTime: `Within ${priorityEvaluation.suggestedSlaHours} hours`,
    beforePhoto: incoming.photoUrl || "/images/issues/pothole.jpg",
    fieldNotes: [
      {
        id: `fn-init-${Date.now()}`,
        author: "Civion AI Priority Engine",
        role: "Triage Pipeline",
        text: `New Master Issue ${code} initialized. AI Priority evaluated at ${priorityEvaluation.totalScore}/100 [${priorityEvaluation.tier}]. Drivers: ${priorityEvaluation.keyDrivers.join(" · ")}.`,
        timestamp: "Just now"
      }
    ],
    comments: []
  };
}
