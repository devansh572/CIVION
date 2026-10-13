"use client";

import React, { useState } from "react";
import { useCivionStore, CivicIssue, PhotoWatermark } from "@/lib/civion-store";
import { findWorkerAccount, CivicCategory } from "@/lib/worker-credentials";
import { InteractiveMapPicker } from "@/components/InteractiveMapPicker";
import { 
  Compass, MapPin, Clock, Camera, FileText, 
  CheckCircle2, AlertTriangle, ShieldAlert, ArrowRight,
  HardHat, Phone, Check, RefreshCw, Navigation, Upload,
  Zap, Award, ShieldCheck, Flame, Layers
} from "lucide-react";

export const FieldWorkerDashboard: React.FC = () => {
  const { 
    issues, 
    workerSetEnRoute,
    workerMarkOnSite, 
    workerAddNote, 
    workerUploadEvidence, 
    workerRequestBackup, 
    workerCompleteJob,
    workerCompleteJobWithWatermark,
    currentUser,
    theme 
  } = useCivionStore();

  const isLight = theme === "light";

  // Selected task state
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [showWorkerMap, setShowWorkerMap] = useState(true);
  const [noteInput, setNoteInput] = useState("");
  const [backupReason, setBackupReason] = useState("");
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");
  const [afterPhotoPreview, setAfterPhotoPreview] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Determine authorized categories for the logged-in field worker
  const workerAccount = currentUser?.email ? findWorkerAccount(currentUser.email) : undefined;
  const userAllowedCategories: CivicCategory[] = (currentUser?.allowedCategories && currentUser.allowedCategories.length > 0)
    ? (currentUser.allowedCategories as CivicCategory[])
    : workerAccount
      ? workerAccount.allowedCategories
      : ["Pothole", "Road safety"];

  // Field worker's assigned tasks strictly filtered by allowed categories & sorted by AI Priority Score descending
  const workerIssues = issues
    .filter((i) => {
      // 1. Strict category isolation: only show reports matching assigned worker department
      if (userAllowedCategories && userAllowedCategories.length > 0) {
        if (!userAllowedCategories.includes(i.category as CivicCategory)) {
          return false;
        }
      }

      // 2. Sub-category filter selected by the worker (e.g. "Pothole" or "Road safety")
      if (categoryFilter !== "ALL" && i.category !== categoryFilter) {
        return false;
      }

      return true;
    })
    .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

  const activeTask = workerIssues.find((i) => i.id === activeTaskId) || workerIssues[0] || null;

  const handleWorkerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAfterPhotoPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSimulateAfterPhoto = () => {
    const afterSamples = [
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800",
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800"
    ];
    setAfterPhotoPreview(afterSamples[Math.floor(Math.random() * afterSamples.length)]);
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      
      {/* Mobile-first crew status banner with AI Category Specialization */}
      <div className={`p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isLight ? "bg-white border-slate-200 shadow-sm" : "glass-card"
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amberGold-500/20 border border-amberGold-500/40 text-amberGold-400 flex items-center justify-center flex-shrink-0">
            <HardHat className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono text-amberGold-400 font-bold uppercase tracking-wider">
                FIELD WORKER PORTAL · {currentUser?.district || workerAccount?.department || "RAPID FIELD RESPONSE"}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                AI JURISDICTION: {userAllowedCategories.join(" & ").toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl font-bold mt-1">
              {currentUser?.name || workerAccount?.name || "Field Operations Specialist"}
            </h2>
            <div className="text-xs font-mono text-slate-400">
              {currentUser?.title || workerAccount?.title || "Field Inspector"} · {currentUser?.email}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>CREW GPS ONLINE</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amberGold-500/10 border border-amberGold-500/30 text-amberGold-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amberGold-400" />
            <span>{workerIssues.length} ORDERS IN SCOPE</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Task List & Execution Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Assigned Tasks Queue */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
              <span>Assigned Work Orders</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-coral-500/20 text-coral-400 font-bold">
                {workerIssues.length}
              </span>
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>AI ROUTE OPTIMIZED</span>
            </span>
          </div>

          {/* Sub-Category Filter Pills if worker manages multiple categories */}
          {userAllowedCategories.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setCategoryFilter("ALL")}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-medium transition-all ${
                  categoryFilter === "ALL"
                    ? "bg-amberGold-500 text-black font-bold shadow-sm"
                    : isLight
                      ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                All ({userAllowedCategories.join(", ")})
              </button>
              {userAllowedCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-medium transition-all ${
                    categoryFilter === cat
                      ? "bg-amberGold-500 text-black font-bold shadow-sm"
                      : isLight
                        ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {workerIssues.length === 0 ? (
              <div className={`p-8 text-center rounded-2xl border ${
                isLight ? "bg-white border-slate-200" : "glass-card border-white/10"
              }`}>
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="font-bold text-sm">All Work Orders Cleared</p>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  No active incidents pending in {userAllowedCategories.join(" / ")}.
                </p>
              </div>
            ) : null}
            {workerIssues.map((task, idx) => {
              const isSelected = activeTask?.id === task.id;
              const isCritical = task.severity === "critical";
              const distanceMock = `${(0.4 + idx * 0.7).toFixed(1)} km away`;

              return (
                <div
                  key={task.id}
                  onClick={() => setActiveTaskId(task.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? isLight
                        ? "bg-amber-50/80 border-amber-500/60 shadow-md ring-1 ring-amber-500/30"
                        : "bg-[#182328] border-amberGold-500/60 shadow-lg ring-1 ring-amberGold-500/40"
                      : isLight
                        ? "bg-white border-slate-200 hover:border-slate-300"
                        : "glass-card hover:border-white/20"
                  }`}
                >
                  {/* Route Sequence & Score Header */}
                  <div className="flex items-center justify-between gap-2 text-xs font-mono pb-2 border-b border-white/5">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        idx === 0 
                          ? "bg-coral-500 text-white shadow-sm" 
                          : "bg-white/10 text-slate-300"
                      }`}>
                        STOP #{idx + 1}
                      </span>
                      <span className="font-bold text-coral-500">#{task.code}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold text-[11px] bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                        Score {task.priorityScore || 50}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] ${
                        isCritical
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/30 font-bold"
                          : "bg-amber-500/20 text-amber-300 border-amber-500/30 font-bold"
                      }`}>
                        {task.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 mt-2.5">
                    {task.beforePhoto && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={task.beforePhoto}
                        alt="Evidence thumbnail"
                        className="w-12 h-12 rounded-xl object-cover border border-white/10 flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm line-clamp-1">{task.title}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                        <MapPin className="w-3 h-3 text-coral-500 flex-shrink-0" />
                        <span className="truncate">{task.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5 text-[11px] font-mono">
                    <span className={`px-2 py-0.5 rounded-md font-semibold ${
                      task.status === "Work in Progress"
                        ? "bg-blue-500/20 text-blue-400"
                        : task.status === "En Route"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : task.status === "Resolved & Verified"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-coral-500/20 text-coral-400"
                    }`}>
                      {task.status}
                    </span>
                    <span className="text-amberGold-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {task.slaDeadlineTime || `${task.slaDeadlineHours}h SLA`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Work Execution & Action Panel */}
        {activeTask && (
          <div className="lg:col-span-7 space-y-4">
            <div className={`p-6 sm:p-7 rounded-3xl border space-y-6 ${
              isLight ? "bg-white border-slate-200" : "glass-card"
            }`}>
              
              {/* Task Header */}
              <div className="space-y-2 border-b border-white/10 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-coral-500">#{activeTask.code}</span>
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-white/10">
                      {activeTask.category}
                    </span>
                    {activeTask.isOnSite && (
                      <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        ON-SITE
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-mono text-amberGold-400">
                    SLA Window: {activeTask.slaDeadlineHours} hours
                  </span>
                </div>

                <h3 className="text-xl font-bold">{activeTask.title}</h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                  {activeTask.description}
                </p>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-coral-500" />
                    <span>{activeTask.location}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowWorkerMap(!showWorkerMap)}
                    className="text-xs font-mono text-coral-400 hover:text-coral-300 underline flex items-center gap-1"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>{showWorkerMap ? "Hide GPS Map" : "Open GPS Pinpoint"}</span>
                  </button>
                </div>

                {/* Exact Incident Pinpoint Map */}
                {showWorkerMap && (
                  <div className="pt-2 animate-fade-in">
                    <InteractiveMapPicker
                      initialLat={activeTask.coordinates[0]}
                      initialLng={activeTask.coordinates[1]}
                      readOnly
                      height="200px"
                      onLocationSelect={() => {}}
                    />
                  </div>
                )}
              </div>

              {/* Photo Evidence Section */}
              {activeTask.beforePhoto && (
                <div className="space-y-2">
                  <div className="text-xs font-mono uppercase text-slate-400 font-bold">
                    RESIDENT CITIZEN ATTACHMENT:
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeTask.beforePhoto}
                    alt="Problem photo"
                    className="w-full h-44 object-cover rounded-2xl border border-white/10"
                  />
                </div>
              )}

              {/* 2. WORK EXECUTION ACTION BUTTONS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="uppercase text-coral-500 font-bold">EXECUTION ACTIONS (3-STAGE PROGRESSION):</span>
                  <span className="text-slate-400">Step: {activeTask.isOnSite ? "3/3 Repair & Verification" : activeTask.status === "En Route" ? "2/3 On-Site Arrival" : "1/3 Transit"}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Stage 1: En Route Button */}
                  <button
                    onClick={() => workerSetEnRoute(activeTask.id)}
                    disabled={activeTask.status === "En Route" || activeTask.isOnSite}
                    className={`py-3 px-3 rounded-xl text-xs font-mono font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      activeTask.status === "En Route"
                        ? "bg-purple-950/50 border-purple-500/50 text-purple-300 shadow-sm"
                        : activeTask.isOnSite
                          ? "bg-white/5 border-white/10 text-slate-500 cursor-default opacity-60"
                          : "bg-purple-600 hover:bg-purple-500 text-white border-purple-400 shadow-md shadow-purple-600/20 active:scale-95"
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{activeTask.status === "En Route" ? "✓ En Route" : "1. En Route"}</span>
                  </button>

                  {/* Stage 2: Mark On-Site Button */}
                  <button
                    onClick={() => workerMarkOnSite(activeTask.id)}
                    disabled={activeTask.isOnSite}
                    className={`py-3 px-3 rounded-xl text-xs font-mono font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      activeTask.isOnSite
                        ? "bg-emerald-950/50 border-emerald-500/50 text-emerald-300 opacity-90 cursor-default shadow-sm"
                        : "bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-600/20 active:scale-95"
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{activeTask.isOnSite ? "✓ On-Site Locked" : "2. Mark On-Site"}</span>
                  </button>

                  {/* Stage 3: Upload Before/After Photos */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="file"
                      id="worker-file-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handleWorkerFileUpload}
                    />
                    <label
                      htmlFor="worker-file-upload"
                      className={`flex-1 py-3 px-2 rounded-xl text-xs font-mono font-semibold flex items-center justify-center gap-1 border cursor-pointer transition-colors ${
                        afterPhotoPreview 
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                          : isLight ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800" : "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5 text-coral-400" />
                      <span>{afterPhotoPreview ? "Proof Ready ✓" : "3. Upload Proof"}</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleSimulateAfterPhoto}
                      className="px-2.5 py-3 rounded-xl text-[11px] font-mono border border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                      title="Use sample repaired road evidence"
                    >
                      Sample
                    </button>
                  </div>
                </div>

                {/* Watermarked Proof preview if captured */}
                {afterPhotoPreview && (
                  <div className="relative rounded-2xl overflow-hidden h-44 border-2 border-emerald-500/60 shadow-lg group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={afterPhotoPreview} alt="Work done" className="w-full h-full object-cover" />
                    
                    {/* Digital GPS Watermark overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none flex flex-col justify-between p-3">
                      <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md border border-emerald-500/30 w-fit">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>BBMP MUNICIPAL WORKSPACE · WATERMARK VERIFIED</span>
                        </span>
                      </div>

                      <div className="text-[10px] font-mono text-white/90 space-y-0.5 bg-black/70 backdrop-blur-sm p-2.5 rounded-xl border border-white/10">
                        <div className="text-emerald-400 font-bold flex items-center justify-between">
                          <span>GPS COORD: {activeTask.coordinates[0].toFixed(5)}° N, {activeTask.coordinates[1].toFixed(5)}° E</span>
                          <span className="text-slate-400">ACCURACY: ±3.2m</span>
                        </div>
                        <div className="text-slate-300">TIMESTAMP: {new Date().toLocaleString()}</div>
                        <div className="text-slate-300">WORKER: {currentUser?.name || workerAccount?.name || "Field Specialist"} ({activeTask.category} Rapid Crew)</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add Field Note Input */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-medium">Add Quick Field Note:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="e.g. Cleared debris, applied 50kg asphalt patch..."
                      className={`flex-1 px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-coral-500 ${
                        isLight ? "bg-slate-50 border-slate-300 text-slate-900" : "bg-[#0d1117] border-white/10 text-white"
                      }`}
                    />
                    <button
                      onClick={() => {
                        if (!noteInput.trim()) return;
                        workerAddNote(activeTask.id, noteInput);
                        setNoteInput("");
                      }}
                      className="px-4 py-2 rounded-xl bg-coral-500 hover:bg-coral-600 text-white text-xs font-mono font-bold transition-all"
                    >
                      Post Note
                    </button>
                  </div>
                </div>

                {/* Secondary Actions: Request Material / Backup */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setShowBackupModal(true)}
                    className="text-xs font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1.5"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Request Material / Backup</span>
                  </button>

                  {activeTask.backupRequested && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      Backup Dispatched
                    </span>
                  )}
                </div>

                {/* Primary Final Action: Complete Job & Submit for Resident Sign-Off */}
                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={() => setShowCompleteModal(true)}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:brightness-110 text-white font-bold text-sm font-mono flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/25 active:scale-[0.99] transition-all"
                  >
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                    <span>Complete Job & Submit for Resident Sign-Off →</span>
                  </button>
                </div>
              </div>

              {/* Running Field Notes Log */}
              {activeTask.fieldNotes.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="text-xs font-mono uppercase text-slate-400 font-bold">
                    WORK ORDER LOG:
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                    {activeTask.fieldNotes.map((note) => (
                      <div key={note.id} className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs font-mono flex items-start justify-between gap-2">
                        <div>
                          <span className="text-amberGold-400 font-semibold">{note.author}: </span>
                          <span>{note.text}</span>
                        </div>
                        <span className="text-slate-500 text-[10px] flex-shrink-0">{note.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>

      {/* REQUEST BACKUP MODAL */}
      {showBackupModal && activeTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl space-y-4 ${
            isLight ? "bg-white border-slate-300 text-slate-900" : "bg-[#12181b] border-white/10 text-white"
          }`}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 className="font-bold text-base flex items-center gap-2 text-rose-400">
                <ShieldAlert className="w-5 h-5" />
                <span>Request Material / Backup</span>
              </h4>
              <button onClick={() => setShowBackupModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-400">
              Dispatches an emergency ticket to the Central Depot for equipment, JCB excavator, or police traffic clearance.
            </p>

            <textarea
              rows={3}
              value={backupReason}
              onChange={(e) => setBackupReason(e.target.value)}
              placeholder="e.g. Underground high-tension line uncovered. Require electrical safety isolation team immediately."
              className={`w-full p-3 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                isLight ? "bg-slate-50 border-slate-300 text-slate-900" : "bg-[#0d1117] border-white/10 text-white"
              }`}
            />

            <div className="flex gap-2">
              <button
                onClick={() => {
                  workerRequestBackup(activeTask.id, backupReason || "Heavy equipment needed on-site.");
                  setShowBackupModal(false);
                  setBackupReason("");
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold"
              >
                Send Request
              </button>
              <button
                onClick={() => setShowBackupModal(false)}
                className="px-4 py-3 rounded-xl border text-xs font-mono text-slate-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE & SUBMIT MODAL */}
      {showCompleteModal && activeTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl space-y-4 ${
            isLight ? "bg-white border-slate-300 text-slate-900" : "bg-[#12181b] border-white/10 text-white"
          }`}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 className="font-bold text-base flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <span>Submit Job for Citizen Sign-Off</span>
              </h4>
              <button onClick={() => setShowCompleteModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-400">
              The status will advance to <strong>Resolved (Pending Verification)</strong>. The reporting citizen will be notified to review the before/after photos and confirm the fix.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Final field remarks:</label>
              <textarea
                rows={2}
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="e.g. 100% completed. Asphalt compacted, site swept, and barricades removed."
                className={`w-full p-3 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  isLight ? "bg-slate-50 border-slate-300 text-slate-900" : "bg-[#0d1117] border-white/10 text-white"
                }`}
              />
            </div>

            {/* Watermark Verification summary badge */}
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs font-mono space-y-1">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>GPS Digital Watermark Sealed</span>
                </span>
                <span className="text-[10px] text-emerald-300">±3.2m ACC</span>
              </div>
              <div className="text-slate-300 text-[11px]">
                {activeTask.coordinates[0].toFixed(5)}° N, {activeTask.coordinates[1].toFixed(5)}° E · {new Date().toLocaleTimeString()}
              </div>
              <div className="text-slate-400 text-[10px]">
                Audited to worker: {currentUser?.name || workerAccount?.name || "Field Specialist"}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const watermark: PhotoWatermark = {
                    lat: activeTask.coordinates[0],
                    lng: activeTask.coordinates[1],
                    timestamp: new Date().toLocaleString(),
                    workerName: currentUser?.name || workerAccount?.name || "Field Specialist",
                    department: activeTask.category,
                    accuracyMeters: 3.2
                  };
                  workerCompleteJobWithWatermark(
                    activeTask.id, 
                    completionNotes || "Repairs executed per municipal specification. Site swept and inspected.", 
                    afterPhotoPreview || "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800", 
                    watermark
                  );
                  setShowCompleteModal(false);
                  setCompletionNotes("");
                  setAfterPhotoPreview(null);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold shadow-lg flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit for Sign-Off & Notify Resident ✓</span>
              </button>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="px-4 py-3 rounded-xl border text-xs font-mono text-slate-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
