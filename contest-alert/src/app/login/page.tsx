"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  Lightning,
  GoogleLogo,
  MicrosoftOutlookLogo,
  EnvelopeSimple,
  Lock,
  ArrowRight,
  Eye,
  EyeSlash,
} from "@phosphor-icons/react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT_EXPO } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
};

export default function LoginPage() {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOAuth(provider: "google" | "azure") {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-12 bg-[var(--background)]">
      {/* Background mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 -left-32 w-[400px] h-[400px] rounded-full bg-[var(--accent)]/6 blur-[100px]" />
        <div className="absolute bottom-1/4 -right-24 w-[350px] h-[350px] rounded-full bg-[var(--cta)]/4 blur-[100px]" />
      </div>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="relative w-full max-w-md"
      >
        {/* Logo + Header */}
        <motion.div variants={fadeUp} className="text-center mb-8 space-y-4">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="bg-white px-2.5 py-1.5 rounded-xl border border-neutral-100 shadow-sm flex items-center justify-center shrink-0 group-hover:scale-102 transition-transform duration-300">
              <img src="/images/logo.png" alt="RIT Logo" className="h-7 w-auto object-contain" />
            </div>
            <span className="text-[var(--surface-border)] font-normal text-lg">|</span>
            <span className="font-display font-extrabold text-base tracking-tight block leading-none text-[var(--foreground)]">Contest Alert</span>
          </Link>
        </motion.div>

        {/* Card */}
        <motion.div variants={fadeUp} className="card-bezel-elevated">
          <div className="card-bezel-inner p-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold tracking-tight">
                {isAdminMode ? "Admin Sign In" : "Welcome Back"}
              </h2>
              <p className="text-sm text-[var(--foreground-muted)]">
                {isAdminMode
                  ? "Sign in with your admin credentials"
                  : "Sign in with your college account to continue"}
              </p>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-[var(--cta-muted)] text-[var(--cta)] text-sm font-medium border border-[var(--cta)]/20">
                {error}
              </div>
            )}

            {!isAdminMode ? (
              /* Student OAuth Buttons */
              <div className="space-y-3">
                <button
                  onClick={() => handleOAuth("google")}
                  disabled={loading}
                  className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] hover:border-[var(--surface-border-hover)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:opacity-50"
                >
                  <GoogleLogo weight="bold" className="w-5 h-5 text-[#4285F4]" />
                  <span className="text-sm font-medium flex-1 text-left">Continue with Google</span>
                  <ArrowRight weight="bold" className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
                </button>

                <button
                  onClick={() => handleOAuth("azure")}
                  disabled={loading}
                  className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] hover:border-[var(--surface-border-hover)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:opacity-50"
                >
                  <MicrosoftOutlookLogo weight="bold" className="w-5 h-5 text-[#00A4EF]" />
                  <span className="text-sm font-medium flex-1 text-left">Continue with Microsoft</span>
                  <ArrowRight weight="bold" className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
                </button>
              </div>
            ) : (
              /* Admin Email/Password Form */
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--foreground-secondary)]">Email</label>
                  <div className="relative">
                    <EnvelopeSimple weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@ritchennai.edu.in"
                      required
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] text-sm placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--foreground-secondary)]">Password</label>
                  <div className="relative">
                    <Lock weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="w-full pl-11 pr-12 py-3 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] text-sm placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                    >
                      {showPassword ? <EyeSlash weight="bold" className="w-4 h-4" /> : <Eye weight="bold" className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[var(--cta)] text-white font-semibold text-sm transition-all duration-300 hover:shadow-[var(--shadow-cta-glow)] active:scale-[0.98] disabled:opacity-50"
                >
                  <span>{loading ? "Signing in..." : "Sign In"}</span>
                  {!loading && <ArrowRight weight="bold" className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" />}
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[var(--surface-border)]" />
              <span className="text-[11px] text-[var(--foreground-muted)] font-medium uppercase tracking-wider">
                {isAdminMode ? "or" : "Admin?"}
              </span>
              <div className="flex-1 h-px bg-[var(--surface-border)]" />
            </div>

            {/* Toggle */}
            <button
              onClick={() => { setIsAdminMode(!isAdminMode); setError(null); }}
              className="w-full text-center text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors duration-300"
            >
              {isAdminMode ? "Sign in as Student" : "Sign in as Administrator"}
            </button>

            {/* Mock Dev Bypass Buttons */}
            <div className="space-y-2.5 pt-4 border-t border-[var(--surface-border)]">
              <div className="text-[10px] text-center font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
                Local Testing Bypass
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    document.cookie = "rit-mock-user=student; path=/; max-age=86400";
                    window.location.href = "/dashboard";
                  }}
                  className="flex-1 py-2.5 px-3 border border-[var(--surface-border)] bg-[var(--surface-subtle)] hover:bg-[var(--accent-muted)] hover:border-[var(--accent)]/30 rounded-xl text-xs font-semibold text-[var(--foreground-secondary)] hover:text-[var(--accent)] transition-all cursor-pointer"
                >
                  Test Student
                </button>
                <button
                  onClick={() => {
                    document.cookie = "rit-mock-user=admin; path=/; max-age=86400";
                    window.location.href = "/admin";
                  }}
                  className="flex-1 py-2.5 px-3 border border-[var(--surface-border)] bg-[var(--surface-subtle)] hover:bg-[var(--cta-muted)] hover:border-[var(--cta)]/30 rounded-xl text-xs font-semibold text-[var(--foreground-secondary)] hover:text-[var(--cta)] transition-all cursor-pointer"
                >
                  Test Admin
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Back to Home */}
        <motion.div variants={fadeUp} className="text-center mt-6">
          <Link href="/" className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors duration-300">
            Back to Home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
