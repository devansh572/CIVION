"use client";

import React, { useState } from "react";
import { useCivionStore, Role } from "@/lib/civion-store";
import { User, Briefcase, MapPin, Activity } from "lucide-react";

export const RoleSelectionScreen: React.FC = () => {
  const { currentRole, setRole, openAuthModal } = useCivionStore();
  const [selectedRole, setSelectedRole] = useState<Role>(currentRole || "authority");

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setRole(role);
  };

  const handleContinue = () => {
    openAuthModal(selectedRole);
  };

  const roleOptions: Array<{
    id: Role;
    title: string;
    description: string;
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
  }> = [
    {
      id: "resident",
      title: "Resident",
      description: "Report an issue, follow progress, and verify a fix.",
      icon: <User className="w-5 h-5 text-[#e07a5f]" />,
      iconBg: "bg-[#251b19]",
      iconColor: "text-[#e07a5f]",
    },
    {
      id: "authority",
      title: "Authority",
      description: "Triage signals, assign crews, and close the loop.",
      icon: <Briefcase className="w-5 h-5 text-[#34d399]" />,
      iconBg: "bg-[#152420]",
      iconColor: "text-[#34d399]",
    },
    {
      id: "field_worker",
      title: "Field worker",
      description: "See assigned jobs, update progress, and publish a field note.",
      icon: <MapPin className="w-5 h-5 text-[#fbbf24]" />,
      iconBg: "bg-[#252017]",
      iconColor: "text-[#fbbf24]",
    },
  ];

  const getRoleDisplayName = (r: Role) => {
    switch (r) {
      case "resident":
        return "Resident";
      case "authority":
        return "Authority";
      case "field_worker":
        return "Field worker";
    }
  };

  return (
    <div className="min-h-screen bg-[#111416] flex items-center justify-center p-3 sm:p-6 md:p-8">
      {/* Main Container matching screenshot */}
      <div className="w-full max-w-[1020px] rounded-[26px] overflow-hidden shadow-2xl border border-white/[0.08] flex flex-col md:flex-row min-h-[580px] bg-[#101416]">
        
        {/* ================= LEFT PANEL: TEAL BRAND PANEL ================= */}
        <div className="relative md:w-[46%] p-8 sm:p-10 lg:p-12 flex flex-col justify-between overflow-hidden bg-[#183d3a] text-white">
          {/* Subtle concentric circles at bottom-left */}
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full border border-white/[0.07] pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full border border-white/[0.07] pointer-events-none" />
          <div className="absolute -bottom-2 -left-2 w-36 h-36 rounded-full bg-white/[0.02] pointer-events-none" />

          {/* Top Logo */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e07a5f] flex items-center justify-center shadow-lg shadow-[#e07a5f]/25">
              <Activity className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <span className="font-bold text-2xl tracking-tight font-sans text-white">
              civion<span className="text-[#e07a5f]">.</span>
            </span>
          </div>

          {/* Middle Headline */}
          <div className="relative z-10 my-10 space-y-4">
            <div className="text-[11px] font-mono tracking-widest uppercase text-[#e07a5f] font-semibold">
              SHARED CIVIC PROMISE LEDGER
            </div>
            
            <h1 className="text-4xl sm:text-[46px] font-bold tracking-tight leading-[1.12] text-white">
              Keep the work <br />
              <span className="text-[#e89078]">in view.</span>
            </h1>

            <p className="text-sm sm:text-[15px] font-normal leading-relaxed text-slate-200/90 max-w-sm pt-2">
              A small demo of the resident signal and the city team behind it. Choose a view to continue.
            </p>
          </div>

          {/* Bottom District Tag */}
          <div className="relative z-10 text-[11px] font-mono tracking-wider text-teal-200/60 uppercase">
            CIVION / NORTH DISTRICT
          </div>
        </div>

        {/* ================= RIGHT PANEL: ROLE SELECTOR ================= */}
        <div className="md:w-[54%] p-8 sm:p-10 lg:p-12 flex flex-col justify-between bg-[#131618] text-white">
          
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Who are you today?
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-md">
                The selected role stays on this device so you can move between pages without signing in again.
              </p>
            </div>

            {/* 3 Role Option Cards */}
            <div className="space-y-3 pt-1">
              {roleOptions.map((opt) => {
                const isSelected = selectedRole === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleSelectRole(opt.id)}
                    className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 flex items-center justify-between border ${
                      isSelected
                        ? "bg-[#142321] border-[#2b594f] shadow-lg shadow-black/40"
                        : "bg-[#181d1f] border-white/[0.06] hover:border-white/[0.12] hover:bg-[#1c2225]"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Icon container */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${opt.iconBg}`}>
                        {opt.icon}
                      </div>

                      {/* Text */}
                      <div>
                        <h3 className="font-semibold text-sm sm:text-[15px] text-white">
                          {opt.title}
                        </h3>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {opt.description}
                        </p>
                      </div>
                    </div>

                    {/* Radio Button Indicator */}
                    <div className="pl-3 flex-shrink-0">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? "border-[#34d399] bg-transparent"
                          : "border-neutral-600 bg-transparent"
                      }`}>
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#34d399]" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Section */}
          <div className="pt-8 space-y-3">
            {/* Primary Coral CTA Button matching screenshot */}
            <button
              onClick={handleContinue}
              className="w-full py-3.5 px-6 rounded-2xl font-semibold text-white bg-[#e07a5f] hover:bg-[#d46d52] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#e07a5f]/20 text-sm sm:text-base"
            >
              <span>Continue as {getRoleDisplayName(selectedRole)}</span>
              <span className="text-lg leading-none">→</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
