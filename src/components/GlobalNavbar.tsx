"use client";

import React from "react";
import { useCivionStore, Role } from "@/lib/civion-store";
import { Activity, User, Briefcase, Compass, Sun, Moon, LogOut, Radio } from "lucide-react";
import { signOut } from "next-auth/react";

export const GlobalNavbar: React.FC = () => {
  const { currentRole, switchRole, currentUser, isGuest, openAuthModal, logout, theme, toggleTheme } = useCivionStore();

  const roles: Array<{ id: Role; label: string; icon: React.ReactNode }> = [
    { id: "resident", label: "Resident Portal", icon: <User className="w-3.5 h-3.5" /> },
    { id: "authority", label: "Authority Command", icon: <Briefcase className="w-3.5 h-3.5" /> },
    { id: "field_worker", label: "Field Worker (Mobile)", icon: <Compass className="w-3.5 h-3.5" /> },
  ];

  const isLight = theme === "light";

  return (
    <header className={`sticky top-0 z-40 w-full border-b transition-colors duration-200 backdrop-blur-md ${
      isLight 
        ? "bg-[#faf8f5]/90 border-slate-200 text-slate-900" 
        : "bg-[#0d1117]/90 border-white/10 text-white"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand Mark & District Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-coral-500 flex items-center justify-center shadow-md shadow-coral-500/20">
              <Activity className="w-4 h-4 text-white stroke-[2.5]" />
            </div>
            <span className="font-bold text-xl tracking-tight">
              civion<span className="text-coral-500">.</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-white/10 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="opacity-80">NORTH DISTRICT</span>
            <span className="opacity-40">/</span>
            <span className="text-emerald-400">All systems reporting</span>
          </div>
        </div>

        {/* Center: Role-Based Access Controlled Navigation */}
        <div className={`flex items-center p-1 rounded-xl border shadow-inner ${
          isLight ? "bg-slate-200/70 border-slate-300" : "bg-[#161d21] border-white/10"
        }`}>
          {isGuest ? (
            <div className="flex items-center gap-2 px-3 py-1.5">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>PUBLIC TRANSPARENCY LEDGER</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hidden sm:inline">
                Guest View
              </span>
            </div>
          ) : currentUser?.role === "authority" ? (
            <>
              <div className="hidden sm:flex items-center px-2 text-[10px] font-mono uppercase font-bold text-emerald-400 tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                SUPERVISOR ACCESS:
              </div>

              {/* Authority can toggle between Authority Command and Field Worker Dashboard */}
              {[
                { id: "authority" as Role, label: "Authority Command", icon: <Briefcase className="w-3.5 h-3.5" /> },
                { id: "field_worker" as Role, label: "Field Worker (Live)", icon: <Compass className="w-3.5 h-3.5" /> },
              ].map((r) => {
                const isActive = currentRole === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => switchRole(r.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? isLight
                          ? "bg-white text-emerald-950 font-bold shadow-sm"
                          : "bg-coral-500 text-white font-semibold shadow-md shadow-coral-500/20"
                        : isLight
                          ? "text-slate-600 hover:text-slate-900"
                          : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {r.icon}
                    <span className="hidden md:inline">{r.label}</span>
                    <span className="md:hidden capitalize">{r.id.replace("_", " ")}</span>
                  </button>
                );
              })}

              {/* Locked Resident Tab with info */}
              <button
                type="button"
                onClick={() => switchRole("resident")}
                title="Resident Portal is restricted to citizen accounts. Sign out to log in as resident."
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono text-slate-500 opacity-60 hover:opacity-90 cursor-not-allowed"
              >
                <span>🔒 Resident</span>
              </button>
            </>
          ) : currentUser?.role === "resident" ? (
            <div className="flex items-center gap-2 px-3 py-1.5">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-coral-500">
                <User className="w-3.5 h-3.5" />
                <span>Resident Portal</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
                🔒 Citizen Access Only (Sign out to switch)
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amberGold-400">
                <Compass className="w-3.5 h-3.5" />
                <span>Field Worker Dashboard</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
                🔒 Field Crew Access Only (Sign out to switch)
              </span>
            </div>
          )}
        </div>

        {/* Right: Active Profile, Theme Toggle & Sign Out */}
        <div className="flex items-center gap-3">
          {/* Guest Sign-In CTA or User Profile */}
          {isGuest ? (
            <button
              onClick={() => openAuthModal()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-semibold bg-coral-500 hover:bg-coral-600 text-white transition-all shadow-md shadow-coral-500/20"
            >
              <User className="w-3.5 h-3.5" />
              <span>SIGN IN</span>
            </button>
          ) : currentUser ? (
            <div className="hidden lg:flex items-center gap-2 text-right">
              <div>
                <div className="text-xs font-semibold leading-tight">{currentUser.name}</div>
                <div className="text-[10px] font-mono opacity-60 leading-tight capitalize">
                  {currentUser.role.replace("_", " ")}
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-800/60 border border-emerald-500/40 text-emerald-200 flex items-center justify-center text-xs font-mono font-bold">
                {currentUser.avatar}
              </div>
            </div>
          ) : null}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title="Toggle Daylight / Night mode"
            className={`p-2 rounded-xl border transition-colors ${
              isLight 
                ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-100" 
                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
            }`}
          >
            {isLight ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-coral-400" />}
          </button>

          {/* Sign Out / Exit Demo */}
          <button
            onClick={async () => {
              await signOut({ redirect: false });
              logout();
              window.location.href = "/";
            }}
            title="Switch demo role / Sign out"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-medium border transition-colors ${
              isLight
                ? "bg-white border-slate-200 text-rose-600 hover:bg-rose-50"
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isGuest ? "ROLES" : "LOG OUT"}</span>
          </button>
        </div>

      </div>
    </header>
  );
};
