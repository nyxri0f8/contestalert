"use client";

import {
  Lightning,
  CalendarCheck,
  CalendarBlank,
  Ticket,
  Trophy,
  Medal,
  ChartLineUp,
  Clock,
  Bell,
  MagnifyingGlass,
  CaretRight,
  User,
  MapPin,
  ArrowRight,
  Sparkle,
  Target,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/shared/Sidebar";

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT_EXPO } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const DEADLINE_DOT: Record<string, string> = {
  safe: "bg-[#4CAF50]",
  warn: "bg-[#FF9800]",
  urgent: "bg-[#FF5722]",
  critical: "bg-[#D32F2F] animate-pulse",
};
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";

// ============================================================
// DASHBOARD PAGE
// ============================================================

export default function DashboardPage() {
  const [userName, setUserName] = useState("Student");
  const [overviewCards, setOverviewCards] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [nextBadge, setNextBadge] = useState<any>({ name: "Event Explorer", earned: 0, target: 1 });

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Fetch Profile Info
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profile) {
          setUserName(profile.name.split(" ")[0]);
        }

        // 2. Fetch Active Events count
        const { count: activeCount } = await supabase
          .from("events")
          .select("id", { count: "exact", head: true })
          .eq("status", "active");

        // 3. Fetch Registered Events
        const { data: registrations } = await supabase
          .from("registrations")
          .select("*, events(*)")
          .eq("user_id", user.id);

        const registeredCount = registrations?.length || 0;

        // 4. Calculate deadlines & upcoming events
        let upcomingDeadlines = 0;
        const upcomingEvents: any[] = [];

        if (registrations) {
          registrations.forEach((r: any) => {
            const ev = r.events;
            if (ev) {
              const deadlineDate = new Date(ev.deadline);
              const diff = deadlineDate.getTime() - Date.now();
              if (diff > 0) {
                upcomingEvents.push({
                  id: ev.id,
                  title: ev.title,
                  category: ev.category,
                  date: new Date(ev.event_date).toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
                  status: "registered",
                  deadline: diff < 86400000 ? "critical" : diff < 86400000 * 3 ? "warn" : "safe"
                });
                if (diff < 86400000 * 3) {
                  upcomingDeadlines++;
                }
              }
            }
          });
        }

        // 5. If upcoming events count is less than 3, fill with unregistered active events
        if (upcomingEvents.length < 3) {
          const registeredIds = registrations?.map((r: any) => r.event_id) || [];
          const { data: availableEvents } = await supabase
            .from("events")
            .select("*")
            .eq("status", "active")
            .order("event_date", { ascending: true });

          if (availableEvents) {
            const filteredUnregistered = availableEvents.filter((e: any) => !registeredIds.includes(e.id));
            filteredUnregistered.forEach((ev: any) => {
              if (upcomingEvents.length < 3) {
                const deadlineDate = new Date(ev.deadline);
                const diff = deadlineDate.getTime() - Date.now();
                upcomingEvents.push({
                  id: ev.id,
                  title: ev.title,
                  category: ev.category,
                  date: new Date(ev.event_date).toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
                  status: "open",
                  deadline: diff < 0 ? "critical" : diff < 86400000 ? "urgent" : diff < 86400000 * 3 ? "warn" : "safe"
                });
              }
            });
          }
        }

        setRecentEvents(upcomingEvents.slice(0, 3));

        // 6. Set Overview Cards
        setOverviewCards([
          { label: "Active Events", value: (activeCount || 0).toString(), icon: CalendarCheck, color: "var(--accent)", change: "Updated live" },
          { label: "Registered", value: registeredCount.toString(), icon: Ticket, color: "var(--cta)", change: `${upcomingEvents.filter(e => e.status === "registered").length} upcoming` },
          { label: "Upcoming Deadlines", value: upcomingDeadlines.toString(), icon: Clock, color: "var(--status-warning)", change: "Less than 3 days" },
          { label: "Achievement Points", value: (profile?.achievement_points || 0).toString(), icon: Trophy, color: "var(--accent)", change: `Earned` },
        ]);

        // 7. Calculate unread notifications count
        const { count: uCount } = await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false);

        setUnreadCount(uCount || 0);

        // 8. Next badge calculation
        const badgesConfig = [
          { name: "Event Explorer", threshold: 1 },
          { name: "Event Enthusiast", threshold: 3 },
          { name: "Event Champion", threshold: 5 },
          { name: "Campus Legend", threshold: 8 },
        ];
        const next = badgesConfig.find(b => registeredCount < b.threshold) || badgesConfig[badgesConfig.length - 1];
        setNextBadge({
          name: next.name,
          earned: registeredCount,
          target: next.threshold
        });

      } catch (err) {
        console.error("Error loading dashboard details:", err);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <div className="min-h-[100dvh] bg-transparent">
      <Sidebar />

      {/* Main Content */}
      <main className="lg:ml-[var(--sidebar-width)] min-h-[100dvh]">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 glass border-b border-[var(--surface-border)]">
          <div className="flex items-center justify-between px-6 lg:px-8 py-3.5">
            <div>
              <h1 className="text-lg font-bold tracking-tight">Dashboard</h1>
              <p className="text-xs text-[var(--foreground-muted)]">Welcome back, {userName}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative hidden sm:block">
                <MagnifyingGlass weight="light" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
                <input
                  type="text" placeholder="Search events..."
                  className="pl-9 pr-4 py-2 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] text-sm w-56 placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 transition-all duration-300"
                />
              </div>
              <Link href="/notifications" className="relative w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[var(--surface-border)] transition-colors">
                <Bell weight="light" className="w-[18px] h-[18px] text-[var(--foreground-secondary)]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--cta)] text-white text-[9px] font-bold flex items-center justify-center">{unreadCount}</span>
                )}
              </Link>
              <div className="w-9 h-9 rounded-xl bg-[var(--accent-muted)] flex items-center justify-center">
                <User weight="light" className="w-4 h-4 text-[var(--accent)]" />
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="px-6 lg:px-8 py-8 space-y-8">
          {/* Overview Cards */}
          <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {overviewCards.map((card) => (
              <motion.div key={card.label} variants={fadeUp} className="card-bezel group hover:shadow-lg transition-shadow duration-300">
                <div className="card-bezel-inner p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ background: `color-mix(in srgb, ${card.color} 12%, transparent)` }}
                    >
                      <card.icon weight="light" className="w-5 h-5" style={{ color: card.color }} />
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
                      <Sparkle weight="light" className="w-4 h-4 text-[var(--accent)]" />
                      <h3 className="text-sm font-semibold">Upcoming Events</h3>
                    </div>
                    <Link href="/events" className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] flex items-center gap-1 transition-colors">
                      View All <CaretRight weight="light" className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="divide-y divide-[var(--surface-border)]">
                    {recentEvents.length > 0 ? (
                      recentEvents.map((event) => (
                        <div key={event.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[var(--accent-muted)]/30 transition-colors duration-200">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${DEADLINE_DOT[event.deadline] || "bg-[#4CAF50]"}`} />
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
                                Register <ArrowRight weight="light" className="w-2.5 h-2.5" />
                              </Link>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-xs text-[var(--foreground-muted)]">
                        No upcoming events found.
                      </div>
                    )}
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
                      <Target weight="light" className="w-4 h-4 text-[var(--cta)]" />
                      <h3 className="text-sm font-semibold">Next Achievement</h3>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-[var(--foreground-muted)]">{nextBadge.name}</span>
                        <span className="text-xs font-mono font-bold text-[var(--accent)]">{nextBadge.earned}/{nextBadge.target}</span>
                      </div>
                      <div className="h-2 bg-[var(--surface-border)] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--cta)] rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (nextBadge.earned / nextBadge.target) * 100)}%` }}
                          transition={{ duration: 1, ease: EASE_OUT_EXPO, delay: 0.3 }}
                        />
                      </div>
                      <p className="text-[11px] text-[var(--foreground-muted)] mt-2">
                        {nextBadge.target - nextBadge.earned > 0 
                          ? `${nextBadge.target - nextBadge.earned} more registrations to unlock` 
                          : "Max badge rank reached!"}
                      </p>
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
                        { label: "Achievements", icon: Medal, href: "/achievements", color: "var(--foreground-secondary)" },
                      ].map((action) => (
                        <Link
                          key={action.label}
                          href={action.href}
                          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[var(--surface-border)] hover:bg-[var(--surface-subtle)] hover:border-[var(--surface-border-hover)] transition-all duration-300 active:scale-[0.97]"
                        >
                          <action.icon weight="light" className="w-5 h-5" style={{ color: action.color }} />
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
