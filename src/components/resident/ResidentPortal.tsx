"use client";

import React, { useState } from "react";
import { useCivionStore, CivicIssue } from "@/lib/civion-store";
import { InteractiveMapPicker } from "@/components/InteractiveMapPicker";
import { 
  Send, MapPin, ThumbsUp, Search, CheckCircle, AlertTriangle, 
  Camera, ArrowRight, ShieldCheck, Eye, Sparkles, Filter,
  Check, X, FileText, Clock, Navigation, MessageSquare,
  Share2, Printer, Copy, CheckCheck, Upload, ArrowUpDown,
  SlidersHorizontal, User, Crosshair, Layers, Bell, Award, CheckCircle2, Star
} from "lucide-react";

export const ResidentPortal: React.FC = () => {
  const { 
    issues, 
    createSignal, 
    upvoteIssue, 
    residentVerify, 
    addComment,
    citizenNotifications,
    markNotificationRead,
    clearAllNotifications,
    isGuest,
    openAuthModal,
    currentUser,
    theme 
  } = useCivionStore();

  const isLight = theme === "light";

  // Form states
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("100 Feet Road, Indiranagar Metro");
  const [pinCoords, setPinCoords] = useState<[number, number]>([12.9784, 77.6408]);
  const [showMap, setShowMap] = useState<boolean>(true);
  const [category, setCategory] = useState<CivicIssue["category"]>("Pothole");
  const [description, setDescription] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [mockPhoto, setMockPhoto] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

  // Selected issue for deep-dive detail modal (Audit trail + Community Discussion)
  const [detailIssue, setDetailIssue] = useState<CivicIssue | null>(null);
  const [newComment, setNewComment] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Selected issue for map preview inline in Ledger
  const [ledgerMapIssue, setLedgerMapIssue] = useState<CivicIssue | null>(null);

  // Community Feed filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"priority" | "upvotes" | "newest" | "sla">("priority");
  const [activeTab, setActiveTab] = useState<"report" | "ledger" | "verify" | "map" | "dedup">("report");

  // Verification modal state & 3 Feedback Criteria
  const [verifyingIssue, setVerifyingIssue] = useState<CivicIssue | null>(null);
  const [verificationFeedback, setVerificationFeedback] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [verificationSuccessToast, setVerificationSuccessToast] = useState<string | null>(null);
  
  // 1. Is your problem actually resolved? (yes / no)
  const [isActuallyResolved, setIsActuallyResolved] = useState<boolean>(true);
  // 2. Quality of work? (1 to 5)
  const [qualityOfWork, setQualityOfWork] = useState<number>(5);
  // 3. Ratings (5 stars with pop-up option)
  const [starRating, setStarRating] = useState<number>(5);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [showRatingModal, setShowRatingModal] = useState<boolean>(false);

  const handleDetectLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPinCoords([pos.coords.latitude, pos.coords.longitude]);
          setLocation(`GPS Lock: ${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E`);
          setIsLocating(false);
        },
        () => {
          setLocation("Indiranagar 100ft Road (GPS Lock: 12.9784° N, 77.6408° E)");
          setIsLocating(false);
        },
        { timeout: 4000 }
      );
    } else {
      setTimeout(() => {
        setLocation("Indiranagar 100ft Road (GPS Lock: 12.9784° N, 77.6408° E)");
        setIsLocating(false);
      }, 700);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setMockPhoto(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSimulatePhoto = () => {
    const samplePhotos = [
      "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=800",
      "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800",
      "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800"
    ];
    const picked = samplePhotos[Math.floor(Math.random() * samplePhotos.length)];
    setMockPhoto(picked);
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isGuest) {
      openAuthModal("resident");
      return;
    }

    const newIssue = createSignal({
      title,
      location,
      coordinates: pinCoords,
      category,
      description: description || "Reported via resident portal with automated GPS geo-tagging.",
      isUrgent,
      photoUrl: mockPhoto || undefined,
    });

    setSubmittedCode(newIssue.code);
    setTitle("");
    setDescription("");
    setMockPhoto(null);
    setIsUrgent(false);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(`https://civion.city/ticket/${code}`);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailIssue || !newComment.trim()) return;
    addComment(detailIssue.id, newComment);
    // update local modal view
    const updated = issues.find(i => i.id === detailIssue.id);
    if (updated) {
      setDetailIssue({
        ...updated,
        comments: [
          ...(updated.comments || []),
          {
            id: `c-${Date.now()}`,
            author: currentUser?.name || (isGuest ? "Resident (Guest)" : "Community Member"),
            role: currentUser?.role ? currentUser.role.toUpperCase() : "CITIZEN",
            avatar: currentUser?.avatar || "CM",
            text: newComment,
            timestamp: "Just now"
          }
        ]
      });
    }
    setNewComment("");
  };

  // Filtered & Sorted issues
  const filteredIssues = issues.filter((iss) => {
    const matchesSearch = 
      iss.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      iss.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      iss.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      iss.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === "all" || iss.category === categoryFilter;
    if (!matchesSearch || !matchesCategory) return false;
    
    if (statusFilter === "all") return true;
    if (statusFilter === "open") return iss.status === "Submitted" || iss.status === "Triaged";
    if (statusFilter === "in_motion") return iss.status === "Crew Dispatched" || iss.status === "Work in Progress";
    if (statusFilter === "resolved") return iss.status === "Resolved & Verified" || iss.status === "Resolved (Pending Verification)";
    return true;
  }).sort((a, b) => {
    if (sortBy === "priority") return (b.priorityScore || 0) - (a.priorityScore || 0);
    if (sortBy === "upvotes") return (b.upvotes || 0) - (a.upvotes || 0);
    if (sortBy === "sla") return (a.slaDeadlineHours || 24) - (b.slaDeadlineHours || 24);
    if (sortBy === "newest") {
      const numA = parseInt(a.code.replace(/\D/g, "")) || 0;
      const numB = parseInt(b.code.replace(/\D/g, "")) || 0;
      return numB - numA;
    }
    return 0;
  });

  const pendingVerificationIssues = issues.filter(
    (i) => i.status === "Resolved (Pending Verification)"
  );

  return (
    <div className="space-y-8 pb-16">
      
      {/* Subnav Navigation tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("report")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === "report"
                ? "bg-coral-500 text-white shadow-md shadow-coral-500/20"
                : isLight ? "bg-white text-slate-700 hover:bg-slate-100" : "bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            Report Signal
          </button>
          
          <button
            onClick={() => setActiveTab("ledger")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === "ledger"
                ? "bg-coral-500 text-white shadow-md shadow-coral-500/20"
                : isLight ? "bg-white text-slate-700 hover:bg-slate-100" : "bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            <span>Community Ledger</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20">{issues.length}</span>
          </button>

          <button
            onClick={() => setActiveTab("map")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === "map"
                ? "bg-coral-500 text-white shadow-md shadow-coral-500/20"
                : isLight ? "bg-white text-slate-700 hover:bg-slate-100" : "bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Civic Incident Radar</span>
          </button>

          <button
            onClick={() => setActiveTab("verify")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === "verify"
                ? "bg-coral-500 text-white shadow-md shadow-coral-500/20"
                : isLight ? "bg-white text-slate-700 hover:bg-slate-100" : "bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            <span>Citizen Sign-Off</span>
            {pendingVerificationIssues.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amberGold-400 text-slate-950 font-bold animate-pulse">
                {pendingVerificationIssues.length} ACTION
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("dedup")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === "dedup"
                ? "bg-coral-500 text-white shadow-md shadow-coral-500/20"
                : isLight ? "bg-white text-slate-700 hover:bg-slate-100" : "bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Deduplication</span>
          </button>
        </div>

        <div className="flex items-center gap-3 relative">
          {/* Civic Karma & Trust Tier Badge */}
          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-mono ${
            isLight ? "bg-amber-50 border-amber-300 text-amber-900" : "bg-amber-500/10 border-amber-500/30 text-amber-300"
          }`}>
            <Award className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div>
              <span className="font-bold">{currentUser?.trustTier || "Gold Inspector"}</span>
              <span className="opacity-60 mx-1">·</span>
              <span className="font-semibold text-emerald-400">{currentUser?.civicKarma || 240} Karma</span>
            </div>
          </div>

          {/* Citizen Live Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-xl border relative transition-all ${
                showNotifications
                  ? "bg-coral-500 text-white border-coral-400 shadow-md"
                  : isLight 
                    ? "bg-white border-slate-300 text-slate-700 hover:bg-slate-100" 
                    : "bg-white/5 border-white/10 text-slate-300 hover:text-white"
              }`}
              title="Citizen Resolution Notifications"
            >
              <Bell className="w-4 h-4" />
              {citizenNotifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {citizenNotifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

            {/* Notification Dropdown Drawer */}
            {showNotifications && (
              <div className={`absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border shadow-2xl p-4 z-50 space-y-3 animate-fade-in ${
                isLight ? "bg-white border-slate-300 text-slate-900" : "bg-[#141b1f] border-white/15 text-white"
              }`}>
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs font-mono text-coral-400">
                    <Bell className="w-3.5 h-3.5" />
                    <span>Citizen Updates ({citizenNotifications.length})</span>
                  </div>
                  <button
                    onClick={() => clearAllNotifications()}
                    className="text-[10px] font-mono text-slate-400 hover:text-white underline"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {citizenNotifications.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400 font-mono">
                      No notifications right now.
                    </div>
                  ) : (
                    citizenNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          markNotificationRead(notif.id);
                          const matched = issues.find(i => i.id === notif.issueId || i.code === notif.issueCode);
                          if (matched) {
                            if (matched.status === "Resolved (Pending Verification)") {
                              setActiveTab("verify");
                            } else {
                              setDetailIssue(matched);
                            }
                          }
                          setShowNotifications(false);
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-mono cursor-pointer transition-colors space-y-1 ${
                          !notif.read
                            ? isLight ? "bg-amber-50/80 border-amber-300" : "bg-coral-500/10 border-coral-500/30"
                            : isLight ? "bg-slate-50 border-slate-200 opacity-80" : "bg-black/30 border-white/5 opacity-70"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-coral-400">#{notif.issueCode}</span>
                          <span className="text-slate-400">{notif.timestamp}</span>
                        </div>
                        <div className="font-bold text-xs leading-snug">{notif.title}</div>
                        <p className="text-[11px] opacity-80 line-clamp-2">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global Toast Banner for Verification / Karma */}
      {verificationSuccessToast && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs flex items-center justify-between animate-fade-in shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{verificationSuccessToast}</span>
          </div>
          <button
            onClick={() => setVerificationSuccessToast(null)}
            className="text-emerald-400 hover:text-emerald-200 text-xs px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: SIGNAL REPORTER (Referencing prototype layout) */}
      {activeTab === "report" && (
        <div className="space-y-12">
          {/* Main Hero & Split Form */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Hero copy */}
            <div className="lg:col-span-6 space-y-6 pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border bg-coral-500/10 border-coral-500/30 text-coral-400">
                <span className="w-2 h-2 rounded-full bg-coral-500" />
                <span>ONE CITY, IN VIEW</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08]">
                Good streets <br />
                <span className="text-coral-500">start with a</span> <br />
                good signal.
              </h1>

              <p className={`text-base sm:text-lg leading-relaxed max-w-lg ${
                isLight ? "text-slate-600" : "text-slate-300"
              }`}>
                See something that needs care? Tell your city team. Civion turns a quick report into a visible promise to act.
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-mono text-emerald-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>No account required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>A few minutes</span>
                </div>
              </div>

              {/* 3 Steps indicator */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-white/10">
                <div className="space-y-1">
                  <div className="text-[11px] font-mono text-coral-500 font-bold">01</div>
                  <div className="text-sm font-semibold">You flag it</div>
                  <div className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    Share the what, where, and why. No paper forms.
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] font-mono text-emerald-400 font-bold">02</div>
                  <div className="text-sm font-semibold">A team picks it up</div>
                  <div className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    Right crew sees priority score and SLA countdown.
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] font-mono text-amberGold-400 font-bold">03</div>
                  <div className="text-sm font-semibold">You verify fix</div>
                  <div className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    Inspect photo proof and confirm resolution.
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Report Form Card */}
            <div className="lg:col-span-6">
              <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl ${
                isLight ? "bg-white border-slate-200" : "glass-card"
              }`}>
                
                {submittedCode ? (
                  <div className="text-center py-10 space-y-4 animate-fade-in">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 stroke-[2.5]" />
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs font-mono uppercase text-coral-500 font-bold">SIGNAL COMMITTED TO LEDGER</div>
                      <h3 className="text-2xl font-bold">Thank you, {currentUser?.name || "Neighbor"}</h3>
                      <p className={`text-sm max-w-sm mx-auto ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                        Your signal is published to the public ledger under ticket:
                      </p>
                      <div className="inline-block my-3 px-4 py-2 rounded-xl bg-coral-500/10 border border-coral-500/30 font-mono text-xl font-bold text-coral-400">
                        #{submittedCode}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
                      <button
                        onClick={() => {
                          setSubmittedCode(null);
                          setActiveTab("ledger");
                        }}
                        className="px-5 py-2.5 rounded-xl bg-coral-500 text-white text-xs font-semibold shadow-md"
                      >
                        Track in Community Ledger →
                      </button>
                      <button
                        onClick={() => setSubmittedCode(null)}
                        className={`px-5 py-2.5 rounded-xl text-xs font-semibold border ${
                          isLight ? "bg-slate-100 border-slate-300" : "bg-white/5 border-white/10"
                        }`}
                      >
                        Report another issue
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReport} className="space-y-5">
                    <div>
                      <div className="text-[11px] font-mono tracking-widest text-coral-500 uppercase font-bold">
                        NEW CIVIC SIGNAL
                      </div>
                      <h2 className="text-2xl font-bold mt-0.5">Report an issue</h2>
                    </div>

                    {/* Title */}
                    <div className="space-y-1.5">
                      <label className={`block text-xs font-medium ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                        What needs attention?
                      </label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Crosswalk signal is out / Pothole under metro"
                        className={`w-full px-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-coral-500 ${
                          isLight ? "bg-slate-50 border-slate-300 text-slate-900" : "bg-[#0d1117] border-white/10 text-white"
                        }`}
                      />
                    </div>

                    {/* Location input */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className={`block text-xs font-medium ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                          Where is it?
                        </label>
                        <button
                          type="button"
                          onClick={handleDetectLocation}
                          disabled={isLocating}
                          className="text-[11px] font-mono text-coral-400 hover:text-coral-300 flex items-center gap-1"
                        >
                          <MapPin className="w-3 h-3" />
                          <span>{isLocating ? "Detecting GPS..." : "Detect my GPS"}</span>
                        </button>
                      </div>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          required
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="Street address or nearby landmark"
                          className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-coral-500 ${
                            isLight ? "bg-slate-50 border-slate-300 text-slate-900" : "bg-[#0d1117] border-white/10 text-white"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Interactive Exact Location Map Picker */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <label className={`block text-xs font-medium ${isLight ? "text-slate-700" : "text-slate-300"} flex items-center gap-1.5`}>
                          <Navigation className="w-3.5 h-3.5 text-coral-500" />
                          <span>Exact Map Pinpoint & Deduplication Radar</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowMap(!showMap)}
                          className="text-[11px] font-mono text-coral-400 hover:text-coral-300"
                        >
                          {showMap ? "Hide Map" : "Open Pinpoint Map"}
                        </button>
                      </div>

                      {showMap && (
                        <InteractiveMapPicker
                          initialLat={pinCoords[0]}
                          initialLng={pinCoords[1]}
                          height="230px"
                          onLocationSelect={(lat, lng, addr) => {
                            setPinCoords([lat, lng]);
                            setLocation(addr);
                          }}
                        />
                      )}
                    </div>

                    {/* Category & Name Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className={`block text-xs font-medium ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                          Category
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value as CivicIssue["category"])}
                          className={`w-full px-3 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-coral-500 ${
                            isLight ? "bg-slate-50 border-slate-300 text-slate-900" : "bg-[#0d1117] border-white/10 text-white"
                          }`}
                        >
                          <option value="Pothole">Pothole</option>
                          <option value="Water leakage">Water leakage</option>
                          <option value="Streetlight">Streetlight</option>
                          <option value="Waste">Waste / Dumping</option>
                          <option value="Drainage">Drainage / Overflow</option>
                          <option value="Road safety">Road safety</option>
                          <option value="Accessibility">Accessibility</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className={`block text-xs font-medium ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                            Your name
                          </label>
                          <span className="text-[10px] text-slate-500">Optional</span>
                        </div>
                        <input
                          type="text"
                          readOnly
                          value={currentUser?.name || "Ramesh Kumar"}
                          className={`w-full px-3 py-3 rounded-xl text-sm border opacity-80 ${
                            isLight ? "bg-slate-100 border-slate-300 text-slate-900" : "bg-[#161b22] border-white/10 text-slate-300"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className={`block text-xs font-medium ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                          A little more detail
                        </label>
                        <span className="text-[10px] text-slate-500">Optional</span>
                      </div>
                      <textarea
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What did you notice? Include helpful landmark context."
                        className={`w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-coral-500 ${
                          isLight ? "bg-slate-50 border-slate-300 text-slate-900" : "bg-[#0d1117] border-white/10 text-white"
                        }`}
                      />
                    </div>

                    {/* AI Deduplication 1-Click Test Presets */}
                    <div className="space-y-1.5 p-3 rounded-2xl bg-black/30 border border-white/5">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="flex items-center gap-1.5 text-coral-400 font-bold uppercase">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Test AI Deduplication (1-Click Presets):</span>
                        </span>
                        <span className="text-[10px] text-slate-500">Radius ≤ 100m</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setTitle("Dangerous road crater under metro pillar 42");
                            setDescription("Massive deep pothole right under Indiranagar metro pillar 42. Scooter almost skidded!");
                            setCategory("Pothole");
                            setLocation("100 Feet Road, Indiranagar Metro");
                            setPinCoords([12.9785, 77.6409]);
                            setIsUrgent(true);
                            setMockPhoto("/images/issues/pothole.jpg");
                          }}
                          className="px-3 py-2 rounded-xl text-xs font-mono bg-coral-500/15 border border-coral-500/30 text-coral-300 hover:bg-coral-500/25 transition-all text-left"
                        >
                          <div className="font-bold">⚡ Duplicate Pothole</div>
                          <div className="text-[10px] text-slate-400">Indiranagar Metro (15m away)</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setTitle("Open missing drain slab on pedestrian walkway");
                            setDescription("Stormwater drain concrete cover broken into canal near bus shelter.");
                            setCategory("Drainage");
                            setLocation("8th Cross, Jeevan Bima Nagar");
                            setPinCoords([12.9655, 77.6583]);
                            setIsUrgent(true);
                            setMockPhoto("/images/issues/drain-cover.jpg");
                          }}
                          className="px-3 py-2 rounded-xl text-xs font-mono bg-blue-500/15 border border-blue-500/30 text-blue-300 hover:bg-blue-500/25 transition-all text-left"
                        >
                          <div className="font-bold">⚡ Duplicate Drain</div>
                          <div className="text-[10px] text-slate-400">Jeevan Bima Nagar (20m away)</div>
                        </button>
                      </div>
                    </div>

                    {/* Photo upload: Real File + Demo preset & Urgent Toggle */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3.5 rounded-2xl border bg-black/20 border-white/5">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                          type="file"
                          id="resident-file-upload"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                        <label
                          htmlFor="resident-file-upload"
                          className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                            mockPhoto
                              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                              : isLight
                                ? "bg-white border-slate-300 text-slate-800 hover:bg-slate-50"
                                : "bg-white/10 border-white/20 text-white hover:bg-white/15"
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5 text-coral-400" />
                          <span>{mockPhoto ? "Photo Attached ✓" : "Upload Photo"}</span>
                        </label>

                        <button
                          type="button"
                          onClick={handleSimulatePhoto}
                          className={`px-3 py-2 rounded-xl text-xs font-mono border transition-colors ${
                            isLight
                              ? "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
                              : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                          }`}
                          title="Use realistic road hazard sample"
                        >
                          Sample
                        </button>
                      </div>

                      {/* Priority toggle */}
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs select-none">
                        <input
                          type="checkbox"
                          checked={isUrgent}
                          onChange={(e) => setIsUrgent(e.target.checked)}
                          className="w-4 h-4 rounded text-coral-500 focus:ring-coral-500 border-white/20"
                        />
                        <span className={`font-medium ${isUrgent ? "text-rose-400 font-bold" : "text-slate-400"}`}>
                          Urgent Safety Hazard
                        </span>
                      </label>
                    </div>

                    {/* Photo preview if loaded */}
                    {mockPhoto && (
                      <div className="relative rounded-xl overflow-hidden h-28 border border-white/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={mockPhoto} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setMockPhoto(null)}
                          className="absolute top-2 right-2 bg-black/70 hover:bg-black p-1 rounded-full text-white text-xs"
                        >
                          ✕
                        </button>
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-emerald-400">
                          AI: Road hazard classified
                        </div>
                      </div>
                    )}

                    {/* AI Deduplication Engine Info Pill */}
                    <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-[11px] font-mono ${
                      isLight ? "bg-slate-100 border-slate-200 text-slate-700" : "bg-black/25 border-white/10 text-slate-300"
                    }`}>
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-coral-400 animate-pulse flex-shrink-0" />
                        <span>AI Spatial Deduplication: Radius ≤ 100m</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-semibold">Cosine Sim ≥ 0.85</span>
                    </div>

                    {/* Primary Submit CTA */}
                    <button
                      type="submit"
                      className="w-full py-4 px-6 rounded-xl font-semibold text-white bg-coral-500 hover:bg-coral-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-coral-500/25 active:scale-[0.99] text-base"
                    >
                      <span>Send report</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <p className={`text-center text-[11px] ${isLight ? "text-slate-500" : "text-slate-500"}`}>
                      Your report helps the people who keep this place moving.
                    </p>
                  </form>
                )}

              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: COMMUNITY LEDGER & LIVE FEED */}
      {activeTab === "ledger" && (
        <div className="space-y-6">
          {/* Header & Search Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Shared Civic Promise Ledger
              </h2>
              <p className={`text-xs sm:text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                Real-time tracking of civic signals across North District.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-2">
              {[
                { id: "all", label: "All Signals" },
                { id: "open", label: "Open" },
                { id: "in_motion", label: "In Motion" },
                { id: "resolved", label: "Resolved" }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                    statusFilter === f.id
                      ? "bg-coral-500 text-white font-semibold"
                      : isLight ? "bg-white text-slate-600 hover:bg-slate-100" : "bg-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box & Category Filters */}
          <div className="space-y-3">
            <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
              isLight ? "bg-white border-slate-200" : "bg-[#12181b] border-white/10"
            }`}>
              <Search className="w-5 h-5 text-coral-500 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ticket reference (CIV-1048), landmark, category, or keyword..."
                className={`w-full bg-transparent text-sm focus:outline-none ${
                  isLight ? "text-slate-900 placeholder:text-slate-400" : "text-white placeholder:text-slate-500"
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-slate-400 hover:text-white px-2 flex-shrink-0"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Pills & Sorting Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-1.5">
                {["all", "Pothole", "Water leakage", "Streetlight", "Waste", "Drainage", "Road safety", "Accessibility"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-mono transition-all ${
                      categoryFilter === cat
                        ? "bg-coral-500 text-white font-semibold shadow-sm"
                        : isLight ? "bg-slate-200/70 text-slate-700 hover:bg-slate-300" : "bg-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    {cat === "all" ? "All Categories" : cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-mono focus:outline-none ${
                    isLight ? "bg-white border-slate-300 text-slate-900" : "bg-[#161d21] border-white/10 text-white"
                  }`}
                >
                  <option value="priority">Priority Score (Highest)</option>
                  <option value="upvotes">Most Upvoted</option>
                  <option value="newest">Newest Reports</option>
                  <option value="sla">Urgent SLA</option>
                </select>
              </div>
            </div>
          </div>

          {/* Ledger Cards Feed */}
          <div className="space-y-4">
            {filteredIssues.map((issue) => {
              const isResolved = issue.status === "Resolved & Verified" || issue.status === "Resolved (Pending Verification)";
              const isAssigned = !!issue.assignedWorker;

              return (
                <div
                  key={issue.id}
                  className={`p-5 sm:p-6 rounded-2xl border transition-all ${
                    isLight 
                      ? "bg-white border-slate-200 hover:border-slate-300 shadow-sm" 
                      : "glass-card hover:border-white/20"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-coral-500">
                        #{issue.code}
                      </span>
                      <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border ${
                        issue.severity === "critical"
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                          : issue.severity === "high"
                            ? "bg-amberGold-400/10 border-amberGold-400/30 text-amberGold-400"
                            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      }`}>
                        {issue.category} · Priority {issue.priorityScore}
                      </span>
                      {issue.upvotes > 1 && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Aggregated ({issue.upvotes} Reports)</span>
                        </span>
                      )}
                    </div>

                    {/* Status badge */}
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono font-medium px-3 py-1 rounded-full border ${
                        issue.status === "Resolved & Verified"
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                          : issue.status === "Resolved (Pending Verification)"
                            ? "bg-amberGold-500/15 border-amberGold-500/40 text-amberGold-400"
                            : issue.status === "Work in Progress"
                              ? "bg-blue-500/15 border-blue-500/40 text-blue-400"
                              : "bg-coral-500/10 border-coral-500/30 text-coral-400"
                      }`}>
                        {issue.status}
                      </span>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="py-4 space-y-3">
                    <h3 
                      onClick={() => setDetailIssue(issue)}
                      className="text-base sm:text-lg font-bold cursor-pointer hover:text-coral-400 transition-colors"
                    >
                      {issue.title}
                    </h3>
                    <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                      {issue.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono opacity-75 pt-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-coral-500" />
                        <span>{issue.location}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setLedgerMapIssue(ledgerMapIssue?.id === issue.id ? null : issue)}
                        className="text-[11px] font-mono text-coral-400 hover:text-coral-300 underline flex items-center gap-1"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>{ledgerMapIssue?.id === issue.id ? "Close Map" : "View Exact Map"}</span>
                      </button>
                      <div>·</div>
                      <div>Reported: {issue.reportedAt}</div>
                      {issue.assignedWorker && (
                        <>
                          <div>·</div>
                          <div className="text-emerald-400">Crew: {issue.assignedWorker}</div>
                        </>
                      )}
                    </div>

                    {/* Inline Map View if toggled */}
                    {ledgerMapIssue?.id === issue.id && (
                      <div className="pt-2 animate-fade-in">
                        <InteractiveMapPicker
                          initialLat={issue.coordinates[0]}
                          initialLng={issue.coordinates[1]}
                          readOnly
                          height="200px"
                          onLocationSelect={() => {}}
                        />
                      </div>
                    )}
                  </div>

                  {/* Progressive Civic Promise Timeline */}
                  <div className={`p-3.5 rounded-xl border my-2 ${
                    isLight ? "bg-slate-50 border-slate-200" : "bg-black/30 border-white/5"
                  }`}>
                    <div className="text-[10px] font-mono uppercase text-slate-500 mb-2 font-semibold">
                      LIFECYCLE TRAJECTORY:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono">
                      {[
                        { step: "Submitted", active: true },
                        { step: "Triaged", active: issue.status !== "Submitted" },
                        { step: "Crew Dispatched", active: isAssigned },
                        { step: "In Progress", active: issue.status === "Work in Progress" || isResolved },
                        { step: "Resolved & Verified", active: issue.status === "Resolved & Verified" }
                      ].map((s, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded-lg border text-center transition-all ${
                            s.active
                              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-semibold"
                              : "opacity-40 border-white/5 text-slate-500"
                          }`}
                        >
                          {s.step}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Bar: Affected Me Too / Verification action / Deep dive */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      {/* Upvote Button */}
                      <button
                        onClick={() => {
                          if (isGuest) {
                            openAuthModal("resident");
                            return;
                          }
                          upvoteIssue(issue.id);
                        }}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                          issue.hasUpvoted
                            ? "bg-coral-500 text-white shadow-sm shadow-coral-500/30"
                            : isLight
                              ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                              : "bg-white/5 hover:bg-white/10 text-slate-300"
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Affected Me Too ({issue.upvotes})</span>
                      </button>

                      {/* Full Audit & Discussion Modal Button */}
                      <button
                        type="button"
                        onClick={() => setDetailIssue(issue)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium border border-coral-500/30 bg-coral-500/10 hover:bg-coral-500/20 text-coral-400 transition-all"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Full Audit & Discussion ({issue.comments?.length || 0})</span>
                      </button>

                      {/* Copy Reference */}
                      <button
                        type="button"
                        onClick={() => handleCopyCode(issue.code)}
                        className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-colors"
                        title="Copy ticket reference URL"
                      >
                        {copiedCode === issue.code ? (
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* If awaiting verification */}
                    {issue.status === "Resolved (Pending Verification)" && (
                      <button
                        onClick={() => {
                          if (isGuest) {
                            openAuthModal("resident");
                            return;
                          }
                          setVerifyingIssue(issue);
                          setVerificationFeedback("");
                        }}
                        className="px-4 py-1.5 rounded-xl bg-amberGold-400 hover:bg-amberGold-500 text-slate-950 text-xs font-bold font-mono shadow-md flex items-center gap-1.5 animate-pulse"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Confirm Fix Resolution →</span>
                      </button>
                    )}

                    {issue.residentVerification?.verified && (
                      <div className="flex items-center gap-1 text-xs font-mono text-emerald-400">
                        <Check className="w-4 h-4" />
                        <span>Citizen Verified ✓</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: FULL-SCREEN CIVIC INCIDENT RADAR (Map View) */}
      {activeTab === "map" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-coral-500 uppercase tracking-wider">
                  LIVE SPATIAL TELEMETRY
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight mt-1">
                North District Civic Incident Radar
              </h2>
              <p className={`text-xs sm:text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                Real-time OpenStreetMap geographic telemetry showing all community signals, active field repairs, and verified resolutions.
              </p>
            </div>

            {/* Radar Quick Stats */}
            <div className="flex items-center gap-3">
              <div className={`px-3.5 py-2 rounded-2xl border text-center font-mono ${
                isLight ? "bg-white border-slate-200" : "bg-black/40 border-white/10"
              }`}>
                <div className="text-[10px] text-slate-400 uppercase">Signals</div>
                <div className="text-base font-bold text-white">{issues.length}</div>
              </div>
              <div className={`px-3.5 py-2 rounded-2xl border text-center font-mono ${
                isLight ? "bg-white border-slate-200" : "bg-black/40 border-white/10"
              }`}>
                <div className="text-[10px] text-rose-400 uppercase">Critical</div>
                <div className="text-base font-bold text-rose-400">
                  {issues.filter(i => i.severity === "critical").length}
                </div>
              </div>
              <div className={`px-3.5 py-2 rounded-2xl border text-center font-mono ${
                isLight ? "bg-white border-slate-200" : "bg-black/40 border-white/10"
              }`}>
                <div className="text-[10px] text-emerald-400 uppercase">Resolved</div>
                <div className="text-base font-bold text-emerald-400">
                  {issues.filter(i => i.status.includes("Resolved")).length}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Full-Height Radar Map */}
          <div className="space-y-4">
            <InteractiveMapPicker
              initialLat={pinCoords[0]}
              initialLng={pinCoords[1]}
              onLocationSelect={(lat, lng, addr) => {
                setPinCoords([lat, lng]);
                setLocation(addr);
              }}
              showNearbyIssues={true}
              height="540px"
              readOnly={false}
            />

            {/* Explanatory cards underneath the map */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className={`p-4 rounded-2xl border space-y-1.5 ${
                isLight ? "bg-white border-slate-200" : "bg-[#12181b] border-white/10"
              }`}>
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-coral-500 uppercase">
                  <Crosshair className="w-4 h-4" />
                  <span>Real-time GPS Pinpoint</span>
                </div>
                <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                  Click anywhere on the map or click <strong>&quot;Detect GPS&quot;</strong> to lock onto your exact live coordinates and see nearby civic issues.
                </p>
              </div>

              <div className={`p-4 rounded-2xl border space-y-1.5 ${
                isLight ? "bg-white border-slate-200" : "bg-[#12181b] border-white/10"
              }`}>
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-500 uppercase">
                  <Layers className="w-4 h-4" />
                  <span>Vector & Satellite Layers</span>
                </div>
                <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                  Use the top-left layer toggle to alternate between high-contrast industrial dark mode streets and high-resolution satellite imagery.
                </p>
              </div>

              <div className={`p-4 rounded-2xl border space-y-1.5 ${
                isLight ? "bg-white border-slate-200" : "bg-[#12181b] border-white/10"
              }`}>
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase">
                  <ShieldCheck className="w-4 h-4" />
                  <span>No API Key Required</span>
                </div>
                <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                  Powered by OpenStreetMap and Leaflet.js with zero rate limits, no third-party account requirements, and 100% uptime reliability.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RESIDENT VERIFICATION (Sign-off queue) */}
      {activeTab === "verify" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Citizen Verification & Sign-Off</h2>
            <p className={`text-xs sm:text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              Civion ensures field repairs are not closed until residents confirm the quality of the fix.
            </p>
          </div>

          {pendingVerificationIssues.length === 0 ? (
            <div className={`p-12 text-center rounded-3xl border ${
              isLight ? "bg-white border-slate-200" : "bg-[#12181b] border-white/10"
            }`}>
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold">All finished jobs verified!</h3>
              <p className={`text-xs sm:text-sm mt-1 max-w-sm mx-auto ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                There are no open repairs awaiting resident confirmation right now.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingVerificationIssues.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-6 rounded-2xl border space-y-4 ${
                    isLight ? "bg-white border-slate-200" : "glass-card"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-coral-500">
                      #{issue.code}
                    </span>
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amberGold-400/20 text-amberGold-400 border border-amberGold-400/30">
                      Awaiting Your Sign-Off
                    </span>
                  </div>

                  <h3 className="text-lg font-bold">{issue.title}</h3>
                  <p className={`text-xs leading-relaxed ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                    {issue.description}
                  </p>

                  {/* Photo Before / After if available */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {issue.beforePhoto && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-slate-400">BEFORE:</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={issue.beforePhoto} alt="Before" className="h-28 w-full object-cover rounded-xl border border-white/10" />
                      </div>
                    )}
                    {issue.afterPhoto && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-emerald-400 font-semibold">AFTER REPAIR:</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={issue.afterPhoto} alt="After" className="h-28 w-full object-cover rounded-xl border border-emerald-500/40" />
                      </div>
                    )}
                  </div>

                  {/* Crew field note */}
                  {issue.fieldNotes.length > 0 && (
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs font-mono space-y-1">
                      <div className="text-[10px] text-emerald-400">LATEST FIELD NOTE:</div>
                      <div className="opacity-90">{issue.fieldNotes[issue.fieldNotes.length - 1].text}</div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        setVerifyingIssue(issue);
                        setIsActuallyResolved(true);
                        setQualityOfWork(5);
                        setStarRating(5);
                        setHoveredStar(null);
                        setVerificationFeedback("");
                      }}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-coral-500 hover:bg-coral-600 text-white text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                    >
                      <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
                      <span>Review & Rate Fix (3 Steps)</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AI DEDUPLICATION & AGGREGATION AGENT */}
      {activeTab === "dedup" && (
        <div className="space-y-8 animate-fade-in">
          {/* Header & Geofence Banner */}
          <div className={`p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isLight ? "bg-white border-slate-200" : "glass-card border-white/10"
          }`}>
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-coral-500/20 border border-coral-500/40 text-coral-400 flex items-center justify-center text-xl font-bold">
                ⚡
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-coral-500 uppercase tracking-wider">
                    AI AGENT CORE · MUNICIPAL DEDUPLICATION
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                    ONLINE
                  </span>
                </div>
                <h2 className="text-xl font-bold mt-0.5">Spatial & Semantic Report Aggregator</h2>
                <div className="text-xs font-mono text-slate-400">PostGIS ST_DWithin (≤ 100m) · 1536-dim Embedding · Cosine Sim (≥ 0.80)</div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-slate-300 space-y-0.5">
                <div className="text-[10px] text-slate-500 uppercase">CLUSTER RADIUS:</div>
                <div className="font-bold text-emerald-400">100 meters</div>
              </div>
              <div className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-slate-300 space-y-0.5">
                <div className="text-[10px] text-slate-500 uppercase">COSINE THRESHOLD:</div>
                <div className="font-bold text-coral-400">0.80 Match</div>
              </div>
            </div>
          </div>

          {/* 4-Stage Architecture Pipeline Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-5 rounded-2xl border space-y-2 ${isLight ? "bg-white border-slate-200" : "bg-[#141b1f] border-white/10"}`}>
              <div className="text-xs font-mono text-coral-500 font-bold uppercase">STAGE 1: SPATIAL PRE-FILTER</div>
              <h3 className="font-bold text-sm">PostGIS ST_DWithin</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                Filters candidate open issues within 100m geofence radius in sub-millisecond query time.
              </p>
            </div>

            <div className={`p-5 rounded-2xl border space-y-2 ${isLight ? "bg-white border-slate-200" : "bg-[#141b1f] border-white/10"}`}>
              <div className="text-xs font-mono text-amber-500 font-bold uppercase">STAGE 2: VECTOR EMBEDDING</div>
              <h3 className="font-bold text-sm">1536-dim Embedding</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                text-embedding-3-small generates dense normalized vector representations of report text.
              </p>
            </div>

            <div className={`p-5 rounded-2xl border space-y-2 ${isLight ? "bg-white border-slate-200" : "bg-[#141b1f] border-white/10"}`}>
              <div className="text-xs font-mono text-blue-400 font-bold uppercase">STAGE 3: COSINE SIMILARITY</div>
              <h3 className="font-bold text-sm">pgvector Vector Ops</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                Computes cosine similarity between incoming report and spatial candidates.
              </p>
            </div>

            <div className={`p-5 rounded-2xl border space-y-2 ${isLight ? "bg-white border-slate-200" : "bg-[#141b1f] border-white/10"}`}>
              <div className="text-xs font-mono text-emerald-400 font-bold uppercase">STAGE 4: MERGE / CREATE</div>
              <h3 className="font-bold text-sm">AI Re-Summarization</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                Merges duplicate, increments votes, and prompts LLM to synthesize master issue dossier.
              </p>
            </div>
          </div>

          {/* Aggregated Master Issues in North District */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Active Master Issues with Clustered Reports</h3>
                <p className="text-xs text-slate-400 font-mono">Real-time civic signals clustered into authoritative master tickets.</p>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                {issues.filter(i => i.upvotes > 1).length} Aggregated Master Tickets
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {issues.map(issue => (
                <div
                  key={issue.id}
                  onClick={() => setDetailIssue(issue)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer hover:border-coral-500/50 ${
                    isLight ? "bg-white border-slate-200 shadow-sm" : "glass-card border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-coral-500">#{issue.code}</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">
                        {issue.upvotes} CITIZEN SIGNALS
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white/10 text-slate-300 text-[10px]">
                        PRIORITY {issue.priorityScore}
                      </span>
                    </div>
                  </div>

                  <h4 className="font-bold text-base text-white mt-2">{issue.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">{issue.description}</p>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1 text-coral-400">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{issue.location}</span>
                    </span>
                    <span className="text-emerald-400">Deduplicated ✓</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Issue Detail Modal (Audit Trail + Community Discussion + Mapbox) */}
      {detailIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className={`w-full max-w-3xl my-8 rounded-3xl p-5 sm:p-8 border shadow-2xl space-y-6 ${
            isLight ? "bg-[#faf9f6] border-slate-300 text-slate-900" : "bg-[#12181b] border-white/10 text-white"
          }`}>
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className="text-coral-500 font-bold text-sm">#{detailIssue.code}</span>
                  <span className="px-2.5 py-0.5 rounded-full border bg-coral-500/10 border-coral-500/30 text-coral-400">
                    {detailIssue.category}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full border text-[11px] ${
                    detailIssue.status === "Resolved & Verified"
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-semibold"
                      : "bg-amberGold-400/15 border-amberGold-400/40 text-amberGold-400"
                  }`}>
                    {detailIssue.status}
                  </span>
                  <span className="text-slate-400">· {detailIssue.ward}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mt-1.5 tracking-tight">{detailIssue.title}</h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-coral-500 flex-shrink-0" />
                  <span>{detailIssue.location}</span>
                </div>
              </div>

              <button
                onClick={() => setDetailIssue(null)}
                className="p-1.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Citizen Feedback & Quality Audit Card (if verified or evaluated) */}
            {detailIssue.residentVerification && (
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono animate-fade-in">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>CITIZEN FEEDBACK & AUDIT SEAL</span>
                  </div>
                  <div className="text-slate-300 text-[11px] flex items-center gap-2 flex-wrap">
                    <span>Problem Actually Resolved: <strong className={detailIssue.residentVerification.isActuallyResolved ? "text-emerald-300" : "text-rose-300"}>{detailIssue.residentVerification.isActuallyResolved ? "Yes ✓" : "No ✗"}</strong></span>
                    <span>·</span>
                    <span>Quality of Work: <strong className="text-amber-300">{detailIssue.residentVerification.qualityOfWork ?? 5}/5</strong></span>
                    <span>·</span>
                    <span>Rating: <strong className="text-amber-300">{detailIssue.residentVerification.starRating ?? 5} ★</strong></span>
                  </div>
                  {detailIssue.residentVerification.feedback && (
                    <div className="text-slate-400 italic text-[11px] mt-0.5">
                      &quot;{detailIssue.residentVerification.feedback}&quot;
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-sm bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 rounded-xl w-fit">
                  <span>{detailIssue.residentVerification.starRating ?? 5}</span>
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                </div>
              </div>
            )}

            {/* AI Deduplication Cluster Box */}
            {((detailIssue.reportCount && detailIssue.reportCount > 1) || detailIssue.upvotes > 1 || (detailIssue.combinedReports && detailIssue.combinedReports.length > 1)) && (
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/35 space-y-3 font-mono text-xs animate-fade-in">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI AGGREGATED MASTER DOSSIER ({detailIssue.reportCount || detailIssue.combinedReports?.length || detailIssue.upvotes} CITIZEN REPORTS UNIFIED)</span>
                  </span>
                  <span className="text-[10px] text-emerald-300">Geofence ≤ 100m · Cosine Sim ≥ 0.80</span>
                </div>
                <p className={`text-xs leading-relaxed ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                  Multiple citizen signals from <strong>{detailIssue.reportedBy}</strong> were automatically unified by the AI Deduplication Agent into this single authoritative ticket in the authority complaint portal, escalating municipal priority to <strong>{detailIssue.priorityScore}</strong>.
                </p>

                {detailIssue.combinedReports && detailIssue.combinedReports.length > 1 && (
                  <div className="pt-2 border-t border-emerald-500/20 space-y-1.5">
                    <div className="text-[10px] text-emerald-400 uppercase font-semibold">
                      Combined Citizen Reports ({detailIssue.combinedReports.length}):
                    </div>
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                      {detailIssue.combinedReports.map((rep, idx) => (
                        <div key={rep.id || idx} className="p-2 rounded-lg bg-black/40 border border-white/5 text-[11px] space-y-0.5">
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="font-bold text-coral-400">{rep.residentName}</span>
                            <span className="text-[10px] text-slate-500">{rep.reportedAt}</span>
                          </div>
                          <div className="text-slate-400 font-sans italic line-clamp-2">
                            &ldquo;{rep.rawText}&rdquo;
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Lifecycle Progress Bar */}
            <div className={`p-4 rounded-2xl border ${isLight ? "bg-slate-50 border-slate-200" : "bg-black/30 border-white/5"}`}>
              <div className="text-[10px] font-mono uppercase text-slate-400 mb-2 font-bold flex items-center justify-between">
                <span>CIVIC RESOLUTION LOOP</span>
                <span>SLA TARGET: {detailIssue.slaDeadlineHours}h ({detailIssue.slaDeadlineTime || "On track"})</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono">
                {[
                  { label: "1. Submitted", active: true },
                  { label: "2. Triaged", active: detailIssue.status !== "Submitted" },
                  { label: "3. Dispatched", active: !!detailIssue.assignedWorker },
                  { label: "4. In Progress", active: detailIssue.status === "Work in Progress" || detailIssue.status.includes("Resolved") },
                  { label: "5. Verified", active: detailIssue.status === "Resolved & Verified" }
                ].map((st, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded-xl text-center border transition-all ${
                      st.active
                        ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300 font-semibold"
                        : "opacity-40 border-white/5 text-slate-500"
                    }`}
                  >
                    {st.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Incident Pinpoint Map */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-coral-500" />
                  <span>Exact Geospatial Coordinate Lock</span>
                </span>
                <span>OpenStreetMap & Leaflet</span>
              </div>
              <InteractiveMapPicker
                initialLat={detailIssue.coordinates[0]}
                initialLng={detailIssue.coordinates[1]}
                readOnly
                height="180px"
                onLocationSelect={() => {}}
              />
            </div>

            {/* Photo Evidence Side-by-Side (Before & After) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-slate-400">INITIAL CITIZEN REPORT PHOTO:</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={detailIssue.beforePhoto || "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80"}
                  alt="Initial Issue"
                  className="w-full h-36 object-cover rounded-xl border border-white/10"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                  FIELD CREW REPAIR EVIDENCE:
                </span>
                {detailIssue.afterPhoto ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={detailIssue.afterPhoto}
                    alt="Repaired Evidence"
                    className="w-full h-36 object-cover rounded-xl border border-emerald-500/40"
                  />
                ) : (
                  <div className="w-full h-36 rounded-xl border border-dashed border-white/15 flex flex-col items-center justify-center text-xs font-mono text-slate-500 p-4 text-center">
                    <Camera className="w-6 h-6 mb-1 text-slate-600" />
                    <span>Crew on-site repairs in progress.</span>
                    <span className="text-[10px] text-slate-600">Proof photo will upload here upon completion.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Immutable Field Notes & Audit Trail */}
            <div className="space-y-2">
              <div className="text-xs font-mono uppercase font-bold text-coral-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Immutable Civic Audit Trail</span>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {detailIssue.fieldNotes.length === 0 ? (
                  <div className="text-xs font-mono text-slate-500 italic p-2">No field notes recorded yet.</div>
                ) : (
                  detailIssue.fieldNotes.map((note) => (
                    <div key={note.id} className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs font-mono space-y-1">
                      <div className="flex items-center justify-between text-slate-400 text-[10px]">
                        <span className="font-bold text-emerald-400">{note.author} ({note.role})</span>
                        <span>{note.timestamp}</span>
                      </div>
                      <p className="text-slate-200">{note.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Live Community Discussion / Sightings */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Public Community Discussion ({detailIssue.comments?.length || 0})</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Live Civic Feed</span>
              </div>

              {/* Comment Stream */}
              <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
                {!detailIssue.comments || detailIssue.comments.length === 0 ? (
                  <div className="text-xs font-mono text-slate-500 italic p-3 rounded-xl border border-white/5 bg-black/20 text-center">
                    No community comments yet. Be the first to share an update or sighting!
                  </div>
                ) : (
                  detailIssue.comments.map((comm) => (
                    <div key={comm.id} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-coral-500/20 border border-coral-500/40 text-coral-300 flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0">
                        {comm.avatar || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-200">{comm.author}</span>
                            <span className="px-1.5 py-0.2 rounded bg-white/10 text-slate-400 text-[9px]">{comm.role}</span>
                          </div>
                          <span className="text-slate-500">{comm.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">{comm.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Post Comment Input */}
              <form onSubmit={handlePostComment} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a community note, sighting, or condition update..."
                  className={`flex-1 px-4 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-coral-500 ${
                    isLight ? "bg-white border-slate-300 text-slate-900" : "bg-[#0d1117] border-white/10 text-white"
                  }`}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="px-4 py-2.5 rounded-xl bg-coral-500 hover:bg-coral-600 disabled:opacity-50 text-white text-xs font-semibold font-mono flex items-center gap-1.5 shadow-md transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </button>
              </form>
            </div>

            {/* Bottom Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (isGuest) {
                      openAuthModal("resident");
                      return;
                    }
                    upvoteIssue(detailIssue.id);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-medium border transition-all ${
                    detailIssue.hasUpvoted
                      ? "bg-coral-500 text-white border-coral-500 shadow-md shadow-coral-500/30"
                      : isLight
                        ? "bg-white border-slate-300 hover:bg-slate-100 text-slate-700"
                        : "bg-white/5 border-white/10 hover:bg-white/10 text-slate-300"
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Affected Me Too ({detailIssue.upvotes})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyCode(detailIssue.code)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono border border-white/10 hover:bg-white/10 text-slate-300 transition-colors"
                >
                  {copiedCode === detailIssue.code ? (
                    <>
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share Ticket</span>
                    </>
                  )}
                </button>

                {(detailIssue.status === "Resolved (Pending Verification)" || detailIssue.status === "Resolved & Verified") && (
                  <button
                    type="button"
                    onClick={() => {
                      setVerifyingIssue(detailIssue);
                      setIsActuallyResolved(detailIssue.residentVerification?.isActuallyResolved ?? true);
                      setQualityOfWork(detailIssue.residentVerification?.qualityOfWork ?? 5);
                      setStarRating(detailIssue.residentVerification?.starRating ?? 5);
                      setHoveredStar(null);
                      setVerificationFeedback(detailIssue.residentVerification?.feedback || "");
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 transition-colors shadow-sm cursor-pointer"
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>Rate & Verify Fix</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Work Order Slip</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CITIZEN RESOLUTION SIGN-OFF MODAL WITH WATERMARKED PROOF */}
      {verifyingIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className={`w-full max-w-3xl my-8 rounded-3xl p-6 sm:p-8 border shadow-2xl space-y-6 ${
            isLight ? "bg-[#faf9f6] border-slate-300 text-slate-900" : "bg-[#12181b] border-white/10 text-white"
          }`}>
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-coral-500 font-bold text-sm">#{verifyingIssue.code}</span>
                  <span className="px-2.5 py-0.5 rounded-full border bg-amberGold-400/20 text-amberGold-400 border-amberGold-400/30 font-semibold">
                    AWAITING CITIZEN CONFIRMATION
                  </span>
                  <span className="text-slate-400 font-mono">· {verifyingIssue.ward}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight">
                  Verify Field Repair Resolution
                </h3>
                <p className={`text-xs mt-1 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                  Review the field crew&apos;s GPS-watermarked proof and confirm if the road/hazard is fully restored.
                </p>
              </div>

              <button
                onClick={() => setVerifyingIssue(null)}
                className="p-1.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Side-by-side Before Photo vs Watermarked After Photo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Before Photo */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-rose-400 font-bold uppercase">1. BEFORE (ORIGINAL REPORT):</span>
                  <span className="text-slate-400">{verifyingIssue.reportedAt}</span>
                </div>
                <div className="relative rounded-2xl overflow-hidden h-52 border border-white/10 bg-black/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={verifyingIssue.beforePhoto || "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800"}
                    alt="Before Repair"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm px-2.5 py-1 rounded text-[10px] font-mono text-rose-300">
                    Original Citizen Sighting
                  </div>
                </div>
                <p className="text-xs text-slate-400 font-mono line-clamp-2">{verifyingIssue.description}</p>
              </div>

              {/* Watermarked After Photo */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-400 font-bold uppercase">2. AFTER (GPS-WATERMARKED PROOF):</span>
                  <span className="text-emerald-400 font-semibold">Completed</span>
                </div>
                <div className="relative rounded-2xl overflow-hidden h-52 border-2 border-emerald-500/50 bg-black/40 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={verifyingIssue.afterPhoto || "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800"}
                    alt="Repaired Evidence"
                    className="w-full h-full object-cover"
                  />
                  {/* Digital Watermark overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent flex flex-col justify-between p-3 pointer-events-none">
                    <div className="bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded border border-emerald-500/40 text-[9px] font-mono text-emerald-400 w-fit flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>BBMP DIGITAL VERIFICATION SEAL</span>
                    </div>

                    <div className="bg-black/80 backdrop-blur-sm p-2 rounded-xl border border-white/10 text-[9px] font-mono text-white/90 space-y-0.5">
                      <div className="text-emerald-400 font-bold flex items-center justify-between">
                        <span>GPS: {verifyingIssue.watermarkData?.lat?.toFixed(5) || verifyingIssue.coordinates[0].toFixed(5)}° N, {verifyingIssue.watermarkData?.lng?.toFixed(5) || verifyingIssue.coordinates[1].toFixed(5)}° E</span>
                        <span className="text-slate-400">±3.2m</span>
                      </div>
                      <div className="text-slate-300">
                        TIME: {verifyingIssue.watermarkData?.timestamp || "Verified Today"}
                      </div>
                      <div className="text-slate-300 truncate">
                        CREW: {verifyingIssue.watermarkData?.workerName || verifyingIssue.assignedWorker || "Raju K (Field Crew)"}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-emerald-400 font-mono">
                  {verifyingIssue.fieldNotes.length > 0
                    ? `Field Note: "${verifyingIssue.fieldNotes[verifyingIssue.fieldNotes.length - 1].text}"`
                    : "Official repair executed according to municipal standard."}
                </p>
              </div>
            </div>

            {/* Resident Feedback & Verification Actions (3 Criteria) */}
            <div className="space-y-4 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amberGold-400 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amberGold-400" />
                  <span>Citizen Feedback & Quality Verification</span>
                </span>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Earn +25 Karma
                </span>
              </div>

              {/* CRITERIA 1: Is your problem actually resolved? (Option like yes or no) */}
              <div className="p-4 rounded-2xl border bg-black/20 space-y-2 border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold font-mono flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amberGold-400 text-slate-950 font-bold flex items-center justify-center text-[10px]">
                      1
                    </span>
                    <span>Is your problem actually resolved?</span>
                  </label>
                  <span className={`text-[11px] font-mono font-bold ${
                    isActuallyResolved ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    {isActuallyResolved ? "Selected: Yes, Resolved" : "Selected: No, Persists"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsActuallyResolved(true)}
                    className={`py-3 px-4 rounded-xl border font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isActuallyResolved === true
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-500/40"
                        : isLight
                          ? "bg-white border-slate-300 text-slate-600 hover:bg-slate-100"
                          : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                    <span>Yes, Problem Resolved</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsActuallyResolved(false)}
                    className={`py-3 px-4 rounded-xl border font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isActuallyResolved === false
                        ? "bg-rose-500/20 border-rose-500 text-rose-300 shadow-lg shadow-rose-500/20 ring-1 ring-rose-500/40"
                        : isLight
                          ? "bg-white border-slate-300 text-slate-600 hover:bg-slate-100"
                          : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>No, Issue Persists</span>
                  </button>
                </div>
              </div>

              {/* CRITERIA 2: Quality of work? (Options from 1 to 5) */}
              <div className="p-4 rounded-2xl border bg-black/20 space-y-2.5 border-white/10">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold font-mono flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amberGold-400 text-slate-950 font-bold flex items-center justify-center text-[10px]">
                      2
                    </span>
                    <span>Quality of work?</span>
                  </label>
                  <span className="text-xs font-mono text-amberGold-400 font-bold">
                    Score: {qualityOfWork} / 5 · {
                      qualityOfWork === 5 ? "Outstanding / Flawless" :
                      qualityOfWork === 4 ? "Good / Well Done" :
                      qualityOfWork === 3 ? "Acceptable / Standard" :
                      qualityOfWork === 2 ? "Below Average" :
                      "Poor / Inadequate"
                    }
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setQualityOfWork(lvl)}
                      className={`py-2.5 rounded-xl border font-mono text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                        qualityOfWork === lvl
                          ? "bg-amberGold-500 text-slate-950 border-amberGold-400 shadow-md shadow-amberGold-500/30 scale-[1.03]"
                          : isLight
                            ? "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                            : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className="text-sm font-bold">{lvl}</span>
                      <span className="text-[9px] uppercase tracking-wider opacity-80">
                        {lvl === 1 ? "Poor" : lvl === 2 ? "Fair" : lvl === 3 ? "Good" : lvl === 4 ? "Great" : "Superb"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* CRITERIA 3: Ratings (Show pop up option showing 5 stars, resident selects based on opinion) */}
              <div className="p-4 rounded-2xl border bg-amber-500/10 border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold font-mono text-amber-300 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-bold flex items-center justify-center text-[10px]">
                      3
                    </span>
                    <span>Ratings & Opinion:</span>
                  </label>
                  
                  {/* Pop-up trigger button */}
                  <button
                    type="button"
                    onClick={() => setShowRatingModal(true)}
                    className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>Open 5-Star Pop-up &rarr;</span>
                  </button>
                </div>

                {/* Interactive Clickable 5 Stars Selector */}
                <div className="flex items-center justify-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoveredStar !== null ? hoveredStar : starRating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(null)}
                        onClick={() => {
                          setStarRating(star);
                          setQualityOfWork(star);
                        }}
                        className="p-1 hover:scale-125 transition-transform duration-150 focus:outline-none cursor-pointer"
                        title={`Give ${star} Star${star > 1 ? "s" : ""}`}
                      >
                        <Star 
                          className={`w-8 h-8 transition-colors ${
                            isFilled 
                              ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" 
                              : "text-slate-600 hover:text-slate-400"
                          }`} 
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="text-center font-mono text-xs text-amber-300 font-semibold">
                  {starRating} of 5 Stars Selected · {
                    starRating === 5 ? "⭐⭐⭐⭐⭐ Outstanding / Highest Recommendation" :
                    starRating === 4 ? "⭐⭐⭐⭐ Very Satisfied with Fix" :
                    starRating === 3 ? "⭐⭐⭐ Standard Resolution" :
                    starRating === 2 ? "⭐⭐ Sub-par Repair Quality" :
                    "⭐ Unsatisfactory Resolution"
                  }
                </div>
              </div>

              {/* Optional Comments */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-medium font-mono text-slate-300">
                  Additional Comments or Observations (Optional):
                </label>
                <textarea
                  rows={2}
                  value={verificationFeedback}
                  onChange={(e) => setVerificationFeedback(e.target.value)}
                  placeholder="e.g. Work was completed neatly. Road surface is smooth and completely safe for vehicles."
                  className={`w-full p-3 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-coral-500 ${
                    isLight ? "bg-white border-slate-300 text-slate-900" : "bg-[#0d1117] border-white/10 text-white"
                  }`}
                />
              </div>

              {/* Action Buttons: Submit All 3 Criteria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    residentVerify(verifyingIssue.id, isActuallyResolved, verificationFeedback || `Resident reviewed: ${isActuallyResolved ? "Resolved" : "Unresolved"} (Quality: ${qualityOfWork}/5, Rating: ${starRating}★)`, {
                      isActuallyResolved,
                      qualityOfWork,
                      starRating
                    });
                    setVerificationSuccessToast(
                      isActuallyResolved 
                        ? `Thank you! Resolution confirmed with ${starRating}★ rating and ${qualityOfWork}/5 quality. +25 Civic Karma added! 🌟`
                        : `Feedback logged. The ticket has been reopened for the field crew with escalated priority.`
                    );
                    setVerifyingIssue(null);
                    setVerificationFeedback("");
                  }}
                  className={`py-3.5 px-4 rounded-xl text-xs font-mono font-bold shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.99] text-white ${
                    isActuallyResolved
                      ? "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:brightness-110 shadow-emerald-600/20"
                      : "bg-gradient-to-r from-rose-600 to-rose-500 hover:brightness-110 shadow-rose-600/20"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    {isActuallyResolved ? `Submit Verification (${starRating}★ Rating · +25 Karma)` : `Submit Dispute & Reopen Order`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setVerifyingIssue(null)}
                  className="py-3.5 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono font-bold transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 5-STAR RATING POP-UP MODAL (User Requirement #3) */}
      {showRatingModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl space-y-5 text-center ${
            isLight ? "bg-white border-slate-300 text-slate-900" : "bg-[#12181b] border-white/15 text-white"
          }`}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-mono text-amberGold-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-amberGold-400 text-amberGold-400" />
                <span>5-Star Municipal Rating Pop-up</span>
              </span>
              <button 
                type="button"
                onClick={() => setShowRatingModal(false)}
                className="text-slate-400 hover:text-white p-1 text-base"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold tracking-tight">Rate Municipal Resolution</h4>
              <p className="text-xs text-slate-400 font-mono">
                Select your opinion of the field crew&apos;s repair:
              </p>
            </div>

            {/* 5 Big Gold Stars in Pop-up */}
            <div className="flex items-center justify-center gap-3 py-3">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = (hoveredStar !== null ? hoveredStar : starRating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(null)}
                    onClick={() => {
                      setStarRating(star);
                      setQualityOfWork(star);
                    }}
                    className="p-1 hover:scale-130 transition-transform duration-150 focus:outline-none cursor-pointer"
                    title={`Rate ${star} Star${star > 1 ? "s" : ""}`}
                  >
                    <Star 
                      className={`w-11 h-11 transition-all ${
                        isFilled 
                          ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]" 
                          : "text-slate-600 hover:text-slate-400"
                      }`} 
                    />
                  </button>
                );
              })}
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-mono font-bold text-amber-300">
              {starRating} out of 5 Stars · {
                starRating === 5 ? "⭐⭐⭐⭐⭐ Outstanding Work!" :
                starRating === 4 ? "⭐⭐⭐⭐ Great Experience" :
                starRating === 3 ? "⭐⭐⭐ Standard Resolution" :
                starRating === 2 ? "⭐⭐ Sub-par Repair" :
                "⭐ Unacceptable Quality"
              }
            </div>

            <button
              type="button"
              onClick={() => setShowRatingModal(false)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amberGold-500 to-amber-500 text-slate-950 font-bold font-mono text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              Confirm {starRating} Star Rating ✓
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
