"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Trophy,
  Medal,
  CheckCircle,
  Lock,
  Sparkle,
  Clock,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/shared/Sidebar";

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT_EXPO } },
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
  {
    id: "explorer",
    name: "Event Explorer",
    description: "Register for at least 1 event",
    threshold: 1,
    icon: "🥉",
    color: "from-amber-700 to-amber-900 border-amber-600",
    earned: false,
  },
  {
    id: "enthusiast",
    name: "Event Enthusiast",
    description: "Register for 3 or more events",
    threshold: 3,
    icon: "🥈",
    color: "from-slate-300 to-slate-500 border-slate-400",
    earned: false,
  },
  {
    id: "champion",
    name: "Event Champion",
    description: "Register for 5 or more events",
    threshold: 5,
    icon: "🥇",
    color: "from-yellow-400 to-yellow-600 border-yellow-500",
    earned: false,
  },
  {
    id: "legend",
    name: "Campus Legend",
    description: "Register for 8 or more events",
    threshold: 8,
    icon: "🏆",
    color: "from-[var(--accent)] to-[var(--cta)] border-[var(--accent)]",
    earned: false,
  },
];

export default function AchievementsPage() {
  const [totalRegs, setTotalRegs] = useState(0);
  const [badges, setBadges] = useState<BadgeType[]>(BADGES_CONFIG);
  const [totalPoints, setTotalPoints] = useState(0);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    async function loadAchievements() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Fetch points from profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("achievement_points")
          .eq("id", user.id)
          .single();

        setTotalPoints(profile?.achievement_points || 0);

        // 2. Fetch participation history
        const { data: regs } = await supabase
          .from("registrations")
          .select(`
            id,
            registered_at,
            events(id, title, category, event_date),
            attendance(checked_in_at)
          `)
          .eq("user_id", user.id);

        if (regs) {
          setTotalRegs(regs.length);

          // Unlocked badges
          const updated = BADGES_CONFIG.map((b) => ({
            ...b,
            earned: regs.length >= b.threshold,
          }));
          setBadges(updated);

          // Get winners info separately for mapping
          const { data: wins } = await supabase
            .from("winners")
            .select("event_id, position")
            .eq("user_id", user.id);

          const winMap = new Map(wins?.map((w: any) => [w.event_id, w.position]) || []);

          // Map history
          const parsed = regs.map((r: any) => {
            const ev = Array.isArray(r.events) ? r.events[0] : (r.events as any);
            const winStatus = ev ? (winMap.get(ev.id) as string | null) : null;
            const hasAttended = r.attendance
              ? Array.isArray(r.attendance)
                ? r.attendance.length > 0
                : true
              : false;

            let status = "registered";
            let pts = 10;

            if (winStatus) {
              status = winStatus;
              pts = winStatus === "winner" ? 50 : winStatus === "runner_up" ? 30 : 10;
            } else if (hasAttended) {
              status = "attended";
              pts = 20;
            }

            return {
              id: r.id,
              title: ev?.title || "Event",
              date: new Date(ev?.event_date || r.registered_at).toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
              }),
              points: pts,
              status: status,
              type: ev?.category || "Contest",
            };
          });

          setHistory(parsed);
        }
      } catch (err) {
        console.error("Failed to load achievements page details:", err);
      }
    }
    loadAchievements();
  }, []);

  const getStatusStyle = (status: string) => {
    return (
      {
        winner: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        runner_up: "text-slate-400 bg-slate-400/10 border-slate-400/20",
        attended: "text-[var(--accent)] bg-[var(--accent-muted)] border-[var(--accent)]/10",
        registered: "text-[var(--foreground-secondary)] bg-[var(--surface)] border-[var(--surface-border)]",
      } as Record<string, string>
    )[status] || "text-neutral-500";
  };

  return (
    <div className="min-h-[100dvh] bg-transparent">
      <Sidebar />
      <main className="lg:ml-[var(--sidebar-width)] min-h-[100dvh] pb-16">
        {/* Header */}
        <header className="sticky top-0 z-20 glass border-b border-[var(--surface-border)] px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Achievements</h1>
            <p className="text-xs text-[var(--foreground-muted)]">
              Track points, unlock badges, and view participation timeline
            </p>
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
                    <Sparkle
                      className="text-[var(--accent)] w-4.5 h-4.5 animate-spin"
                      style={{ animationDuration: "4s" }}
                    />{" "}
                    Total Achievement Points
                  </div>
                  <h2
                    className="text-4xl font-display font-extrabold text-[var(--foreground)]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {totalPoints} <span className="text-xs text-[var(--foreground-muted)] font-normal">Points</span>
                  </h2>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    Earned from {totalRegs} registered events and campus victories.
                  </p>
                </div>
                <div className="w-16 h-16 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)]">
                  <Trophy weight="light" className="w-8 h-8" />
                </div>
              </div>
            </motion.div>

            {/* registrations card */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="card-bezel">
              <div className="card-bezel-inner p-6 flex flex-col justify-between h-full bg-[var(--surface-subtle)]">
                <div className="text-xs text-[var(--foreground-muted)] font-semibold uppercase tracking-wider">
                  Event Registrations
                </div>
                <div
                  className="text-4xl font-display font-extrabold text-[var(--foreground)] py-2"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {totalRegs}
                </div>
                <div className="h-1.5 bg-[var(--surface-border)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--cta)]"
                    style={{ width: `${Math.min(100, (totalRegs / 8) * 100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-[var(--foreground-muted)] mt-1">
                  {totalRegs >= 8 ? "Legend badge unlocked!" : `${8 - totalRegs} registrations remaining for Legend status`}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Badges Grid */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Medal weight="light" className="w-4.5 h-4.5" /> Achievement Badges
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {badges.map((badge) => (
                <motion.div
                  key={badge.id}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className={`card-bezel overflow-hidden relative group ${!badge.earned ? "opacity-50" : ""}`}
                >
                  <div className={`card-bezel-inner p-6 text-center space-y-4 bg-[var(--surface-subtle)]`}>
                    {/* Badge Icon */}
                    <div className="relative">
                      <div
                        className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl shadow-md bg-gradient-to-br ${
                          badge.earned ? badge.color : "bg-neutral-800 border-neutral-700"
                        }`}
                      >
                        {badge.earned ? badge.icon : <Lock weight="light" className="w-6 h-6 text-neutral-500" />}
                      </div>
                      {badge.earned && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#4CAF50] rounded-full flex items-center justify-center border border-[var(--surface)]">
                          <CheckCircle weight="light" className="w-3.5 h-3.5 text-white" />
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
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Clock weight="light" className="w-4.5 h-4.5" /> Event Participation History
            </h3>

            <div className="card-bezel overflow-hidden">
              <div className="card-bezel-inner p-6 space-y-6">
                <div className="relative border-l border-[var(--surface-border)] ml-3 pl-6 space-y-8">
                  {history.length > 0 ? (
                    history.map((hist, idx) => (
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
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getStatusStyle(
                                hist.status
                              )}`}
                            >
                              {hist.status.replace("_", " ")}
                            </span>
                            <span className="font-mono text-xs font-bold text-[var(--accent)]">+{hist.points} pts</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-xs text-[var(--foreground-muted)]">
                      No event participation recorded yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
