"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  GoogleLogo,
  ArrowRight,
  Sparkle,
  Sun,
  Moon,
  Info,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/shared/ThemeProvider";

import { Suspense } from "react";

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;

function LoginContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    if (searchParams.get("error") === "config") {
      setError(
        "Application is not configured. Contact your administrator or set Supabase environment variables."
      );
    } else if (searchParams.get("error") === "auth_callback_error") {
      setError("Sign-in failed. Please try again with your college Google account.");
    }
  }, [searchParams]);

  async function handleGoogleOAuth() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-[var(--background)] text-[var(--foreground)] relative overflow-hidden font-body transition-colors duration-500 px-4">
      
      {/* Floating Theme Switcher Option */}
      <div className="absolute top-6 right-6 z-30">
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="w-10 h-10 rounded-xl glass border border-[var(--surface-border)] flex items-center justify-center text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-subtle)] transition-all duration-300 active:scale-95 cursor-pointer shadow-sm"
          aria-label="Toggle Theme"
        >
          {resolvedTheme === "dark" ? (
            <Sun weight="light" className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon weight="light" className="w-5 h-5 text-slate-700" />
          )}
        </button>
      </div>

      {/* Background Aurora Mesh Glow Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div 
          className="absolute -top-[10%] -left-[10%] w-[80vw] h-[80vw] max-w-[800px] rounded-full bg-cyan-500/5 dark:bg-cyan-500/15 blur-[140px]"
          style={{
            animation: "aurora-drift 25s infinite alternate ease-in-out",
          }}
        />
        <div 
          className="absolute -bottom-[10%] -right-[10%] w-[70vw] h-[70vw] max-w-[700px] rounded-full bg-rose-500/5 dark:bg-rose-500/15 blur-[140px]"
          style={{
            animation: "aurora-drift-reverse 30s infinite alternate ease-in-out",
          }}
        />
      </div>

      {/* Centered Login Dock Container */}
      <div className="w-full max-w-[440px] flex flex-col items-center relative z-10 space-y-6">
        
        {/* Brand Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
          className="text-center space-y-3"
        >
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="bg-white px-3 py-2 rounded-xl border border-neutral-100 dark:border-white/10 shadow-md flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
              <img src="/images/logo.png" alt="RIT Logo" className="h-6 w-auto object-contain" />
            </div>
            <span className="text-[var(--foreground-muted)]/40 font-normal">|</span>
            <span className="font-display font-extrabold text-sm tracking-wider uppercase text-[var(--foreground-secondary)] group-hover:text-[var(--foreground)] transition-colors">
              Contest Alert
            </span>
          </Link>
        </motion.div>

        {/* Liquid Glass Card Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO, delay: 0.15 }}
          className="w-full liquid-glass p-8 rounded-[2rem] border border-[var(--surface-border)] relative overflow-hidden"
        >
          {/* Top visual accent gradient */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#76ABAE] to-[#FF5722] opacity-60" />
          
          <div className="space-y-6">
            
            {/* Header Text */}
            <div className="text-center space-y-2">
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
                Sign In
              </h2>
              <p className="text-xs text-[var(--foreground-secondary)] max-w-[300px] mx-auto leading-relaxed">
                Connect your account to access contests, tickets, and rankings
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-4 py-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-300 text-xs font-semibold border border-rose-500/20 text-center"
              >
                {error}
              </motion.div>
            )}

            {/* Google Login Option */}
            <div className="space-y-4">
              <button
                onClick={handleGoogleOAuth}
                disabled={loading}
                className="login-oauth-btn disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden flex items-center justify-center py-4 bg-[var(--surface)] text-[var(--foreground)] border border-[var(--surface-border)] rounded-xl text-sm font-semibold transition-all hover:bg-[var(--surface-subtle)] cursor-pointer"
              >
                <GoogleLogo weight="light" className="w-5 h-5 text-[var(--foreground-secondary)] group-hover:scale-110 transition-transform mr-2" />
                <span>{loading ? "Connecting..." : "Continue with Google"}</span>
                <ArrowRight weight="light" className="w-4 h-4 text-[var(--foreground-muted)] group-hover:translate-x-1 transition-transform ml-auto" />
              </button>

              {/* Instructions regarding Official College Email ID */}
              <div className="p-4 rounded-xl bg-[#76ABAE]/5 dark:bg-[#76ABAE]/10 border border-[#76ABAE]/15 dark:border-[#76ABAE]/20 flex gap-3 text-xs leading-relaxed text-[var(--foreground-secondary)] font-normal">
                <Info weight="light" className="w-5 h-5 text-[#76ABAE] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[var(--foreground)] font-semibold">Important requirement: </strong>
                  Please sign in using your official college email address (e.g., <span className="font-mono text-[#76ABAE] dark:text-[#76ABAE] font-bold">yourname@ritchennai.edu.in</span>) to authorize access.
                </div>
              </div>
            </div>

          </div>
        </motion.div>

        {/* Back to Home & Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center space-y-4"
        >
          <Link href="/" className="text-xs text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors duration-300 underline underline-offset-4">
            Back to Home
          </Link>
          <p className="text-[10px] text-[var(--foreground-muted)]">
            &copy; {new Date().getFullYear()} Rajalakshmi Institute of Technology. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
