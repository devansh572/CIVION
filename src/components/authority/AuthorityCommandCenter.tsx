"use client";

import React, { useState } from "react";
import { useCivionStore, CivicIssue, Severity } from "@/lib/civion-store";
import { InteractiveMapPicker } from "@/components/InteractiveMapPicker";
import { 
  BarChart3, Users, AlertCircle, Clock, MapPin, 
  Search, Filter, ChevronRight, UserPlus, Send, 
  CheckCircle, ArrowUpRight, Layers, Navigation, 
  SlidersHorizontal, ShieldCheck, Activity, Plus,
  Printer, FileText, Check, Copy, CheckCheck,
  Zap, Flame, ShieldAlert, ArrowUpDown, TrendingUp, Gauge, Sparkles
} from "lucide-react";
import { evaluateCivicPriority, PriorityBreakdown } from "@/lib/ai-priority-engine";

export const AuthorityCommandCenter: React.FC = () => {
  const { 
    issues, 
    dispatchCrew, 
    createWorkOrder,
    currentUser,
    theme 
  } = useCivionStore();

  const isLight = theme === "light";

  // Filter & tab states
  const [filterTab, setFilterTab] = useState<"all" | "open" | "in_progress" | "resolved" | "combined">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [wardFilter, setWardFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"queue" | "map" | "analytics">("queue");
  const [showBriefingModal, setShowBriefingModal] = useState(false);

  // Work Order creation modal state
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [woTitle, setWoTitle] = useState("");
  const [woCategory, setWoCategory] = useState<CivicIssue["category"]>("Road safety");
  const [woLocation, setWoLocation] = useState("100 Feet Road, Indiranagar");
  const [woWard, setWoWard] = useState("Ward 112 - Indiranagar");
  const [woSeverity, setWoSeverity] = useState<Severity>("high");
  const [woWorker, setWoWorker] = useState("Raju K (Road Inspector)");
  const [woSla, setWoSla] = useState(24);
  const [woDescription, setWoDescription] = useState("");

  // Dispatch modal state
  const [dispatchingIssue, setDispatchingIssue] = useState<CivicIssue | null>(null);
  const [selectedWorker, setSelectedWorker] = useState("Raju K (Road Inspector)");
  const [targetSla, setTargetSla] = useState(24);
  const [dispatchNote, setDispatchNote] = useState("");

  // Inspect detail drawer
  const [inspectingIssue, setInspectingIssue] = useState<CivicIssue | null>(null);

  // Available field crew roster
  const workers = [
    { name: "Raju K (Road Inspector)", dept: "Public Works / Roads", available: true },
    { name: "Manjunath B (Water Specialist)", dept: "Water & Sanitation", available: true },
    { name: "Asha Kulkarni (Lineman Unit 2)", dept: "Electrical / Streetlights", available: true },
    { name: "Santosh M (Sanitation Lead)", dept: "Waste Management", available: true }
  ];

  // Department-level Categorization for Authority Accounts per User Specification:
  // 1. kaushkipriya2006@gmail.com: Only gets reports of category Pothole & Road safety
  // 2. civion00@gmail.com: Category Water leakage & Drainage
  // 3. petalspines3@gmail.com: Category Streetlight
  const userAllowedCategories = currentUser?.allowedCategories || (
    currentUser?.email?.toLowerCase().includes("kaushki") || currentUser?.email?.toLowerCase().includes("kaushiki")
      ? ["Pothole", "Road safety"]
      : currentUser?.email?.toLowerCase().includes("civion00")
        ? ["Water leakage", "Drainage"]
        : currentUser?.email?.toLowerCase().includes("petalspines")
          ? ["Streetlight"]
          : null
  );

  // Filter issues according to the logged-in authority's department jurisdiction
  const departmentIssues = issues.filter((iss) => {
    if (!userAllowedCategories || userAllowedCategories.length === 0) return true;
    return userAllowedCategories.includes(iss.category);
  });

  // Calculate live KPIs based on authority department scope
  const totalCount = departmentIssues.length;
  const openCount = departmentIssues.filter(i => i.status === "Submitted" || i.status === "Triaged").length;
  const inMotionCount = departmentIssues.filter(i => i.status === "Crew Dispatched" || i.status === "Work in Progress" || i.status === "En Route").length;
  const resolvedCount = departmentIssues.filter(i => i.status === "Resolved & Verified" || i.status === "Resolved (Pending Verification)").length;
  const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

  // AI Deduplication live aggregation metrics for this department
  const totalCombinedCitizenReports = departmentIssues.reduce((acc, i) => acc + (i.reportCount || i.upvotes || 1), 0);
  const multiReportMasterCount = departmentIssues.filter(i => (i.reportCount && i.reportCount > 1) || (i.combinedReports && i.combinedReports.length > 1)).length;

  // AI Priority & Triage Sorting (default: Highest Priority First)
  const [sortBy, setSortBy] = useState<"priority_desc" | "priority_asc" | "reports_desc" | "sla_asc">("priority_desc");

  // Filtered issues within the department
  const filteredIssues = departmentIssues.filter((iss) => {
    const matchesSearch = 
      iss.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      iss.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      iss.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === "all" || iss.category === categoryFilter;
    const matchesWard = wardFilter === "all" || iss.ward === wardFilter;

    if (!matchesSearch || !matchesCategory || !matchesWard) return false;

    if (filterTab === "all") return true;
    if (filterTab === "open") return iss.status === "Submitted" || iss.status === "Triaged";
    if (filterTab === "in_progress") return iss.status === "Crew Dispatched" || iss.status === "Work in Progress" || iss.status === "En Route";
    if (filterTab === "resolved") return iss.status === "Resolved & Verified" || iss.status === "Resolved (Pending Verification)";
    if (filterTab === "combined") return (iss.reportCount && iss.reportCount > 1) || (iss.combinedReports && iss.combinedReports.length > 1);
    return true;
  });

  // Sort issues according to AI priority selection
  const sortedFilteredIssues = [...filteredIssues].sort((a, b) => {
    if (sortBy === "priority_desc") {
      return (b.priorityScore || 0) - (a.priorityScore || 0);
    }
    if (sortBy === "priority_asc") {
      return (a.priorityScore || 0) - (b.priorityScore || 0);
    }
    if (sortBy === "reports_desc") {
      const countA = a.reportCount || (a.combinedReports ? a.combinedReports.length : 1);
      const countB = b.reportCount || (b.combinedReports ? b.combinedReports.length : 1);
      return countB - countA;
    }
    if (sortBy === "sla_asc") {
      return (a.slaDeadlineHours || 24) - (b.slaDeadlineHours || 24);
    }
    return 0;
  });

  // Highest priority unresolved issue needing immediate attention within this department
  const topPriorityIssue = departmentIssues
    .filter(i => i.status !== "Resolved & Verified" && i.status !== "Resolved (Pending Verification)")
    .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))[0];

  const handleConfirmDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchingIssue) return;
    dispatchCrew(dispatchingIssue.id, selectedWorker, targetSla, dispatchNote);
    setDispatchingIssue(null);
    setDispatchNote("");
  };

  const handleCreateWorkOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!woTitle.trim()) return;
    createWorkOrder({
      title: woTitle,
      category: woCategory,
      location: woLocation,
      ward: woWard,
      severity: woSeverity,
      assignedWorker: woWorker,
      slaDeadlineHours: woSla,
      description: woDescription || "Official municipal work order commissioned by North District Operations Command.",
    });
    setShowWorkOrderModal(false);
    setWoTitle("");
    setWoDescription("");
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header banner matching prototype with live user department */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono tracking-widest text-coral-500 uppercase font-bold">
              {currentUser?.title || "ZONAL OPERATIONS DIRECTOR"}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>
                {userAllowedCategories 
                  ? `AI ROUTED DEPARTMENT: ${userAllowedCategories.join(" & ").toUpperCase()}` 
                  : "CENTRAL COMMAND (ALL CATEGORIES)"}
              </span>
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1.5">
            Good morning, {currentUser?.name || "Authority Lead"}.
          </h1>
          <p className={`text-sm sm:text-base mt-1 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
            {currentUser?.district 
              ? `${currentUser.district} · Authenticated as ${currentUser.email}` 
              : "Here's what needs a hand today across North District."}
          </p>
        </div>

        {/* Action Controls: New Work Order + View mode toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowWorkOrderModal(true)}
            className="px-3.5 py-2 rounded-xl bg-coral-500 hover:bg-coral-600 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-md shadow-coral-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Commission Work Order</span>
          </button>

          <div className={`p-1 rounded-xl border flex items-center ${
            isLight ? "bg-slate-200/60 border-slate-300" : "bg-[#161d21] border-white/10"
          }`}>
            <button
              onClick={() => setViewMode("queue")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                viewMode === "queue"
                  ? "bg-coral-500 text-white font-bold shadow-sm"
                  : isLight ? "text-slate-600 hover:text-slate-900" : "text-slate-400 hover:text-white"
              }`}
            >
              Queue Table
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
                viewMode === "map"
                  ? "bg-coral-500 text-white font-bold shadow-sm"
                  : isLight ? "text-slate-600 hover:text-slate-900" : "text-slate-400 hover:text-white"
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Geospatial Radar</span>
            </button>
            <button
              onClick={() => setViewMode("analytics")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
                viewMode === "analytics"
                  ? "bg-coral-500 text-white font-bold shadow-sm"
                  : isLight ? "text-slate-600 hover:text-slate-900" : "text-slate-400 hover:text-white"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Ward Analytics & SLA</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>All systems reporting</span>
          </div>
        </div>
      </div>

      {/* 1. OPERATIONAL OVERVIEW & KPI METRIC CARDS (Exact match to prototype) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total reports */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isLight ? "bg-white border-slate-200 shadow-sm" : "glass-card"
        }`}>
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Total reports</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-4xl font-extrabold tracking-tight mt-3">
            {totalCount}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono">
            Across all statuses
          </div>
        </div>

        {/* Needs attention */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isLight ? "bg-rose-50/50 border-rose-200" : "glass-card border-rose-500/30 bg-rose-950/10"
        }`}>
          <div className="flex items-center justify-between text-xs font-mono text-rose-400 font-semibold">
            <span>Needs attention</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-4xl font-extrabold tracking-tight mt-3 text-rose-400">
            {openCount}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono">
            Open beyond first review
          </div>
        </div>

        {/* In motion */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isLight ? "bg-white border-slate-200 shadow-sm" : "glass-card"
        }`}>
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>In motion</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-4xl font-extrabold tracking-tight mt-3 text-blue-400">
            {inMotionCount}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono">
            Assigned to a city team
          </div>
        </div>

        {/* Resolution rate */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isLight ? "bg-white border-slate-200 shadow-sm" : "glass-card"
        }`}>
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Resolution rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-4xl font-extrabold tracking-tight mt-3 text-emerald-400">
            {resolutionRate}%
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono">
            Avg close · 38h turnaround
          </div>
        </div>
      </div>

      {/* AI Deduplication & Aggregation Efficiency Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        isLight ? "bg-amber-50/70 border-amber-200 text-amber-950" : "bg-gradient-to-r from-amber-950/20 via-black/40 to-coral-950/20 border-amber-500/20 text-white"
      }`}>
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5 sm:mt-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                AI Deduplication & Complaint Clustering Active
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                100m Spatial Geofence
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              When residents report at the same location, our AI consolidates them into <strong>1 single Master Ticket</strong>. Currently managing <strong>{totalCount} master work orders</strong> aggregated from <strong>{totalCombinedCitizenReports} resident complaints</strong> ({multiReportMasterCount} multi-citizen clusters).
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
          <button
            onClick={() => setFilterTab(filterTab === "combined" ? "all" : "combined")}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
              filterTab === "combined"
                ? "bg-amber-500 text-black border-amber-400 font-bold"
                : "bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-300"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{filterTab === "combined" ? "Showing Combined" : `Filter ${multiReportMasterCount} Combined Clusters →`}</span>
          </button>
        </div>
      </div>

      {/* AI PRIORITY DISPATCH RECOMMENDATION: RESOLVE FIRST */}
      {topPriorityIssue && (
        <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg ${
          isLight 
            ? "bg-gradient-to-r from-rose-50 via-white to-amber-50 border-rose-200 text-slate-900 shadow-rose-950/5" 
            : "bg-gradient-to-r from-rose-950/40 via-[#161d21] to-amber-950/30 border-rose-500/40 text-white shadow-rose-950/30"
        }`}>
          <div className="flex items-start gap-3.5 flex-1">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 flex-shrink-0 mt-0.5 animate-pulse">
              <Flame className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 shadow-sm">
                  <ShieldAlert className="w-3 h-3" />
                  <span>AI PRIORITY RECOMMENDATION: RESOLVE FIRST</span>
                </span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/40 text-amber-300 border border-white/10">
                  Priority Score: {topPriorityIssue.priorityScore}/100 [CRITICAL]
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Target SLA: Within {topPriorityIssue.slaDeadlineHours}h
                </span>
              </div>
              <h4 className="text-base sm:text-lg font-bold flex flex-wrap items-center gap-2">
                <span>#{topPriorityIssue.code}: {topPriorityIssue.title}</span>
              </h4>
              <p className="text-xs text-slate-300">
                <strong className="text-rose-400">Why resolve this first:</strong> {evaluateCivicPriority({
                  title: topPriorityIssue.title,
                  description: topPriorityIssue.description,
                  category: topPriorityIssue.category,
                  location: topPriorityIssue.location,
                  reportCount: topPriorityIssue.reportCount,
                  upvotes: topPriorityIssue.upvotes,
                  severity: topPriorityIssue.severity,
                  slaDeadlineHours: topPriorityIssue.slaDeadlineHours,
                  status: topPriorityIssue.status
                }).keyDrivers.join(" · ") || "High-impact arterial road incident with multi-citizen reports."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end md:self-auto flex-shrink-0">
            <button
              onClick={() => setInspectingIssue(topPriorityIssue)}
              className="px-3.5 py-2 rounded-xl text-xs font-mono font-medium border border-white/10 hover:bg-white/10 transition-all"
            >
              Inspect Diagnostics
            </button>
            <button
              onClick={() => {
                setDispatchingIssue(topPriorityIssue);
                setTargetSla(topPriorityIssue.slaDeadlineHours || 4);
              }}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Dispatch Crew First</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. GEOSPATIAL MAP VIEW (When active) */}
      {viewMode === "map" && (
        <div className={`p-6 rounded-3xl border space-y-4 ${
          isLight ? "bg-white border-slate-200" : "glass-card"
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Navigation className="w-5 h-5 text-coral-500" />
                <span>North District Geospatial Incident Grid</span>
              </h3>
              <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                Interactive radar tracking coordinates, cluster density, and hazard severity.
              </p>
            </div>

            {/* Map Legend */}
            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Critical</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>High</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Resolved</span>
              </div>
            </div>
          </div>

          {/* Interactive Industrial Dark Map Canvas */}
          <div className="relative w-full h-[450px] rounded-2xl overflow-hidden border border-white/10 bg-[#090d10] civic-grid-pattern flex items-center justify-center p-6">
            
            {/* Architectural overlay coordinate lines */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/5" />
              <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/5" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-emerald-500/10" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-emerald-500/20" />
              <div className="absolute top-4 left-4 text-[10px] font-mono text-emerald-500/60">
                RADAR: 12.9716° N / 77.6412° E (INDIRANAGAR SECTOR)
              </div>
            </div>

            {/* Map Pinpoints */}
            <div className="relative w-full h-full">
              {departmentIssues.map((issue, idx) => {
                // Approximate positions based on relative coordinates
                const xPercent = 30 + ((issue.coordinates[1] - 77.62) * 900) % 65;
                const yPercent = 25 + ((12.985 - issue.coordinates[0]) * 1100) % 60;
                const isCritical = issue.severity === "critical";
                const isHigh = issue.severity === "high";

                return (
                  <div
                    key={issue.id}
                    onClick={() => setInspectingIssue(issue)}
                    style={{ left: `${Math.max(10, Math.min(85, xPercent))}%`, top: `${Math.max(12, Math.min(85, yPercent))}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-20"
                  >
                    {/* Pulsing ring */}
                    <span className={`absolute -inset-2 rounded-full opacity-75 animate-ping ${
                      isCritical ? "bg-rose-500" : isHigh ? "bg-amber-500" : "bg-emerald-500"
                    }`} />

                    {/* Pin icon button */}
                    <div className={`relative px-2.5 py-1 rounded-full border shadow-xl flex items-center gap-1.5 transition-transform group-hover:scale-110 ${
                      isCritical
                        ? "bg-rose-600 text-white border-rose-400"
                        : isHigh
                          ? "bg-amber-600 text-white border-amber-300"
                          : "bg-emerald-600 text-white border-emerald-300"
                    }`}>
                      <MapPin className="w-3 h-3" />
                      <span className="font-mono text-[10px] font-bold">#{issue.code}</span>
                      {(issue.reportCount && issue.reportCount > 1) && (
                        <span className="bg-black/50 px-1 py-0.2 rounded text-[9px] font-mono text-amber-200 border border-amber-300/30 flex items-center gap-0.5">
                          <Users className="w-2.5 h-2.5" />
                          <span>{issue.reportCount}</span>
                        </span>
                      )}
                    </div>

                    {/* Hover tooltip card */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-3 rounded-xl bg-[#161b22] border border-white/20 text-white shadow-2xl z-30 pointer-events-none">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-mono text-[10px] text-coral-400 font-bold">#{issue.code}</span>
                        {(issue.reportCount && issue.reportCount > 1) && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {issue.reportCount} Reports Combined
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-xs line-clamp-2">{issue.title}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{issue.location}</div>
                      <div className="flex items-center justify-between text-[10px] font-mono mt-2 pt-1 border-t border-white/10 text-coral-400">
                        <span>{issue.category}</span>
                        <span>Score: {issue.priorityScore}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN SPLIT: ISSUE TRIAGE & DISPATCH QUEUE (When viewMode is queue) */}
      {viewMode === "queue" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 8 Cols: Report Queue Data Table */}
        <div className="lg:col-span-8 space-y-4">
          <div className={`p-6 rounded-3xl border ${
            isLight ? "bg-white border-slate-200" : "glass-card"
          }`}>
            
            {/* Title & Filter Tabs Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
              <div>
                <h3 className="text-xl font-bold tracking-tight">Report queue</h3>
                <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                  Prioritize the next promise to keep.
                </p>
              </div>

              {/* Status pills tabs */}
              <div className={`flex flex-wrap rounded-xl p-1 border text-xs font-mono gap-1 ${
                isLight ? "bg-slate-100 border-slate-200" : "bg-black/40 border-white/5"
              }`}>
                {[
                  { id: "all", label: `All (${totalCount})` },
                  { id: "open", label: `Open (${openCount})` },
                  { id: "in_progress", label: `In progress (${inMotionCount})` },
                  { id: "resolved", label: `Resolved (${resolvedCount})` },
                  { id: "combined", label: `👥 Combined Clusters (${multiReportMasterCount})` }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setFilterTab(t.id as any)}
                    className={`px-3 py-1.5 rounded-lg transition-colors capitalize text-xs ${
                      filterTab === t.id
                        ? "bg-coral-500 text-white font-bold shadow-sm"
                        : isLight ? "text-slate-600 hover:text-slate-900" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search & Category Filter & Sort Row */}
            <div className="py-3 flex flex-wrap items-center gap-3">
              <div className={`flex-1 min-w-[200px] flex items-center gap-2 px-3 py-2 rounded-xl border ${
                isLight ? "bg-slate-50 border-slate-200" : "bg-black/30 border-white/5"
              }`}>
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter signals or search master code..."
                  className="bg-transparent text-xs w-full focus:outline-none"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                  isLight ? "bg-slate-50 border-slate-200 text-slate-800" : "bg-[#0d1117] border-white/10 text-slate-300"
                }`}
              >
                <option value="all">
                  {userAllowedCategories ? `All Department (${userAllowedCategories.join(", ")})` : "All Categories"}
                </option>
                {(userAllowedCategories || ["Pothole", "Road safety", "Drainage", "Streetlight", "Waste", "Water leakage", "Accessibility"]).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* AI Resolution Priority Sorter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                  <ArrowUpDown className="w-3 h-3 text-coral-500" />
                  <span className="hidden sm:inline">Sort:</span>
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-mono font-semibold border focus:outline-none ${
                    isLight 
                      ? "bg-coral-50 border-coral-200 text-coral-950 font-bold" 
                      : "bg-[#161d21] border-coral-500/40 text-coral-300"
                  }`}
                >
                  <option value="priority_desc">🔥 Highest Priority First (AI Triage)</option>
                  <option value="reports_desc">👥 Most Citizen Reports</option>
                  <option value="sla_asc">⏱️ Tightest SLA Deadline</option>
                  <option value="priority_asc">Lowest Priority</option>
                </select>
              </div>
            </div>

            {/* Queue List Rows (Referencing screenshot layout) */}
            <div className="divide-y divide-white/5">
              {sortedFilteredIssues.map((issue) => {
                const isOpen = issue.status === "Submitted" || issue.status === "Triaged";
                const isInProgress = issue.status === "Work in Progress" || issue.status === "Crew Dispatched";
                const isResolved = issue.status === "Resolved & Verified" || issue.status === "Resolved (Pending Verification)";
                const count = issue.reportCount || (issue.combinedReports ? issue.combinedReports.length : 1);
                const isCombined = count > 1;

                // Live AI multi-factor priority evaluation
                const priorityInfo = evaluateCivicPriority({
                  title: issue.title,
                  description: issue.description,
                  category: issue.category,
                  location: issue.location,
                  reportCount: count,
                  upvotes: issue.upvotes,
                  severity: issue.severity,
                  slaDeadlineHours: issue.slaDeadlineHours,
                  status: issue.status
                });

                const effectiveScore = issue.priorityScore || priorityInfo.totalScore;
                const isCriticalScore = effectiveScore >= 90;
                const isHighScore = effectiveScore >= 75 && effectiveScore < 90;

                return (
                  <div
                    key={issue.id}
                    onClick={() => setInspectingIssue(issue)}
                    className={`py-4 px-2 sm:px-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors cursor-pointer group ${
                      isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.03]"
                    } ${isCriticalScore && !isResolved ? "border-l-4 border-l-rose-500 bg-rose-500/[0.02]" : isCombined ? "border-l-2 border-l-amber-500/80 bg-amber-500/[0.02]" : ""}`}
                  >
                    {/* Left: Code, Report Count Badge, Title, Location & Category */}
                    <div className="flex items-start gap-3 sm:gap-4 flex-1">
                      <div className="flex flex-col items-center gap-1 mt-0.5">
                        <span className="font-mono text-xs font-bold text-coral-500">
                          #{issue.code}
                        </span>
                        {isCombined ? (
                          <span 
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5 whitespace-nowrap"
                            title={`${count} citizen reports combined into this master ticket`}
                          >
                            <Users className="w-2.5 h-2.5" />
                            <span>{count}</span>
                          </span>
                        ) : (
                          <span 
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-500 bg-white/5 border border-white/5"
                            title="Single resident report (1 report)"
                          >
                            1 rep
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm sm:text-base group-hover:text-coral-400 transition-colors">
                            {issue.title}
                          </span>
                          
                          {/* Priority Tier Badge */}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1 shadow-sm ${
                            isCriticalScore && !isResolved
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                              : isHighScore && !isResolved
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          }`}>
                            <Flame className="w-2.5 h-2.5" />
                            <span>Score {effectiveScore} · {isCriticalScore && !isResolved ? "CRITICAL (RESOLVE FIRST)" : isHighScore && !isResolved ? "HIGH PRIORITY" : "STANDARD"}</span>
                          </span>

                          {isCombined && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 shadow-sm">
                              <Layers className="w-2.5 h-2.5" />
                              <span>{count} Reports Combined</span>
                            </span>
                          )}
                        </div>

                        {/* Metadata & AI Key Drivers */}
                        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-coral-500" />
                            {issue.location}
                          </span>
                          <span>·</span>
                          <span>{issue.category}</span>
                          <span>·</span>
                          <span className="text-slate-300">SLA: {issue.slaDeadlineHours}h</span>
                          {priorityInfo.keyDrivers.length > 0 && (
                            <>
                              <span>·</span>
                              <span className="text-amber-300/90 italic hidden md:inline">
                                💡 {priorityInfo.keyDrivers[0]}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Status Pill, Assignee & Action Arrow */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pl-8 sm:pl-0">
                      {/* Status indicator */}
                      <span className={`text-xs font-mono font-medium px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                        isOpen
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                          : isInProgress
                            ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isOpen ? "bg-rose-400" : isInProgress ? "bg-blue-400" : "bg-emerald-400"
                        }`} />
                        <span>{isOpen ? "Open" : isInProgress ? "In progress" : "Resolved"}</span>
                      </span>

                      {/* Assigned to or Unassigned */}
                      <div className="flex items-center gap-2">
                        {issue.assignedWorker ? (
                          <span className="text-xs font-mono text-slate-400">
                            {issue.assignedWorker}
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDispatchingIssue(issue);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-coral-500/10 hover:bg-coral-500 text-coral-400 hover:text-white border border-coral-500/30 text-xs font-mono transition-colors"
                          >
                            + Dispatch
                          </button>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-coral-500 transition-colors" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

        {/* Right 4 Cols: Recent Activity Feed (Matching prototype screenshot) */}
        <div className="lg:col-span-4 space-y-4">
          <div className={`p-6 rounded-3xl border space-y-5 ${
            isLight ? "bg-white border-slate-200" : "glass-card"
          }`}>
            <div>
              <h3 className="text-lg font-bold tracking-tight">Recent activity</h3>
              <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                A running note of the work.
              </p>
            </div>

            {/* Activity Stream Items */}
            <div className="space-y-4">
              {[
                {
                  code: "R",
                  title: "Resolution verified by citizen",
                  sub: "Resident · 7:37 PM",
                  color: "bg-emerald-800/40 text-emerald-300 border-emerald-500/40"
                },
                {
                  code: "CO",
                  title: "Report assigned to AJAY",
                  sub: "Civion Operations · 5:39 PM",
                  color: "bg-blue-800/40 text-blue-300 border-blue-500/40"
                },
                {
                  code: "CO",
                  title: "CIV-1047 assigned to Asha Kulkarni",
                  sub: "Civion Operations · 4:34 PM",
                  color: "bg-blue-800/40 text-blue-300 border-blue-500/40"
                },
                {
                  code: "CO",
                  title: "CIV-1041 moved to In Progress",
                  sub: "Civion Operations · 2:34 PM",
                  color: "bg-amber-800/40 text-amber-300 border-amber-500/40"
                },
                {
                  code: "R",
                  title: "CIV-1042 resolution verified by citizen",
                  sub: "Resident · 11:34 AM",
                  color: "bg-emerald-800/40 text-emerald-300 border-emerald-500/40"
                },
                {
                  code: "R",
                  title: "New report received near Jeevan Bima Nagar",
                  sub: "Resident · 11:34 PM",
                  color: "bg-coral-800/40 text-coral-300 border-coral-500/40"
                }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0 ${item.color}`}>
                    {item.code}
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold leading-snug">
                      {item.title}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {item.sub}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Dispatch Action Widget */}
            <div className={`p-4 rounded-2xl border ${
              isLight ? "bg-slate-50 border-slate-200" : "bg-black/30 border-white/5"
            }`}>
              <div className="text-xs font-mono uppercase text-coral-500 font-bold mb-2">
                RAPID DISPATCH READY:
              </div>
              <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                4 active municipal crews on duty in North District. Click any open signal to assign.
              </p>
            </div>
          </div>
        </div>

      </div>
      )}

      {/* 4. WARD ANALYTICS & SLA PERFORMANCE DASHBOARD */}
      {viewMode === "analytics" && (
        <div className="space-y-8 animate-fade-in">
          {/* Header Action Banner */}
          <div className={`p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isLight ? "bg-white border-slate-200" : "glass-card border-white/10"
          }`}>
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-coral-500/20 border border-coral-500/40 text-coral-400 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-coral-500 uppercase tracking-wider flex items-center gap-2">
                  <span>MUNICIPAL PERFORMANCE INTELLIGENCE</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    LIVE KPI SYNC
                  </span>
                </div>
                <h2 className="text-xl font-bold mt-0.5">Ward Risk Heatmap & Department SLA Benchmarks</h2>
                <div className="text-xs font-mono text-slate-400">
                  Real-time aggregation across Wards 112–115 · Automated AI Briefing Generation
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowBriefingModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-coral-500 to-coral-600 hover:brightness-110 text-white text-xs font-mono font-bold flex items-center gap-2 shadow-lg shadow-coral-500/20 active:scale-95 transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Generate Commissioner Briefing (PDF)</span>
            </button>
          </div>

          {/* 1. Ward Risk Heatmap Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base tracking-tight flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amberGold-400" />
                <span>Geospatial Ward Incident Density & Risk Tiers</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">4 WARDS MONITORED</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  id: "112",
                  name: "Ward 112 · Indiranagar",
                  officer: "Raju K (BBMP Road Inspector)",
                  slaAvg: "94.8%",
                  riskLevel: "HIGH RISK",
                  riskColor: "rose",
                  highlight: "Arterial commercial density along 100ft Rd",
                  activeCount: issues.filter(i => i.ward?.includes("112") || i.location?.toLowerCase().includes("indiranagar")).length || 6,
                  criticalCount: issues.filter(i => (i.ward?.includes("112") || i.location?.toLowerCase().includes("indiranagar")) && i.severity === "critical").length || 2
                },
                {
                  id: "113",
                  name: "Ward 113 · Domlur",
                  officer: "Manjunath B (Water Specialist)",
                  slaAvg: "91.2%",
                  riskLevel: "MODERATE",
                  riskColor: "amber",
                  highlight: "BWSSB drainage lines near flyover junction",
                  activeCount: issues.filter(i => i.ward?.includes("113") || i.location?.toLowerCase().includes("domlur")).length || 3,
                  criticalCount: issues.filter(i => (i.ward?.includes("113") || i.location?.toLowerCase().includes("domlur")) && i.severity === "critical").length || 1
                },
                {
                  id: "114",
                  name: "Ward 114 · Ulsoor",
                  officer: "Asha Kulkarni (Lineman Unit 2)",
                  slaAvg: "97.4%",
                  riskLevel: "STABLE",
                  riskColor: "emerald",
                  highlight: "BESCOM smart grid streetlights installed",
                  activeCount: issues.filter(i => i.ward?.includes("114") || i.location?.toLowerCase().includes("ulsoor")).length || 2,
                  criticalCount: issues.filter(i => (i.ward?.includes("114") || i.location?.toLowerCase().includes("ulsoor")) && i.severity === "critical").length || 0
                },
                {
                  id: "115",
                  name: "Ward 115 · HAL Airport Rd",
                  officer: "Santosh M (Sanitation Lead)",
                  slaAvg: "93.6%",
                  riskLevel: "MODERATE",
                  riskColor: "amber",
                  highlight: "High-speed transit corridor with SWM crew",
                  activeCount: issues.filter(i => i.ward?.includes("115") || i.location?.toLowerCase().includes("hal")).length || 3,
                  criticalCount: issues.filter(i => (i.ward?.includes("115") || i.location?.toLowerCase().includes("hal")) && i.severity === "critical").length || 1
                }
              ].map((ward) => (
                <div
                  key={ward.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isLight ? "bg-white border-slate-200 shadow-sm" : "glass-card border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-white/5">
                    <span className="font-bold text-coral-400">ZONE {ward.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      ward.riskColor === "rose"
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                        : ward.riskColor === "amber"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    }`}>
                      {ward.riskLevel}
                    </span>
                  </div>

                  <h4 className="font-bold text-base mt-2.5">{ward.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{ward.highlight}</p>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/5 text-xs font-mono">
                    <div className="p-2 rounded-xl bg-black/30 border border-white/5 space-y-0.5">
                      <div className="text-[10px] text-slate-400">ACTIVE TICKETS:</div>
                      <div className="text-sm font-bold text-white">{ward.activeCount} orders</div>
                    </div>
                    <div className="p-2 rounded-xl bg-black/30 border border-white/5 space-y-0.5">
                      <div className="text-[10px] text-rose-400 font-semibold">CRITICAL HAZARDS:</div>
                      <div className="text-sm font-bold text-rose-400">{ward.criticalCount} alert</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono mt-3 pt-2 text-slate-400">
                    <span>SLA Adherence:</span>
                    <span className="font-bold text-emerald-400">{ward.slaAvg}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Department SLA Performance Leaderboard */}
          <div className={`p-6 rounded-3xl border space-y-4 ${
            isLight ? "bg-white border-slate-200" : "glass-card border-white/10"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <span>Municipal Department SLA & Resolution Leaderboard</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Tracking Mean Time to Resolution (MTTR), SLA compliance rate, and rapid crew responsiveness.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
                MONTHLY TARGET: ≥ 90% SLA
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-white/10 pb-2">
                    <th className="py-2.5 px-3">RANK</th>
                    <th className="py-2.5 px-3">DEPARTMENT</th>
                    <th className="py-2.5 px-3">JURISDICTION</th>
                    <th className="py-2.5 px-3 text-center">OPEN ORDERS</th>
                    <th className="py-2.5 px-3 text-center">AVG MTTR</th>
                    <th className="py-2.5 px-3">SLA COMPLIANCE</th>
                    <th className="py-2.5 px-3 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    {
                      rank: "#1",
                      dept: "BESCOM Electrical & Streetlights",
                      lead: "Asha Kulkarni",
                      scope: "Streetlights, HT Cabling, Power Outages",
                      open: issues.filter(i => i.category === "Streetlight").length || 2,
                      mttr: "11.4 hrs",
                      sla: 97.2,
                      status: "EXCELLING",
                      color: "emerald"
                    },
                    {
                      rank: "#2",
                      dept: "BBMP Roads & Infrastructure",
                      lead: "Raju K",
                      scope: "Potholes, Road Cave-ins, Footpaths",
                      open: issues.filter(i => i.category === "Pothole" || i.category === "Road safety" || i.category === "Accessibility").length || 5,
                      mttr: "16.8 hrs",
                      sla: 94.6,
                      status: "ON TARGET",
                      color: "emerald"
                    },
                    {
                      rank: "#3",
                      dept: "SWM Solid Waste Management",
                      lead: "Santosh M",
                      scope: "Garbage Dumps, Bio-waste, Sweeping",
                      open: issues.filter(i => i.category === "Waste").length || 2,
                      mttr: "13.2 hrs",
                      sla: 93.0,
                      status: "ON TARGET",
                      color: "emerald"
                    },
                    {
                      rank: "#4",
                      dept: "BWSSB Water Supply & Drainage",
                      lead: "Manjunath B",
                      scope: "Pipe Bursts, Manhole Overflows, Storm Drains",
                      open: issues.filter(i => i.category === "Water leakage" || i.category === "Drainage").length || 3,
                      mttr: "21.5 hrs",
                      sla: 89.4,
                      status: "MONITORED",
                      color: "amber"
                    }
                  ].map((row) => (
                    <tr key={row.rank} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 font-bold text-coral-400">{row.rank}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-white text-[13px]">{row.dept}</div>
                        <div className="text-slate-400 text-[10px]">Lead Inspector: {row.lead}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{row.scope}</td>
                      <td className="py-3 px-3 text-center font-bold text-white">{row.open}</td>
                      <td className="py-3 px-3 text-center text-amber-300">{row.mttr}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-400 w-12">{row.sla}%</span>
                          <div className="w-24 bg-white/10 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${row.sla}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          row.status === "EXCELLING"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : row.status === "ON TARGET"
                              ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                              : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. AI Municipal Commissioner Briefing Highlights Card */}
          <div className="p-6 rounded-3xl border border-coral-500/30 bg-gradient-to-br from-coral-950/20 via-black/40 to-amber-950/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-coral-400 font-mono text-xs font-bold uppercase">
                <Sparkles className="w-4 h-4" />
                <span>AI Automated Municipal Operations Briefing</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1.5">
                <div className="text-slate-400 text-[11px] uppercase">1. REDUNDANCY SAVINGS</div>
                <div className="text-xl font-bold text-emerald-400">{multiReportMasterCount * 3 + 12} Dispatches Saved</div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Spatial clustering prevented multiple field crews from deploying to the same road hazard.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1.5">
                <div className="text-slate-400 text-[11px] uppercase">2. PRIORITY HOTSPOT</div>
                <div className="text-xl font-bold text-rose-400">100ft Road Indiranagar</div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Highest arterial priority score (92/100). Rapid Crew 4 is en route with watermarked asphalt repair.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1.5">
                <div className="text-slate-400 text-[11px] uppercase">3. CITIZEN SIGN-OFF RATE</div>
                <div className="text-xl font-bold text-amber-300">96.4% Verified</div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Civic Karma incentives led to sub-4-hour resident sign-offs on completed watermarked proofs.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowBriefingModal(true)}
                className="px-5 py-3 rounded-xl bg-coral-500 hover:bg-coral-600 text-white font-mono font-bold text-xs flex items-center gap-2 shadow-lg shadow-coral-500/25 transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>View Full Executive Briefing & Export Report →</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ONE-CLICK DISPATCH MODAL */}
      {dispatchingIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-lg rounded-3xl p-6 sm:p-8 border shadow-2xl space-y-5 ${
            isLight ? "bg-white border-slate-300 text-slate-900" : "bg-[#12181b] border-white/10 text-white"
          }`}>
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-xs font-mono text-coral-500 font-bold">DISPATCH CREW</span>
                <h3 className="text-xl font-bold">#{dispatchingIssue.code} · {dispatchingIssue.category}</h3>
              </div>
              <button
                onClick={() => setDispatchingIssue(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmDispatch} className="space-y-4">
              <div>
                <h4 className="font-bold text-sm">{dispatchingIssue.title}</h4>
                <p className={`text-xs mt-0.5 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                  Location: {dispatchingIssue.location}
                </p>
              </div>

              {/* Worker select */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Assign Field Worker Team:</label>
                <select
                  value={selectedWorker}
                  onChange={(e) => setSelectedWorker(e.target.value)}
                  className={`w-full p-3 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-coral-500 ${
                    isLight ? "bg-slate-50 border-slate-300 text-slate-900" : "bg-[#0d1117] border-white/10 text-white"
                  }`}
                >
                  {workers.map((w, i) => (
                    <option key={i} value={w.name}>
                      {w.name} — {w.dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* SLA Hours */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Target SLA Window (Hours):</label>
                <div className="grid grid-cols-4 gap-2">
                  {[12, 24, 48, 72].map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => setTargetSla(hrs)}
                      className={`py-2 rounded-xl text-xs font-mono border transition-all ${
                        targetSla === hrs
                          ? "bg-coral-500 text-white font-bold border-coral-500"
                          : isLight ? "bg-slate-100 border-slate-300 text-slate-700" : "bg-white/5 border-white/10 text-slate-300"
                      }`}
                    >
                      {hrs} hours
                    </button>
                  ))}
                </div>
              </div>

              {/* Instructions / Dispatch Note */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Work Order Instructions:</label>
                <textarea
                  rows={2}
                  value={dispatchNote}
                  onChange={(e) => setDispatchNote(e.target.value)}
                  placeholder="e.g. High priority signal. Mobilize rapid response crew with cold mix asphalt."
                  className={`w-full p-3 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-coral-500 ${
                    isLight ? "bg-slate-50 border-slate-300 text-slate-900" : "bg-[#0d1117] border-white/10 text-white"
                  }`}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-coral-500 hover:bg-coral-600 text-white font-semibold text-xs font-mono flex items-center justify-center gap-2 shadow-lg shadow-coral-500/20"
                >
                  <Send className="w-4 h-4" />
                  <span>Dispatch Work Order →</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDispatchingIssue(null)}
                  className={`px-4 py-3 rounded-xl text-xs font-mono border ${
                    isLight ? "bg-slate-100 border-slate-300" : "bg-white/5 border-white/10"
                  }`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECT REPORT DRAWER / MODAL (Matching CIV-1028 prototype screenshot) */}
      {inspectingIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-2xl rounded-3xl p-6 sm:p-8 border shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto ${
            isLight ? "bg-[#faf9f6] border-slate-300 text-slate-900" : "bg-[#12181b] border-white/10 text-white"
          }`}>
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-coral-500 font-bold">
                    #{inspectingIssue.code}
                  </span>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {inspectingIssue.status}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Priority {inspectingIssue.priorityScore}
                  </span>
                </div>
                <h2 className="text-2xl font-bold mt-1">{inspectingIssue.title}</h2>
                <div className="text-xs font-mono text-slate-400 mt-0.5">
                  {inspectingIssue.location} · Reported {inspectingIssue.reportedAt}
                </div>
              </div>

              {/* SLA Window badge */}
              <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-center">
                <div className="text-[10px] font-mono text-emerald-400 uppercase">SLA WINDOW</div>
                <div className="text-xl font-mono font-bold text-emerald-300">{inspectingIssue.slaDeadlineHours} hours</div>
              </div>
            </div>

            {/* AI Multi-Factor Priority & Triage Diagnostic Card */}
            {(() => {
              const inspectPriority = evaluateCivicPriority({
                title: inspectingIssue.title,
                description: inspectingIssue.description,
                category: inspectingIssue.category,
                location: inspectingIssue.location,
                reportCount: inspectingIssue.reportCount || inspectingIssue.combinedReports?.length || 1,
                upvotes: inspectingIssue.upvotes,
                severity: inspectingIssue.severity,
                slaDeadlineHours: inspectingIssue.slaDeadlineHours,
                status: inspectingIssue.status,
                reportedAt: inspectingIssue.reportedAt
              });

              return (
                <div className={`p-5 rounded-2xl border space-y-4 shadow-lg ${
                  inspectPriority.tier === "CRITICAL"
                    ? "border-rose-500/40 bg-rose-950/20"
                    : inspectPriority.tier === "HIGH"
                      ? "border-amber-500/40 bg-amber-950/20"
                      : "border-blue-500/30 bg-blue-950/10"
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Gauge className={`w-4 h-4 ${inspectPriority.badgeColor}`} />
                      <span className="font-mono text-xs font-bold uppercase tracking-wider">
                        AI Multi-Factor Resolution Priority Analysis
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${inspectPriority.badgeBg}`}>
                        Score {inspectPriority.totalScore}/100 · {inspectPriority.tier}
                      </span>
                    </div>
                  </div>

                  {/* 5-Criteria Progress Bars */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs font-mono">
                    {/* 1. Safety Hazard */}
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-300 flex items-center gap-1">🛡️ Public Safety / Hazard</span>
                        <span className="font-bold text-coral-400">{inspectPriority.safetyHazardScore}/30 pts</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-coral-500 h-full rounded-full" style={{ width: `${(inspectPriority.safetyHazardScore / 30) * 100}%` }} />
                      </div>
                    </div>

                    {/* 2. Cluster Volume */}
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-300 flex items-center gap-1">👥 Duplicate Cluster Volume</span>
                        <span className="font-bold text-amber-400">{inspectPriority.clusterVolumeScore}/25 pts</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full" style={{ width: `${(inspectPriority.clusterVolumeScore / 25) * 100}%` }} />
                      </div>
                    </div>

                    {/* 3. Category Severity */}
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-300 flex items-center gap-1">🏗️ Infrastructure Severity</span>
                        <span className="font-bold text-blue-400">{inspectPriority.categorySeverityScore}/20 pts</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-400 h-full rounded-full" style={{ width: `${(inspectPriority.categorySeverityScore / 20) * 100}%` }} />
                      </div>
                    </div>

                    {/* 4. SLA Aging Urgency */}
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-300 flex items-center gap-1">⏱️ Time / SLA Aging Pressure</span>
                        <span className="font-bold text-purple-400">{inspectPriority.slaUrgencyScore}/15 pts</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-purple-400 h-full rounded-full" style={{ width: `${(inspectPriority.slaUrgencyScore / 15) * 100}%` }} />
                      </div>
                    </div>

                    {/* 5. Traffic & Arterial Density */}
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1 sm:col-span-2">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-300 flex items-center gap-1">🚦 Traffic & Arterial Density</span>
                        <span className="font-bold text-emerald-400">{inspectPriority.trafficDensityScore}/10 pts</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${(inspectPriority.trafficDensityScore / 10) * 100}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Recommended Action Directive */}
                  <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-start gap-2.5 text-xs">
                    <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-mono font-bold text-amber-300">AI Operational Directive: </span>
                      <span className="text-slate-200">{inspectPriority.recommendedAction}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* AI Master Issue Aggregation & Combined Reports Box */}
            {((inspectingIssue.reportCount && inspectingIssue.reportCount > 1) || (inspectingIssue.combinedReports && inspectingIssue.combinedReports.length > 1)) ? (
              <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-950/20 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase font-bold">
                    <Layers className="w-4 h-4" />
                    <span>AI Master Issue — {inspectingIssue.reportCount || inspectingIssue.combinedReports?.length} Resident Reports Combined</span>
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 w-fit">
                    Single Authority Ticket
                  </span>
                </div>
                
                <p className="text-xs text-slate-300 leading-relaxed">
                  Civion AI analyzed incoming resident complaints in this 100m geospatial radius. These <strong>{inspectingIssue.reportCount || inspectingIssue.combinedReports?.length} citizen reports</strong> have been combined into this single authoritative master ticket so field crews handle one consolidated work order instead of duplicate tickets.
                </p>

                {/* Combined Citizen Reports Cards */}
                <div className="space-y-2 pt-2 border-t border-amber-500/20">
                  <div className="flex items-center justify-between text-[11px] font-mono text-amber-300 uppercase font-semibold">
                    <span>Aggregated Resident Complaints ({inspectingIssue.combinedReports?.length || inspectingIssue.reportCount}):</span>
                    <span className="text-slate-400 font-normal">Auto-deduplicated</span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {inspectingIssue.combinedReports && inspectingIssue.combinedReports.length > 0 ? (
                      inspectingIssue.combinedReports.map((rep, idx) => (
                        <div key={rep.id || idx} className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1.5 text-xs font-mono">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-coral-400 font-bold">{rep.residentName}</span>
                              {rep.residentContact && (
                                <span className="text-slate-400 text-[10px]">({rep.residentContact})</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              {rep.distanceMeters !== undefined && (
                                <span className="bg-white/5 px-1.5 py-0.5 rounded text-amber-300">{rep.distanceMeters}m away</span>
                              )}
                              {rep.similarityScore !== undefined && (
                                <span className="bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                  {Math.round(rep.similarityScore * 100)}% Match
                                </span>
                              )}
                              <span>{rep.reportedAt}</span>
                            </div>
                          </div>
                          <div className="text-slate-300 font-sans italic text-xs leading-relaxed pl-2 border-l-2 border-coral-500/50">
                            &ldquo;{rep.rawText}&rdquo;
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-400 font-mono">
                        {inspectingIssue.reportedBy} ({inspectingIssue.upvotes} citizens supported)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-950/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-400 font-mono text-xs uppercase font-bold">
                    <FileText className="w-4 h-4" />
                    <span>Single Master Ticket — 1 Resident Report</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                    Newly Created Portal Entry
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  No previous open reports matched this location within the 100m geofence. The AI agent created this as a new standalone master ticket in the authority complaint queue.
                </p>
              </div>
            )}

            {/* Split Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isLight ? "bg-white border-slate-200" : "bg-black/30 border-white/5"
              }`}>
                <div className="text-xs font-mono text-coral-500 uppercase font-bold">Report detail</div>
                <p className={`text-xs leading-relaxed ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                  {inspectingIssue.description}
                </p>
                <div className="pt-2 border-t border-white/10 text-xs font-mono space-y-1">
                  <div>Reported By: {inspectingIssue.reportedBy}</div>
                  <div>Category: {inspectingIssue.category}</div>
                  <div>Upvotes: {inspectingIssue.upvotes} citizens supported</div>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border space-y-3 ${
                isLight ? "bg-white border-slate-200" : "bg-black/30 border-white/5"
              }`}>
                <div className="text-xs font-mono text-coral-500 uppercase font-bold">Resolution follow-through</div>
                {inspectingIssue.residentVerification?.verified ? (
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Citizen verified</span>
                    </div>
                    <div>{inspectingIssue.residentVerification.feedback || "The resident confirmed the fix."}</div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 font-mono">
                    The resident can verify this once field work is completed.
                  </div>
                )}

                <div className="text-xs font-mono space-y-1 pt-2 border-t border-white/10">
                  <div>Assigned Crew: {inspectingIssue.assignedWorker || "Unassigned"}</div>
                  <div>SLA Status: {inspectingIssue.slaDeadlineTime || "On track"}</div>
                </div>
              </div>
            </div>

            {/* Resident Evidence Attachment */}
            {inspectingIssue.beforePhoto && (
              <div className="space-y-2">
                <div className="text-xs font-mono text-slate-400 uppercase font-bold flex items-center justify-between">
                  <span>RESIDENT CITIZEN ATTACHMENT:</span>
                  <span className="text-[10px] text-coral-400 font-normal">Original incident photo</span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={inspectingIssue.beforePhoto}
                  alt="Incident evidence photo"
                  className="w-full h-48 sm:h-56 object-cover rounded-2xl border border-white/10"
                />
              </div>
            )}

            {/* Exact Incident Pinpoint Map */}
            <div className="space-y-1.5">
              <div className="text-xs font-mono text-coral-500 uppercase font-bold flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5" />
                <span>Exact Incident Coordinates & Geospatial Map:</span>
              </div>
              <InteractiveMapPicker
                initialLat={inspectingIssue.coordinates[0]}
                initialLng={inspectingIssue.coordinates[1]}
                readOnly
                height="210px"
                onLocationSelect={() => {}}
              />
            </div>

            {/* Field Notes Log */}
            {inspectingIssue.fieldNotes.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-mono text-slate-400 uppercase font-bold">AUDIT TRAIL & FIELD NOTES:</div>
                <div className="space-y-2">
                  {inspectingIssue.fieldNotes.map((fn) => (
                    <div key={fn.id} className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs font-mono flex items-start justify-between gap-4">
                      <div>
                        <span className="text-coral-400 font-bold">{fn.author} ({fn.role}): </span>
                        <span>{fn.text}</span>
                      </div>
                      <span className="text-slate-500 flex-shrink-0">{fn.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono border border-white/10 text-slate-400 hover:text-white"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Order</span>
              </button>

              <div className="flex gap-2">
                {!inspectingIssue.assignedWorker && (
                  <button
                    onClick={() => {
                      const iss = inspectingIssue;
                      setInspectingIssue(null);
                      setDispatchingIssue(iss);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-coral-500 hover:bg-coral-600 text-white text-xs font-mono font-bold shadow-md"
                  >
                    Dispatch Crew →
                  </button>
                )}
                <button
                  onClick={() => setInspectingIssue(null)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-mono border ${
                    isLight ? "bg-slate-100 border-slate-300 text-slate-800" : "bg-white/5 border-white/10"
                  }`}
                >
                  Close Drawer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW MUNICIPAL WORK ORDER MODAL */}
      {showWorkOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className={`w-full max-w-xl rounded-3xl p-6 sm:p-8 border shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto ${
            isLight ? "bg-[#faf9f6] border-slate-300 text-slate-900" : "bg-[#12181b] border-white/10 text-white"
          }`}>
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-xs font-mono text-coral-500 font-bold uppercase tracking-wider">
                  MUNICIPAL OPERATIONS · NORTH ZONE
                </span>
                <h3 className="text-2xl font-bold mt-0.5">Commission Official Work Order</h3>
              </div>
              <button
                onClick={() => setShowWorkOrderModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWorkOrder} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono font-medium text-slate-400">Work Order Title</label>
                <input
                  type="text"
                  required
                  value={woTitle}
                  onChange={(e) => setWoTitle(e.target.value)}
                  placeholder="e.g. Scheduled storm drain desilting before monsoon"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-coral-500 ${
                    isLight ? "bg-white border-slate-300 text-slate-900" : "bg-[#0d1117] border-white/10 text-white"
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-medium text-slate-400">Category</label>
                  <select
                    value={woCategory}
                    onChange={(e) => setWoCategory(e.target.value as any)}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-mono border focus:outline-none ${
                      isLight ? "bg-white border-slate-300 text-slate-900" : "bg-[#0d1117] border-white/10 text-white"
                    }`}
                  >
                    {(userAllowedCategories || ["Road safety", "Pothole", "Drainage", "Water leakage", "Streetlight", "Waste", "Accessibility"]).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-medium text-slate-400">Ward Jurisdiction</label>
                  <select
                    value={woWard}
                    onChange={(e) => setWoWard(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-mono border focus:outline-none ${
                      isLight ? "bg-white border-slate-300 text-slate-900" : "bg-[#0d1117] border-white/10 text-white"
                    }`}
                  >
                    <option value="Ward 112 - Indiranagar">Ward 112 - Indiranagar</option>
                    <option value="Ward 113 - Domlur">Ward 113 - Domlur</option>
                    <option value="Ward 114 - Jeevan Bima Nagar">Ward 114 - Jeevan Bima Nagar</option>
                    <option value="Ward 115 - Ulsoor">Ward 115 - Ulsoor</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-medium text-slate-400">Incident Street Location / Landmark</label>
                <input
                  type="text"
                  required
                  value={woLocation}
                  onChange={(e) => setWoLocation(e.target.value)}
                  placeholder="e.g. 100 Feet Road, Indiranagar Metro"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-coral-500 ${
                    isLight ? "bg-white border-slate-300 text-slate-900" : "bg-[#0d1117] border-white/10 text-white"
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-medium text-slate-400">Severity</label>
                  <select
                    value={woSeverity}
                    onChange={(e) => setWoSeverity(e.target.value as any)}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-mono border focus:outline-none ${
                      isLight ? "bg-white border-slate-300 text-slate-900" : "bg-[#0d1117] border-white/10 text-white"
                    }`}
                  >
                    <option value="critical">Critical (Emergency)</option>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low Maintenance</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-medium text-slate-400">Assigned Crew</label>
                  <select
                    value={woWorker}
                    onChange={(e) => setWoWorker(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-mono border focus:outline-none ${
                      isLight ? "bg-white border-slate-300 text-slate-900" : "bg-[#0d1117] border-white/10 text-white"
                    }`}
                  >
                    {workers.map((w, idx) => (
                      <option key={idx} value={w.name}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-medium text-slate-400">SLA Window</label>
                  <select
                    value={woSla}
                    onChange={(e) => setWoSla(Number(e.target.value))}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-mono border focus:outline-none ${
                      isLight ? "bg-white border-slate-300 text-slate-900" : "bg-[#0d1117] border-white/10 text-white"
                    }`}
                  >
                    <option value={12}>12 Hours (Emergency)</option>
                    <option value={24}>24 Hours (Standard)</option>
                    <option value={48}>48 Hours (Scheduled)</option>
                    <option value={72}>72 Hours (Routine)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-medium text-slate-400">Operational Scope & Instructions</label>
                <textarea
                  rows={3}
                  value={woDescription}
                  onChange={(e) => setWoDescription(e.target.value)}
                  placeholder="Specify equipment required, safety cordons, traffic diversions, and quality thresholds..."
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-coral-500 ${
                    isLight ? "bg-white border-slate-300 text-slate-900" : "bg-[#0d1117] border-white/10 text-white"
                  }`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowWorkOrderModal(false)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-mono border ${
                    isLight ? "bg-slate-100 border-slate-300 text-slate-800" : "bg-white/5 border-white/10 text-slate-300"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-coral-500 hover:bg-coral-600 text-white font-mono font-bold text-xs shadow-lg shadow-coral-500/25 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Commission & Dispatch Work Order</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MUNICIPAL COMMISSIONER EXECUTIVE BRIEFING MODAL */}
      {showBriefingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className={`w-full max-w-3xl my-8 rounded-3xl p-8 sm:p-10 border shadow-2xl space-y-6 ${
            isLight ? "bg-white border-slate-300 text-slate-900" : "bg-[#10171b] border-white/15 text-white"
          }`}>
            {/* Formal Municipal Letterhead */}
            <div className="border-b-2 border-coral-500/80 pb-5 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-coral-500/20 border border-coral-500/40 text-coral-400 flex items-center justify-center text-2xl font-bold">
                    🏛️
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold tracking-widest text-coral-500 uppercase">
                      BRUHAT BENGALURU MAHANAGARA PALIKE (BBMP)
                    </div>
                    <h2 className="text-xl font-black tracking-tight">
                      MUNICIPAL OPERATIONS COMMISSIONER BRIEFING
                    </h2>
                    <div className="text-xs font-mono text-slate-400">
                      Division: North District Urban Services · Wards 112–115 Operations Audit
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowBriefingModal(false)}
                  className="p-1.5 rounded-xl border border-white/10 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between text-[11px] font-mono pt-2 text-slate-400 border-t border-white/5">
                <div>DOCUMENT REF: <strong>BBMP-NC-2026-0909-SLA</strong></div>
                <div>AUDIT WINDOW: <strong>LAST 24 HOURS</strong></div>
                <div>STATUS: <strong className="text-emerald-400">OFFICIAL EXECUTIVE DOSSIER</strong></div>
              </div>
            </div>

            {/* 1. Executive Summary & AI Aggregation Savings */}
            <div className="space-y-2">
              <h4 className="font-mono text-xs uppercase font-bold text-coral-400">
                1. EXECUTIVE SUMMARY & AI DEDUPLICATION EFFICIENCY
              </h4>
              <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                During the current reporting cycle, the North District Command Center logged a total of <strong>{totalCombinedCitizenReports} resident complaints</strong>. Through Civion&apos;s 100m spatial-semantic AI deduplication engine, these were unified into <strong>{totalCount} authoritative master work orders</strong>, saving an estimated <strong>{multiReportMasterCount * 3 + 12} redundant field dispatches</strong> and conserving ~46 crew working hours.
              </p>
            </div>

            {/* 2. Key Operational Metrics Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                <div className="text-[10px] text-slate-400">CITIZEN SIGNALS:</div>
                <div className="text-lg font-bold text-white">{totalCombinedCitizenReports}</div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                <div className="text-[10px] text-amber-400">MASTER TICKETS:</div>
                <div className="text-lg font-bold text-amber-300">{totalCount}</div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                <div className="text-[10px] text-emerald-400">SLA ADHERENCE:</div>
                <div className="text-lg font-bold text-emerald-400">94.2%</div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                <div className="text-[10px] text-coral-400">RESOLVED & SIGNED:</div>
                <div className="text-lg font-bold text-coral-400">{resolvedCount}</div>
              </div>
            </div>

            {/* 3. Ward Risk Allocation Breakdown */}
            <div className="space-y-2 pt-1 font-mono text-xs">
              <h4 className="text-xs uppercase font-bold text-coral-400">
                2. WARD INCIDENT DISTRIBUTION & RISK RATINGS
              </h4>
              <div className="divide-y divide-white/10 border border-white/10 rounded-xl overflow-hidden bg-black/20">
                <div className="p-3 flex items-center justify-between text-[11px]">
                  <span><strong>Ward 112 (Indiranagar):</strong> 6 Open Orders · 2 Critical Hazards</span>
                  <span className="text-rose-400 font-bold">HIGH RISK ARTERIAL</span>
                </div>
                <div className="p-3 flex items-center justify-between text-[11px]">
                  <span><strong>Ward 113 (Domlur):</strong> 3 Open Orders · 1 Critical Hazard</span>
                  <span className="text-amber-400 font-bold">MODERATE DRAINAGE</span>
                </div>
                <div className="p-3 flex items-center justify-between text-[11px]">
                  <span><strong>Ward 114 (Ulsoor):</strong> 2 Open Orders · 0 Critical Hazards</span>
                  <span className="text-emerald-400 font-bold">OPTIMAL STABILITY</span>
                </div>
                <div className="p-3 flex items-center justify-between text-[11px]">
                  <span><strong>Ward 115 (HAL Airport Rd):</strong> 3 Open Orders · 1 Critical Hazard</span>
                  <span className="text-amber-400 font-bold">MODERATE TRANSIT</span>
                </div>
              </div>
            </div>

            {/* 4. Digital Watermark & Civic Karma Compliance */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs font-mono space-y-1.5">
              <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>MUNICIPAL INTEGRITY & WATERMARK AUDIT COMPLIANCE: 100%</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                All closed work orders require GPS coordinates, timestamped photo proof, and digital worker signatures. Zero tickets have been closed without citizen verification sign-off or digital watermark audit records.
              </p>
            </div>

            {/* Official Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-white/15 text-xs font-mono">
              <div className="space-y-1">
                <div className="text-[10px] text-slate-400 uppercase">SUBMITTED BY:</div>
                <div className="font-bold text-white">Suresh Gowda, KAS</div>
                <div className="text-slate-400 text-[11px]">Zonal Operations Lead · North District</div>
                <div className="text-[10px] text-emerald-400 pt-2 font-bold">DIGITALLY SIGNED & SEALED ✓</div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] text-slate-400 uppercase">TRANSMITTED TO:</div>
                <div className="font-bold text-white">Special Municipal Commissioner</div>
                <div className="text-slate-400 text-[11px]">BBMP Operations & Urban Infrastructure</div>
                <div className="text-[10px] text-slate-400 pt-2">Civion Smart City Platform</div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowBriefingModal(false)}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-mono text-slate-400 hover:text-white"
              >
                Close Dossier
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl bg-coral-500 hover:bg-coral-600 text-white font-mono font-bold text-xs flex items-center gap-2 shadow-lg shadow-coral-500/25 transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Commissioner Briefing</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
