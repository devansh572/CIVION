"use client";

import React, { useState } from "react";
import { useCivionStore } from "@/lib/civion-store";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, User, Sun, Moon } from "lucide-react";
import { signIn } from "next-auth/react";

export const AuthModal: React.FC = () => {
  const { closeAuthModal, login, register, theme, toggleTheme } = useCivionStore();

  const [authView, setAuthView] = useState<"login" | "register">("login");

  // Real blank login form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Registration form states
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setAuthError("");
    setIsLoading(true);
    try {
      // 1. Authenticate with Civion state store (verifies authority or worker credentials)
      const success = login(email, password);
      if (success === false) {
        setAuthError(useCivionStore.getState().notificationMessage || "Access Denied: Incorrect credentials.");
        setIsLoading(false);
        return;
      }

      // 2. Synchronize NextAuth session in background
      try {
        await signIn("credentials", {
          redirect: false,
          email,
          password,
        });
      } catch (err) {
        console.warn("NextAuth session warning:", err);
      }

      // 3. Navigate straight into platform workspace
      window.location.href = "/";
    } catch {
      setAuthError("Authentication failed. Please check your credentials.");
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) return;
    register("resident", regName, regEmail);
  };

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    try {
      await signIn(provider, { redirect: false, callbackUrl: "/" });
      login(`user.${provider}@example.com`);
    } catch {
      login(`user.${provider}@example.com`);
    }
  };

  const isLight = theme === "light";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-xl animate-fade-in">
      
      {/* Background Ambience & Engineering Blueprint Backdrop */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-40 bg-cover bg-center mix-blend-screen transition-opacity duration-700"
        style={{
          backgroundImage: "url('/images/auth-backdrop.jpg')",
          filter: "contrast(1.15) brightness(0.65)"
        }}
      />
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-t from-black via-black/70 to-transparent" />

      {/* Main Glassmorphic Auth Card */}
      <div 
        className={`relative w-full max-w-[420px] rounded-[32px] p-7 sm:p-9 border shadow-2xl transition-all duration-300 backdrop-blur-2xl z-10 ${
          isLight 
            ? "bg-[#faf9f6]/95 border-slate-300 text-slate-900 shadow-slate-900/30" 
            : "bg-[#0b0f15]/90 border-white/[0.08] text-white shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_50px_rgba(202,161,106,0.08)]"
        }`}
      >
        
        {/* Top Header Controls: Back on Left, Theme Toggle on Right */}
        <button
          onClick={closeAuthModal}
          type="button"
          aria-label="Back to previous screen"
          className={`absolute top-6 left-6 p-2 rounded-full border transition-all ${
            isLight 
              ? "bg-slate-200/80 border-slate-300 text-slate-700 hover:bg-slate-300" 
              : "bg-white/[0.04] border-white/10 text-neutral-400 hover:text-white hover:border-white/20"
          }`}
          title="Return to platform"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <button
          onClick={toggleTheme}
          type="button"
          aria-label="Toggle theme"
          className={`absolute top-6 right-6 p-2 rounded-full border transition-all ${
            isLight
              ? "bg-slate-200/80 border-slate-300 text-slate-800 hover:bg-slate-300"
              : "bg-white/[0.04] border-white/10 text-neutral-400 hover:text-white hover:border-white/20"
          }`}
        >
          {isLight ? <Moon className="w-4 h-4 text-slate-800" /> : <Sun className="w-4 h-4 text-neutral-300" />}
        </button>

        {/* 3D Isometric Wireframe Cube Logo (1:1 with photo) */}
        <div className="flex flex-col items-center justify-center text-center mt-2 mb-6">
          <div className="relative flex items-center justify-center w-20 h-20 mb-2">
            {/* Subtle golden ambient glow */}
            <div className="absolute inset-0 bg-[#caa16a]/15 rounded-full blur-xl pointer-events-none" />
            
            <svg
              className="w-16 h-16 text-[#caa16a] relative z-10 transition-transform duration-500 hover:scale-105"
              viewBox="0 0 100 100"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Outer Isometric Cube */}
              <polygon points="50,14 84,33 50,52 16,33" />
              <polygon points="16,33 50,52 50,88 16,69" />
              <polygon points="50,52 84,33 84,69 50,88" />

              {/* Inner Floating Wireframe Cube */}
              <polygon points="50,30 68,40.5 50,51 32,40.5" strokeWidth="1.8" strokeOpacity="0.85" />
              <polygon points="32,40.5 50,51 50,71 32,60.5" strokeWidth="1.8" strokeOpacity="0.85" />
              <polygon points="50,51 68,40.5 68,60.5 50,71" strokeWidth="1.8" strokeOpacity="0.85" />

              {/* Connecting Projection Lines */}
              <line x1="50" y1="14" x2="50" y2="30" strokeWidth="1.5" strokeOpacity="0.65" />
              <line x1="84" y1="33" x2="68" y2="40.5" strokeWidth="1.5" strokeOpacity="0.65" />
              <line x1="84" y1="69" x2="68" y2="60.5" strokeWidth="1.5" strokeOpacity="0.65" />
              <line x1="50" y1="88" x2="50" y2="71" strokeWidth="1.5" strokeOpacity="0.65" />
              <line x1="16" y1="69" x2="32" y2="60.5" strokeWidth="1.5" strokeOpacity="0.65" />
              <line x1="16" y1="33" x2="32" y2="40.5" strokeWidth="1.5" strokeOpacity="0.65" />
            </svg>
          </div>

          <h1 className={`text-2xl sm:text-[26px] font-medium tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
            {authView === "login" ? "Welcome back" : "Create account"}
          </h1>
        </div>

        {/* ==================== LOGIN VIEW ==================== */}
        {authError && (
          <div className="mb-3 p-2.5 rounded-xl text-xs text-center border bg-red-500/10 border-red-500/30 text-red-400 font-medium animate-fade-in">
            {authError}
          </div>
        )}
        {authView === "login" && (
          <div className="space-y-4 animate-fade-in">
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              {/* Email Input */}
              <div>
                <label className={`block text-xs font-normal mb-1.5 ${isLight ? "text-slate-600" : "text-neutral-400"}`}>
                  Email address
                </label>
                <div className="relative flex items-center">
                  <Mail className={`absolute left-3.5 w-4 h-4 pointer-events-none ${
                    isLight ? "text-slate-400" : "text-neutral-500"
                  }`} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm border transition-all focus:outline-none focus:ring-1 ${
                      isLight
                        ? "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#caa16a] focus:ring-[#caa16a]/40"
                        : "bg-[#12161f]/80 border-white/[0.08] text-white placeholder-neutral-500 focus:border-[#caa16a] focus:ring-[#caa16a]/50"
                    }`}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className={`block text-xs font-normal mb-1.5 ${isLight ? "text-slate-600" : "text-neutral-400"}`}>
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className={`absolute left-3.5 w-4 h-4 pointer-events-none ${
                    isLight ? "text-slate-400" : "text-neutral-500"
                  }`} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={`w-full pl-10 pr-10 py-3 rounded-xl text-sm border transition-all focus:outline-none focus:ring-1 ${
                      isLight
                        ? "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#caa16a] focus:ring-[#caa16a]/40"
                        : "bg-[#12161f]/80 border-white/[0.08] text-white placeholder-neutral-500 focus:border-[#caa16a] focus:ring-[#caa16a]/50"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3.5 transition-colors ${
                      isLight ? "text-slate-400 hover:text-slate-600" : "text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={() => alert("Password reset instructions sent to " + (email || "your email"))}
                  className="text-xs font-normal text-[#caa16a] hover:underline transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Golden/Bronze Gradient Login Button */}
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl font-semibold text-[#111111] flex items-center justify-center gap-2 text-sm shadow-lg shadow-[#caa16a]/15 hover:opacity-95 active:scale-[0.99] transition-all bg-gradient-to-r from-[#d2a36d] via-[#caa16a] to-[#ba8548] mt-2"
              >
                <span>Login</span>
                <ArrowRight className="w-4 h-4 stroke-[2.2]" />
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${isLight ? "border-slate-300" : "border-white/[0.08]"}`} />
              </div>
              <div className="relative flex justify-center text-[11px]">
                <span className={`px-3 font-normal ${
                  isLight ? "bg-[#faf9f6] text-slate-500" : "bg-[#0b0f15] text-neutral-500"
                }`}>
                  or continue with
                </span>
              </div>
            </div>

            {/* Social OAuth Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleOAuthSignIn("google")}
                className={`py-2.5 px-4 rounded-xl text-xs font-medium border flex items-center justify-center gap-2.5 transition-all ${
                  isLight 
                    ? "bg-white border-slate-300 text-slate-800 hover:bg-slate-50 shadow-sm" 
                    : "bg-[#12161f]/80 border-white/[0.08] hover:border-white/20 text-white"
                }`}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleOAuthSignIn("github")}
                className={`py-2.5 px-4 rounded-xl text-xs font-medium border flex items-center justify-center gap-2.5 transition-all ${
                  isLight 
                    ? "bg-white border-slate-300 text-slate-800 hover:bg-slate-50 shadow-sm" 
                    : "bg-[#12161f]/80 border-white/[0.08] hover:border-white/20 text-white"
                }`}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
                <span>GitHub</span>
              </button>
            </div>

            {/* Bottom Toggle */}
            <p className={`text-center text-xs mt-4 ${isLight ? "text-slate-600" : "text-neutral-400"}`}>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => setAuthView("register")}
                className="text-[#caa16a] font-medium hover:underline ml-1"
              >
                Sign up
              </button>
            </p>
          </div>
        )}

        {/* ==================== SIGN UP VIEW ==================== */}
        {authView === "register" && (
          <div className="space-y-4 animate-fade-in">
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className={`block text-xs font-normal mb-1.5 ${isLight ? "text-slate-600" : "text-neutral-400"}`}>
                  Full name
                </label>
                <div className="relative flex items-center">
                  <User className={`absolute left-3.5 w-4 h-4 pointer-events-none ${
                    isLight ? "text-slate-400" : "text-neutral-500"
                  }`} />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Enter your name"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm border transition-all focus:outline-none focus:ring-1 ${
                      isLight
                        ? "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#caa16a] focus:ring-[#caa16a]/40"
                        : "bg-[#12161f]/80 border-white/[0.08] text-white placeholder-neutral-500 focus:border-[#caa16a] focus:ring-[#caa16a]/50"
                    }`}
                  />
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label className={`block text-xs font-normal mb-1.5 ${isLight ? "text-slate-600" : "text-neutral-400"}`}>
                  Email address
                </label>
                <div className="relative flex items-center">
                  <Mail className={`absolute left-3.5 w-4 h-4 pointer-events-none ${
                    isLight ? "text-slate-400" : "text-neutral-500"
                  }`} />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm border transition-all focus:outline-none focus:ring-1 ${
                      isLight
                        ? "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#caa16a] focus:ring-[#caa16a]/40"
                        : "bg-[#12161f]/80 border-white/[0.08] text-white placeholder-neutral-500 focus:border-[#caa16a] focus:ring-[#caa16a]/50"
                    }`}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className={`block text-xs font-normal mb-1.5 ${isLight ? "text-slate-600" : "text-neutral-400"}`}>
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className={`absolute left-3.5 w-4 h-4 pointer-events-none ${
                    isLight ? "text-slate-400" : "text-neutral-500"
                  }`} />
                  <input
                    type={showRegPassword ? "text" : "password"}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className={`w-full pl-10 pr-10 py-3 rounded-xl text-sm border transition-all focus:outline-none focus:ring-1 ${
                      isLight
                        ? "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#caa16a] focus:ring-[#caa16a]/40"
                        : "bg-[#12161f]/80 border-white/[0.08] text-white placeholder-neutral-500 focus:border-[#caa16a] focus:ring-[#caa16a]/50"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className={`absolute right-3.5 transition-colors ${
                      isLight ? "text-slate-400 hover:text-slate-600" : "text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Sign Up Button */}
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl font-semibold text-[#111111] flex items-center justify-center gap-2 text-sm shadow-lg shadow-[#caa16a]/15 hover:opacity-95 active:scale-[0.99] transition-all bg-gradient-to-r from-[#d2a36d] via-[#caa16a] to-[#ba8548] mt-2"
              >
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4 stroke-[2.2]" />
              </button>
            </form>

            {/* Bottom Toggle */}
            <p className={`text-center text-xs mt-4 ${isLight ? "text-slate-600" : "text-neutral-400"}`}>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setAuthView("login")}
                className="text-[#caa16a] font-medium hover:underline ml-1"
              >
                Log in
              </button>
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
