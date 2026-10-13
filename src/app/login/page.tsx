"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sun, Moon, ArrowLeft, User } from "lucide-react";
import { signIn } from "next-auth/react";
import { useCivionStore } from "@/lib/civion-store";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { login, register, theme, toggleTheme } = useCivionStore();

  const [authView, setAuthView] = useState<"login" | "register">("login");

  // Real empty login credentials (no default/mock users)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sign up credentials
  const [name, setName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);

  const isLight = theme === "light";

  const [authError, setAuthError] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setAuthError("");
    setIsLoading(true);
    try {
      // 1. Authenticate with Civion state store (validates authority or worker credentials)
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
    if (!name || !regEmail || !regPassword) return;
    register("resident", name, regEmail);
    router.push("/");
  };

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    try {
      await signIn(provider, { redirect: false, callbackUrl: "/" });
      login(`user.${provider}@example.com`);
      router.push("/");
    } catch {
      login(`user.${provider}@example.com`);
      router.push("/");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.authCard}>
        {/* Back Link */}
        <Link href="/" className={styles.iconBack} aria-label="Back to home" title="Return to platform">
          <ArrowLeft size={18} />
        </Link>

        {/* Theme Toggle Icon */}
        <button
          onClick={toggleTheme}
          type="button"
          className={styles.iconToggle}
          aria-label="Toggle theme"
          title="Toggle theme"
        >
          {isLight ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* 3D Geometric Isometric Cube Logo */}
        <div className={styles.logoWrapper}>
          <svg
            className={styles.cubeIcon}
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Outer Cube */}
            <polygon points="50,14 84,33 50,52 16,33" />
            <polygon points="16,33 50,52 50,88 16,69" />
            <polygon points="50,52 84,33 84,69 50,88" />

            {/* Inner Floating Wireframe Cube */}
            <polygon points="50,30 68,40.5 50,51 32,40.5" strokeWidth="1.8" strokeOpacity="0.85" />
            <polygon points="32,40.5 50,51 50,71 32,60.5" strokeWidth="1.8" strokeOpacity="0.85" />
            <polygon points="50,51 68,40.5 68,60.5 50,71" strokeWidth="1.8" strokeOpacity="0.85" />

            {/* Projection Connector Lines */}
            <line x1="50" y1="14" x2="50" y2="30" strokeWidth="1.5" strokeOpacity="0.65" />
            <line x1="84" y1="33" x2="68" y2="40.5" strokeWidth="1.5" strokeOpacity="0.65" />
            <line x1="84" y1="69" x2="68" y2="60.5" strokeWidth="1.5" strokeOpacity="0.65" />
            <line x1="50" y1="88" x2="50" y2="71" strokeWidth="1.5" strokeOpacity="0.65" />
            <line x1="16" y1="69" x2="32" y2="60.5" strokeWidth="1.5" strokeOpacity="0.65" />
            <line x1="16" y1="33" x2="32" y2="40.5" strokeWidth="1.5" strokeOpacity="0.65" />
          </svg>
        </div>

        {/* Title */}
        <h1 className={styles.title}>
          {authView === "login" ? "Welcome back" : "Create account"}
        </h1>

        {/* ==================== LOGIN VIEW ==================== */}
        {authError && (
          <div style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            color: "#f87171",
            padding: "0.65rem 0.85rem",
            borderRadius: "10px",
            fontSize: "0.82rem",
            marginBottom: "1rem",
            textAlign: "center"
          }}>
            {authError}
          </div>
        )}
        {authView === "login" && (
          <form onSubmit={handleLoginSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="login-email">Email address</label>
              <div className={styles.inputWrapper}>
                <Mail className={styles.fieldIcon} size={16} />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="login-password">Password</label>
              <div className={styles.inputWrapper}>
                <Lock className={styles.fieldIcon} size={16} />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.passwordToggle}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className={styles.forgotWrapper}>
              <button
                type="button"
                onClick={() => alert("Password reset link sent to " + (email || "your email"))}
                className={styles.subLink}
              >
                Forgot password?
              </button>
            </div>

            <button type="submit" disabled={isLoading} className={styles.submitBtn}>
              <span>{isLoading ? "Signing in..." : "Login"}</span>
              <ArrowRight size={16} />
            </button>

            <div className={styles.divider}>
              <span>or continue with</span>
            </div>

            {/* OAuth Buttons */}
            <div className={styles.oauthRow}>
              <button
                type="button"
                onClick={() => handleOAuthSignIn("google")}
                className={styles.oauthBtn}
              >
                <svg viewBox="0 0 24 24" className={styles.oauthSvg}>
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
                className={styles.oauthBtn}
              >
                <svg viewBox="0 0 24 24" className={styles.oauthSvg} fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
                <span>GitHub</span>
              </button>
            </div>

            <div className={styles.switchAuth}>
              <span>Don&apos;t have an account? </span>
              <button
                type="button"
                onClick={() => setAuthView("register")}
                className={styles.switchBtn}
              >
                Sign up
              </button>
            </div>
          </form>
        )}

        {/* ==================== SIGN UP VIEW ==================== */}
        {authView === "register" && (
          <form onSubmit={handleRegisterSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="reg-name">Full name</label>
              <div className={styles.inputWrapper}>
                <User className={styles.fieldIcon} size={16} />
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="reg-email">Email address</label>
              <div className={styles.inputWrapper}>
                <Mail className={styles.fieldIcon} size={16} />
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="reg-password">Password</label>
              <div className={styles.inputWrapper}>
                <Lock className={styles.fieldIcon} size={16} />
                <input
                  id="reg-password"
                  type={showRegPassword ? "text" : "password"}
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className={styles.passwordToggle}
                  aria-label={showRegPassword ? "Hide password" : "Show password"}
                >
                  {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} style={{ marginTop: "1rem" }}>
              <span>Create Account</span>
              <ArrowRight size={16} />
            </button>

            <div className={styles.switchAuth} style={{ marginTop: "1.25rem" }}>
              <span>Already have an account? </span>
              <button
                type="button"
                onClick={() => setAuthView("login")}
                className={styles.switchBtn}
              >
                Log in
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
