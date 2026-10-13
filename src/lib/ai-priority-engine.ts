/**
 * Civion AI Multi-Factor Priority Engine
 * 
 * Computes an authoritative 1-100 civic resolution priority score across 5 key dimensions:
 * 1. Safety & Immediate Hazard Detection (Two-wheeler skidding, craters, exposed wires, open manholes, school/hospital zones)
 * 2. Report Volume & Citizen Clustering (Deduplication count, multi-citizen consensus, community upvotes)
 * 3. Infrastructure Category & Baseline Severity (Structural drainage, high-speed roads, water mains, power)
 * 4. Time Decay & SLA Aging Urgency (Time elapsed, hours to deadline breach, overdue penalty)
 * 5. Location & Traffic Density (Major arterials, metro approaches, commercial corridors vs residential lanes)
 */

export interface PriorityBreakdown {
  totalScore: number;
  tier: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  badgeColor: string;
  badgeBg: string;
  safetyHazardScore: number;       // max 30
  clusterVolumeScore: number;      // max 25
  categorySeverityScore: number;   // max 20
  slaUrgencyScore: number;         // max 15
  trafficDensityScore: number;     // max 10
  keyDrivers: string[];
  recommendedAction: string;
  suggestedSlaHours: number;
}

export interface IssueEvaluationInput {
  title?: string;
  description: string;
  category?: string;
  location?: string;
  reportCount?: number;
  upvotes?: number;
  isUrgent?: boolean;
  severity?: "critical" | "high" | "medium" | "low";
  reportedAt?: string;
  slaDeadlineHours?: number;
  status?: string;
}

// 1. SAFETY & HAZARD KEYWORDS
const HAZARD_SIGNALS = [
  { pattern: /\b(deep\s+pothole|crater|trench|road\s+collapse|sinkhole|huge\s+hole)\b/i, weight: 14, label: "Severe road crater / structural collapse" },
  { pattern: /\b(skid|skidding|two-wheeler|bike|scooter|fall|injury|fatal|accident|tumble)\b/i, weight: 16, label: "Two-wheeler skidding / high accident risk" },
  { pattern: /\b(electric|exposed\s+wire|live\s+wire|spark|sparking|shock|electrocution|short\s+circuit)\b/i, weight: 20, label: "Exposed live electricity / electrocution risk" },
  { pattern: /\b(open\s+manhole|missing\s+cover|drain\s+collapse|broken\s+slab|sewage\s+overflow|gushing|flooding)\b/i, weight: 18, label: "Open manhole / severe drainage breach" },
  { pattern: /\b(school|hospital|clinic|nursing|metro|bus\s+stand|railway|market|elderly|blind|children)\b/i, weight: 10, label: "High-vulnerability zone (School/Hospital/Transit)" },
  { pattern: /\b(dark|blindspot|unlit|blackout|pitch\s+dark)\b/i, weight: 8, label: "Night-time blindness / collision hazard" },
];

// 5. HIGH-DENSITY TRAFFIC CORRIDORS
const ARTERIAL_CORRIDORS = [
  { pattern: /\b(100\s*feet|outer\s*ring|ring\s*road|cmh|mg\s*road|brigade|hosur|airport|junction|flyover|underpass|signal|circle)\b/i, weight: 10, label: "High-volume arterial / major transport junction" },
  { pattern: /\b(main\s*road|cross|avenue|commercial|station|expressway)\b/i, weight: 6, label: "Secondary commercial / transit corridor" },
];

export function evaluateCivicPriority(input: IssueEvaluationInput): PriorityBreakdown {
  const combinedText = `${input.title || ""} ${input.description || ""} ${input.location || ""}`.toLowerCase();
  const drivers: string[] = [];

  // -------------------------------------------------------------
  // CRITERION 1: Safety & Immediate Hazard Detection (Max 30 pts)
  // -------------------------------------------------------------
  let safetyScore = 0;
  for (const signal of HAZARD_SIGNALS) {
    if (signal.pattern.test(combinedText)) {
      safetyScore += signal.weight;
      drivers.push(signal.label);
    }
  }
  if (input.isUrgent) {
    safetyScore += 10;
    drivers.push("Flagged as urgent by citizen reporter");
  }
  safetyScore = Math.min(30, Math.max(5, safetyScore));

  // -------------------------------------------------------------
  // CRITERION 2: Report Volume & Clustering Escalation (Max 25 pts)
  // -------------------------------------------------------------
  let clusterScore = 5;
  const count = input.reportCount || 1;
  const upvotes = input.upvotes || 0;

  if (count >= 5) {
    clusterScore = 25;
    drivers.push(`Mass citizen cluster (${count} deduplicated complaints unified)`);
  } else if (count >= 3) {
    clusterScore = 20;
    drivers.push(`Multi-resident cluster (${count} verified citizen reports)`);
  } else if (count === 2) {
    clusterScore = 14;
    drivers.push(`Corroborated by 2 independent resident reports`);
  } else {
    clusterScore = 6;
  }

  // Add upvote community validation
  if (upvotes > 3) {
    const upvoteBonus = Math.min(5, Math.floor(upvotes / 2));
    clusterScore = Math.min(25, clusterScore + upvoteBonus);
    drivers.push(`${upvotes} community upvotes validating impact`);
  }

  // -------------------------------------------------------------
  // CRITERION 3: Category & Baseline Infrastructure Severity (Max 20 pts)
  // -------------------------------------------------------------
  let categoryScore = 12;
  const cat = (input.category || "").toLowerCase();

  if (cat.includes("drain") || cat.includes("manhole")) {
    categoryScore = 20;
    drivers.push("Critical underground drainage infrastructure");
  } else if (cat.includes("pothole") || cat.includes("road")) {
    categoryScore = 18;
    drivers.push("High-speed vehicular roadway safety");
  } else if (cat.includes("water")) {
    categoryScore = 16;
    drivers.push("Municipal potable water / flood management");
  } else if (cat.includes("street") || cat.includes("light")) {
    categoryScore = 15;
    drivers.push("Public lighting & night-time deterrence");
  } else if (cat.includes("waste")) {
    categoryScore = 12;
    drivers.push("Public health & sanitation");
  } else {
    categoryScore = 14;
  }

  // Explicit severity override modifier
  if (input.severity === "critical") categoryScore = Math.max(categoryScore, 20);
  else if (input.severity === "high") categoryScore = Math.max(categoryScore, 17);

  // -------------------------------------------------------------
  // CRITERION 4: Time Decay & SLA Aging Urgency (Max 15 pts)
  // -------------------------------------------------------------
  let slaScore = 6;
  const isResolved = input.status?.includes("Resolved");

  if (isResolved) {
    slaScore = 2; // Resolved issues drop SLA pressure
  } else {
    const hours = input.slaDeadlineHours || 24;
    if (hours <= 6) {
      slaScore = 15;
      drivers.push("Critical SLA window (< 6 hours to breach)");
    } else if (hours <= 12) {
      slaScore = 12;
      drivers.push("Tight resolution deadline (< 12 hours remaining)");
    } else if (hours <= 24) {
      slaScore = 9;
    } else {
      slaScore = 5;
    }

    // Check if reported long ago (e.g. over 2 days old)
    if (input.reportedAt?.includes("d ago") || input.reportedAt?.includes("3d") || input.reportedAt?.includes("2d")) {
      slaScore = Math.min(15, slaScore + 4);
      drivers.push("Unresolved aging ticket (+time escalation)");
    }
  }

  // -------------------------------------------------------------
  // CRITERION 5: Traffic & Location Density (Max 10 pts)
  // -------------------------------------------------------------
  let trafficScore = 4;
  for (const corridor of ARTERIAL_CORRIDORS) {
    if (corridor.pattern.test(combinedText)) {
      trafficScore = corridor.weight;
      drivers.push(corridor.label);
      break;
    }
  }

  // -------------------------------------------------------------
  // TOTAL SCORE COMPILATION (Scale 1 - 100)
  // -------------------------------------------------------------
  let rawTotal = safetyScore + clusterScore + categoryScore + slaScore + trafficScore;
  let totalScore = Math.min(100, Math.max(15, rawTotal));

  // Determine Priority Tier
  let tier: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  let badgeColor = "text-emerald-400";
  let badgeBg = "bg-emerald-500/10 border-emerald-500/30";
  let recommendedAction = "Schedule routine maintenance via assigned departmental squad.";
  let suggestedSlaHours = 48;

  if (totalScore >= 90) {
    tier = "CRITICAL";
    badgeColor = "text-rose-400";
    badgeBg = "bg-rose-500/20 border-rose-500/40 text-rose-300";
    recommendedAction = "🚨 RESOLVE FIRST / IMMEDIATE DISPATCH: Life safety hazard / high-density arterial. Assign crew within 2-4 hours.";
    suggestedSlaHours = 4;
  } else if (totalScore >= 75) {
    tier = "HIGH";
    badgeColor = "text-amber-400";
    badgeBg = "bg-amber-500/20 border-amber-500/40 text-amber-300";
    recommendedAction = "⚠️ HIGH PRIORITY: High traffic corridor / multi-citizen complaints. Dispatch crew within 12-24 hours.";
    suggestedSlaHours = 12;
  } else if (totalScore >= 50) {
    tier = "MEDIUM";
    badgeColor = "text-blue-400";
    badgeBg = "bg-blue-500/20 border-blue-500/40 text-blue-300";
    recommendedAction = "📋 STANDARD QUEUE: Work order in standard municipal resolution cycle (24-48h).";
    suggestedSlaHours = 24;
  } else {
    tier = "LOW";
    badgeColor = "text-slate-400";
    badgeBg = "bg-slate-500/10 border-slate-500/30 text-slate-400";
    recommendedAction = "ℹ️ ROUTINE BACKLOG: Low pedestrian/traffic impact. Batch with weekly area sweep.";
    suggestedSlaHours = 72;
  }

  // De-duplicate drivers
  const uniqueDrivers = Array.from(new Set(drivers));

  return {
    totalScore,
    tier,
    badgeColor,
    badgeBg,
    safetyHazardScore: safetyScore,
    clusterVolumeScore: clusterScore,
    categorySeverityScore: categoryScore,
    slaUrgencyScore: slaScore,
    trafficDensityScore: trafficScore,
    keyDrivers: uniqueDrivers.slice(0, 4),
    recommendedAction,
    suggestedSlaHours,
  };
}
