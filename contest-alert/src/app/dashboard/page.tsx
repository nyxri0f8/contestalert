"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import {
  Lightning,
  CalendarCheck,
  Ticket,
  Trophy,
  ChartLineUp,
  Clock,
  Bell,
  MagnifyingGlass,
  SignOut,
  CaretRight,
  User,
  Sun,
  Moon,
  House,
  CalendarBlank,
  Medal,
  ListChecks,
  MapPin,
  ArrowRight,
  Sparkle,
  Target,
} from "@phosphor-icons/react";
import { useTheme } from "@/components/shared/ThemeProvider";
import { createClient } from "@/lib/supabase/client";

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT_EXPO } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

// ============================================================
// MOCK DATA
// ============================================================

const OVERVIEW_CARDS = [
  { label: "Active Events", value: "24", icon: CalendarCheck, color: "var(--accent)", change: "+3 this week" },
  { label: "Registered", value: "8", icon: Ticket, color: "var(--cta)", change: "2 upcoming" },
  { label: "Upcoming Deadlines", value: "5", icon: Clock, color: "var(--status-warning)", change: "2 urgent" },
  { label: "Achievement Points", value: "340", icon: Trophy, color: "var(--accent)", change: "Top 12%" },
];

const RECENT_EVENTS = [
  { id: "1", title: "CodeStorm Hackathon 2026", category: "Hackathon", date: "Jun 28", status: "registered", deadline: "safe" },
  { id: "2", title: "AI Workshop: Transformers", category: "Workshop", date: "Jul 5", status: "registered", deadline: "warn" },
  { id: "3", title: "RoboWars Championship", category: "Technical", date: "Jun 22", status: "open", deadline: "critical" },
];

const NAV_ITEMS = [
  { label: "Dashboard", icon: House, href: "/dashboard", active: true },
  { label: "Events", icon: CalendarBlank, href: "/events" },
  { label: "My Tickets", icon: Ticket, href: "/tickets" },
  { label: "Leaderboard", icon: Trophy, href: "/leaderboard" },
  { label: "Achievements", icon: Medal, href: "/achievements" },
  { label: "Notifications", icon: Bell, href: "/notifications", badge: 3 },
];

const DEADLINE_DOT: Record<string, string> = {
  safe: "bg-[#4CAF50]",
  warn: "bg-[#FF9800]",
  urgent: "bg-[#FF5722]",
  critical: "bg-[#D32F2F] animate-pulse",
};

// ============================================================
// SIDEBAR
// ============================================================

function Sidebar() {
  const { resolvedTheme, setTheme } = useTheme();

  async function handleSignOut() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.warn("Supabase signOut error, proceeding with mock logout:", error);
    }
    document.cookie = "rit-mock-user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "/";
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[var(--sidebar-width)] bg-[var(--surface)] border-r border-[var(--surface-border)] flex flex-col z-30 hidden lg:flex">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[var(--surface-border)]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="bg-white px-2 py-1 rounded-lg border border-neutral-100 shadow-sm flex items-center justify-center shrink-0">
            <img src="/images/logo.png" alt="RIT Logo" className="h-6 w-auto object-contain" />
          </div>
          <span className="text-[var(--surface-border)] font-normal">|</span>
          <span className="font-display font-extrabold text-[13px] tracking-tight block leading-none text-[var(--foreground)]">Contest Alert</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              item.active
                ? "bg-[var(--accent-muted)] text-[var(--accent-text)]"
                : "text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-subtle)]"
            }`}
          >
            <item.icon weight={item.active ? "duotone" : "regular"} className="w-[18px] h-[18px]" />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="w-5 h-5 rounded-full bg-[var(--cta)] text-white text-[10px] font-bold flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-[var(--surface-border)] space-y-1">
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-subtle)] transition-all duration-300"
        >
          {resolvedTheme === "dark" ? <Sun weight="regular" className="w-[18px] h-[18px]" /> : <Moon weight="regular" className="w-[18px] h-[18px]" />}
          <span>{resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium text-[var(--cta)] hover:bg-[var(--cta-muted)] transition-all duration-300"
        >
          <SignOut weight="regular" className="w-[18px] h-[18px]" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

// ============================================================
// DASHBOARD PAGE
// ============================================================

export default function DashboardPage() {
  return (
    <div className="min-h-[100dvh] bg-[var(--background)]">
      <Sidebar />

      {/* Main Content */}
      <main className="lg:ml-[var(--sidebar-width)] min-h-[100dvh]">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 glass border-b border-[var(--surface-border)]">
          <div className="flex items-center justify-between px-6 lg:px-8 py-3.5">
            <div>
              <h1 className="text-lg font-bold tracking-tight">Dashboard</h1>
              <p className="text-xs text-[var(--foreground-muted)]">Welcome back, Varun</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative hidden sm:block">
                <MagnifyingGlass weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
                <input
                  type="text" placeholder="Search events..."
                  className="pl-9 pr-4 py-2 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] text-sm w-56 placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 transition-all duration-300"
                />
              </div>
              <Link href="/notifications" className="relative w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[var(--surface-border)] transition-colors">
                <Bell weight="regular" className="w-[18px] h-[18px] text-[var(--foreground-secondary)]" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--cta)] text-white text-[9px] font-bold flex items-center justify-center">3</span>
              </Link>
              <div className="w-9 h-9 rounded-xl bg-[var(--accent-muted)] flex items-center justify-center">
                <User weight="bold" className="w-4 h-4 text-[var(--accent)]" />
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="px-6 lg:px-8 py-8 space-y-8">
          {/* Overview Cards */}
          <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {OVERVIEW_CARDS.map((card) => (
              <motion.div key={card.label} variants={fadeUp} className="card-bezel group hover:shadow-lg transition-shadow duration-300">
                <div className="card-bezel-inner p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ background: `color-mix(in srgb, ${card.color} 12%, transparent)` }}
                    >
                      <card.icon weight="duotone" className="w-5 h-5" style={{ color: card.color }} />
                    </div>
                    <span className="text-[10px] font-medium text-[var(--foreground-muted)] bg-[var(--surface-subtle)] px-2 py-0.5 rounded-full">
                      {card.change}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-2xl font-display font-bold tracking-tight" style={{ fontFamily: "var(--font-mono)" }}>
                      {card.value}
                    </div>
                    <div className="text-xs text-[var(--foreground-muted)] font-medium">{card.label}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Upcoming Events (7 cols — asymmetric) */}
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="lg:col-span-7"
            >
              <div className="card-bezel">
                <div className="card-bezel-inner">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--surface-border)]">
                    <div className="flex items-center gap-2">
                      <Sparkle weight="fill" className="w-4 h-4 text-[var(--accent)]" />
                      <h3 className="text-sm font-semibold">Upcoming Events</h3>
                    </div>
                    <Link href="/events" className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] flex items-center gap-1 transition-colors">
                      View All <CaretRight weight="bold" className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="divide-y divide-[var(--surface-border)]">
                    {RECENT_EVENTS.map((event) => (
                      <div key={event.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[var(--accent-muted)]/30 transition-colors duration-200">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${DEADLINE_DOT[event.deadline]}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{event.title}</div>
                          <div className="text-xs text-[var(--foreground-muted)] flex items-center gap-2 mt-0.5">
                            <span>{event.category}</span>
                            <span className="w-0.5 h-0.5 rounded-full bg-[var(--foreground-muted)]" />
                            <span>{event.date}</span>
                          </div>
                        </div>
                        <div>
                          {event.status === "registered" ? (
                            <span className="inline-flex px-2.5 py-1 rounded-full bg-[var(--accent-muted)] text-[var(--accent-text)] text-[10px] font-bold uppercase tracking-wider">
                              Registered
                            </span>
                          ) : (
                            <Link href={`/events/${event.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--cta)] text-white text-[10px] font-bold uppercase tracking-wider hover:shadow-[var(--shadow-cta-glow)] transition-all duration-300">
                              Register <ArrowRight weight="bold" className="w-2.5 h-2.5" />
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Achievement Progress */}
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <div className="card-bezel">
                  <div className="card-bezel-inner p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Target weight="duotone" className="w-4 h-4 text-[var(--cta)]" />
                      <h3 className="text-sm font-semibold">Next Achievement</h3>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-[var(--foreground-muted)]">Event Enthusiast</span>
                        <span className="text-xs font-mono font-bold text-[var(--accent)]">8/15</span>
                      </div>
                      <div className="h-2 bg-[var(--surface-border)] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--cta)] rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: "53%" }}
                          transition={{ duration: 1, ease: EASE_OUT_EXPO, delay: 0.3 }}
                        />
                      </div>
                      <p className="text-[11px] text-[var(--foreground-muted)] mt-2">7 more registrations to unlock</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <div className="card-bezel">
                  <div className="card-bezel-inner p-6 space-y-3">
                    <h3 className="text-sm font-semibold">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Browse Events", icon: CalendarBlank, href: "/events", color: "var(--accent)" },
                        { label: "My Tickets", icon: Ticket, href: "/tickets", color: "var(--cta)" },
                        { label: "Leaderboard", icon: Trophy, href: "/leaderboard", color: "var(--accent)" },
                        { label: "My Profile", icon: User, href: "/profile", color: "var(--foreground-secondary)" },
                      ].map((action) => (
                        <Link
                          key={action.label}
                          href={action.href}
                          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[var(--surface-border)] hover:bg-[var(--surface-subtle)] hover:border-[var(--surface-border-hover)] transition-all duration-300 active:scale-[0.97]"
                        >
                          <action.icon weight="duotone" className="w-5 h-5" style={{ color: action.color }} />
                          <span className="text-[11px] font-medium text-[var(--foreground-secondary)]">{action.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
