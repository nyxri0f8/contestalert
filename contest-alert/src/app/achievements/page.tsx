"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Trophy, Medal, CalendarBlank, Ticket, Bell, Lightning,
  House, Sun, Moon, SignOut, CheckCircle, Lock,
  Star, Sparkle, Clock, ListChecks
} from "@phosphor-icons/react";
import { useTheme } from "@/components/shared/ThemeProvider";

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT_EXPO } }
};

interface BadgeType {
  id: string;
  name: string;
  description: string;
  threshold: number;
  icon: string;
  color: string;
  earned: boolean;
}

const BADGES_CONFIG: BadgeType[] = [
  { id: "explorer", name: "Event Explorer", description: "Register for at least 1 event", threshold: 1, icon: "🥉", color: "from-amber-700 to-amber-900 border-amber-600", earned: false },
  { id: "enthusiast", name: "Event Enthusiast", description: "Register for 3 or more events", threshold: 3, icon: "🥈", color: "from-slate-300 to-slate-500 border-slate-400", earned: false },
  { id: "champion", name: "Event Champion", description: "Register for 5 or more events", threshold: 5, icon: "🥇", color: "from-yellow-400 to-yellow-600 border-yellow-500", earned: false },
  { id: "legend", name: "Campus Legend", description: "Register for 8 or more events", threshold: 8, icon: "🏆", color: "from-[var(--accent)] to-[var(--cta)] border-[var(--accent)]", earned: false },
];

const MOCK_HISTORY = [
  { id: "1", title: "WebDev Hackathon 2025", date: "Dec 12, 2025", points: 30, status: "runner_up", type: "Hackathon" },
  { id: "2", title: "ReactJS Advanced Seminar", date: "Jan 18, 2026", points: 20, status: "attended", type: "Workshop" },
  { id: "3", title: "National Cyber Security Symposium", date: "Feb 22, 2026", points: 50, status: "winner", type: "Symposium" },
  { id: "4", title: "IoT Innovation Expo", date: "Mar 10, 2026", points: 10, status: "registered", type: "Technical" }
];

const NAV_ITEMS = [
  { label: "Dashboard", icon: House, href: "/dashboard" },
  { label: "Events", icon: CalendarBlank, href: "/events" },
  { label: "My Tickets", icon: Ticket, href: "/tickets" },
  { label: "Leaderboard", icon: Trophy, href: "/leaderboard" },
  { label: "Achievements", icon: Medal, href: "/achievements", active: true },
  { label: "Notifications", icon: Bell, href: "/notifications", badge: 3 },
];

function Sidebar() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[var(--sidebar-width)] bg-[var(--surface)] border-r border-[var(--surface-border)] flex flex-col z-30 hidden lg:flex">
      <div className="px-6 py-5 border-b border-[var(--surface-border)]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="bg-white px-2 py-1 rounded-lg border border-neutral-100 shadow-sm flex items-center justify-center shrink-0">
            <img src="/images/logo.png" alt="RIT Logo" className="h-6 w-auto object-contain" />
          </div>
          <span className="text-[var(--surface-border)] font-normal">|</span>
          <span className="font-display font-extrabold text-[13px] tracking-tight block leading-none text-[var(--foreground)]">Contest Alert</span>
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <Link key={item.label} href={item.href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-300 ${
              item.active ? "bg-[var(--accent-muted)] text-[var(--accent-text)]" : "text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-subtle)]"
            }`}>
            <item.icon weight={item.active ? "duotone" : "regular"} className="w-[18px] h-[18px]" />
            <span className="flex-1">{item.label}</span>
            {item.badge && <span className="w-5 h-5 rounded-full bg-[var(--cta)] text-white text-[10px] font-bold flex items-center justify-center">{item.badge}</span>}
          </Link>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-[var(--surface-border)] space-y-1">
        <button onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium text-[var(--foreground-secondary)] hover:bg-[var(--surface-subtle)] transition-all duration-300">
          {resolvedTheme === "dark" ? <Sun weight="regular" className="w-[18px] h-[18px]" /> : <Moon weight="regular" className="w-[18px] h-[18px]" />}
          <span>{resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>
      </div>
    </aside>
  );
}

export default function AchievementsPage() {
  const [totalRegs, setTotalRegs] = useState(0);
  const [badges, setBadges] = useState<BadgeType[]>(BADGES_CONFIG);
  const [totalPoints, setTotalPoints] = useState(110); // Base mock points

  useEffect(() => {
    // Read registered tickets
    const tickets = JSON.parse(localStorage.getItem("rit_tickets") || "[]");
    const count = tickets.length;
    setTotalRegs(count);

    // Dynamic points: base (110) + registrations * 10
    setTotalPoints(110 + (count * 10));

    // Evaluate badge earning status
    const updated = BADGES_CONFIG.map(b => ({
      ...b,
      earned: count >= b.threshold
    }));
    setBadges(updated);
  }, []);

  const getStatusStyle = (status: string) => {
    return {
      winner: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      runner_up: "text-slate-400 bg-slate-400/10 border-slate-400/20",
      attended: "text-[var(--accent)] bg-[var(--accent-muted)] border-[var(--accent)]/10",
      registered: "text-[var(--foreground-secondary)] bg-[var(--surface)] border-[var(--surface-border)]"
    }[status] || "text-neutral-500";
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--background)]">
      <Sidebar />
      <main className="lg:ml-[var(--sidebar-width)] min-h-[100dvh] pb-16">
        
        {/* Header */}
        <header className="sticky top-0 z-20 glass border-b border-[var(--surface-border)] px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Achievements</h1>
            <p className="text-xs text-[var(--foreground-muted)]">Track points, unlock badges, and view participation timeline</p>
          </div>
        </header>

        <div className="px-6 lg:px-8 py-8 space-y-8 max-w-5xl mx-auto">
          
          {/* Summary Bento Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* points card */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="card-bezel md:col-span-2">
              <div className="card-bezel-inner p-6 flex items-center justify-between bg-gradient-to-br from-[var(--surface)] to-[var(--accent-muted)]/10">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)] font-semibold uppercase tracking-wider">
                    <Sparkle className="text-[var(--accent)] w-4.5 h-4.5 animate-spin" style={{ animationDuration: '4s' }} /> Total Achievement Points
                  </div>
                  <h2 className="text-4xl font-display font-extrabold text-[var(--foreground)]" style={{ fontFamily: "var(--font-mono)" }}>
                    {totalPoints} <span className="text-xs text-[var(--foreground-muted)] font-normal">Points</span>
                  </h2>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    Earned from {totalRegs} registered events and campus victories.
                  </p>
                </div>
                <div className="w-16 h-16 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)]">
                  <Trophy weight="fill" className="w-8 h-8" />
                </div>
              </div>
            </motion.div>

            {/* registrations card */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="card-bezel">
              <div className="card-bezel-inner p-6 flex flex-col justify-between h-full bg-[var(--surface-subtle)]">
                <div className="text-xs text-[var(--foreground-muted)] font-semibold uppercase tracking-wider">
                  Event Registrations
                </div>
                <div className="text-4xl font-display font-extrabold text-[var(--foreground)] py-2" style={{ fontFamily: "var(--font-mono)" }}>
                  {totalRegs}
                </div>
                <div className="h-1.5 bg-[var(--surface-border)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--cta)]" style={{ width: `${Math.min(100, (totalRegs / 8) * 100)}%` }} />
                </div>
                <div className="text-[10px] text-[var(--foreground-muted)] mt-1">
                  {totalRegs >= 8 ? "Legend badge unlocked!" : `${8 - totalRegs} registrations remaining for Legend status`}
                </div>
              </div>
            </motion.div>

          </div>

          {/* Badges Grid */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-1.5"><Medal weight="bold" /> Achievement Badges</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {badges.map((badge) => (
                <motion.div 
                  key={badge.id}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className={`card-bezel overflow-hidden relative group ${!badge.earned ? 'opacity-50' : ''}`}
                >
                  <div className={`card-bezel-inner p-6 text-center space-y-4 bg-[var(--surface-subtle)]`}>
                    
                    {/* Badge Icon */}
                    <div className="relative">
                      <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl shadow-md bg-gradient-to-br ${badge.earned ? badge.color : 'bg-neutral-800 border-neutral-700'}`}>
                        {badge.earned ? badge.icon : <Lock weight="bold" className="w-6 h-6 text-neutral-500" />}
                      </div>
                      {badge.earned && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#4CAF50] rounded-full flex items-center justify-center border border-[var(--surface)]">
                          <CheckCircle weight="fill" className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="font-display font-bold text-sm text-[var(--foreground)]">{badge.name}</h4>
                      <p className="text-[11px] text-[var(--foreground-muted)] mt-1">{badge.description}</p>
                    </div>

                    <div className="pt-2 border-t border-[var(--surface-border)]">
                      <span className="inline-block text-[9px] font-semibold text-[var(--foreground-muted)] uppercase tracking-wider bg-[var(--surface)] px-2 py-0.5 rounded-full">
                        Threshold: {badge.threshold} Reg
                      </span>
                    </div>

                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Timeline of Achievements */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-1.5"><Clock weight="bold" /> Event Participation History</h3>
            
            <div className="card-bezel overflow-hidden">
              <div className="card-bezel-inner p-6 space-y-6">
                
                <div className="relative border-l border-[var(--surface-border)] ml-3 pl-6 space-y-8">
                  {MOCK_HISTORY.map((hist, idx) => (
                    <div key={hist.id} className="relative">
                      
                      {/* Timeline dot */}
                      <span className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-[var(--accent)] border border-[var(--background)] ring-4 ring-[var(--surface-subtle)]" />
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-[var(--foreground-muted)] flex items-center gap-2">
                            <span>{hist.type}</span>
                            <span className="w-1 h-1 rounded-full bg-[var(--foreground-muted)]" />
                            <span>{hist.date}</span>
                          </div>
                          <h4 className="text-sm font-bold text-[var(--foreground)]">{hist.title}</h4>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getStatusStyle(hist.status)}`}>
                            {hist.status.replace("_", " ")}
                          </span>
                          <span className="font-mono text-xs font-bold text-[var(--accent)]">
                            +{hist.points} pts
                          </span>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
