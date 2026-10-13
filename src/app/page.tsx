"use client";

import React, { useEffect, useState } from "react";
import { useCivionStore, ROLE_PERMISSIONS } from "@/lib/civion-store";
import { findAuthorityAccount } from "@/lib/authority-credentials";
import { findWorkerAccount } from "@/lib/worker-credentials";
import { useSession } from "next-auth/react";
import { RoleSelectionScreen } from "@/components/RoleSelectionScreen";
import { AuthModal } from "@/components/AuthModal";
import { GlobalNavbar } from "@/components/GlobalNavbar";
import { ResidentPortal } from "@/components/resident/ResidentPortal";
import { AuthorityCommandCenter } from "@/components/authority/AuthorityCommandCenter";
import { FieldWorkerDashboard } from "@/components/worker/FieldWorkerDashboard";
import { CivicChatbox } from "@/components/CivicChatbox";
import { CheckCircle2, X } from "lucide-react";

export default function CivionApp() {
  const { data: session } = useSession();
  const { 
    activeView, 
    currentRole, 
    currentUser,
    isAuthenticated,
    isGuest,
    login,
    setRole,
    theme, 
    notificationMessage, 
    dismissNotification 
  } = useCivionStore();

  const [mounted, setMounted] = useState(false);

  // Sync NextAuth session with Civion Store
  useEffect(() => {
    if (session?.user?.email) {
      const email = session.user.email;
      const authAcc = findAuthorityAccount(email);
      const wrkAcc = findWorkerAccount(email);
      if (authAcc) {
        if (!currentUser || currentUser.role !== "authority") {
          login(authAcc.email, authAcc.password);
        }
      } else if (wrkAcc) {
        if (!currentUser || currentUser.role !== "field_worker") {
          login(wrkAcc.email, wrkAcc.password);
        }
      } else {
        if (!currentUser || currentUser.email !== email) {
          login(email);
        }
      }
    }
  }, [session, currentUser, login]);

  useEffect(() => {
    setMounted(true);
    // Sync theme class
    if (theme === "light") {
      document.documentElement.classList.add("light");
      document.body.classList.add("light-theme");
    } else {
      document.documentElement.classList.remove("light");
      document.body.classList.remove("light-theme");
    }
  }, [theme]);

  // RBAC Guard: Enforce strict role permissions
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === "authority") {
        if (currentRole !== "authority" && currentRole !== "field_worker") {
          setRole("authority");
        }
      } else {
        const allowed = ROLE_PERMISSIONS[currentUser.role] || [currentUser.role];
        if (!allowed.includes(currentRole)) {
          setRole(currentUser.role);
        }
      }
    }
  }, [currentUser, currentRole, setRole]);

  // Auto-dismiss notification after 4 seconds
  useEffect(() => {
    if (notificationMessage) {
      const timer = setTimeout(() => {
        dismissNotification();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notificationMessage, dismissNotification]);

  if (!mounted) {
    return (
      <main className="min-h-screen relative overflow-x-hidden">
        <RoleSelectionScreen />
      </main>
    );
  }

  const isUserAuthenticated = isAuthenticated && currentUser !== null;

  // 1. If user is not authenticated, always show the first page from reference screenshot
  if (!isUserAuthenticated) {
    return (
      <main className="min-h-screen relative overflow-x-hidden">
        <RoleSelectionScreen />
        {activeView === "auth_modal" && <AuthModal />}
        <CivicChatbox />
      </main>
    );
  }

  // 2. Authenticated Workspace View
  const isLight = theme === "light";

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      isLight ? "bg-[#f6f5f0] text-slate-900" : "bg-[#0d1117] text-[#e6edf3]"
    }`}>
      {/* Top Navbar with Quick Role Switcher */}
      <GlobalNavbar />

      {/* Main Workspace Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Real-time notification toast */}
        {notificationMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 flex items-center justify-between gap-3 shadow-lg shadow-emerald-950/40 animate-fade-in">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-mono font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{notificationMessage}</span>
            </div>
            <button
              onClick={dismissNotification}
              className="text-emerald-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dynamic Role-Based Module */}
        {currentRole === "resident" && <ResidentPortal />}
        {currentRole === "authority" && <AuthorityCommandCenter />}
        {currentRole === "field_worker" && <FieldWorkerDashboard />}
      </main>

      {/* Floating Civic AI Chatbox & Voice Search */}
      <CivicChatbox />

      {/* Global Civic Footer */}
      <footer className={`border-t py-6 mt-auto text-xs font-mono transition-colors ${
        isLight ? "border-slate-200 text-slate-500 bg-white" : "border-white/10 text-slate-500 bg-[#090d10]"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-slate-400">civion.</span>
            <span>· Shared Civic Promise Ledger</span>
          </div>
          <div>NORTH DISTRICT · BBMP & COMMUNITY MUNICIPALITY</div>
          <div>SIGNAL / CONTEXT / ACTION · CIV-24.09</div>
        </div>
      </footer>
    </div>
  );
}
