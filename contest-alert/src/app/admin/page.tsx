"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Lightning, CalendarCheck, Ticket, Trophy, Bell, SignOut,
  Users, QrCode, ClipboardText, ChartLineUp,
  House, Sun, Moon, MapPin, Sparkle, ArrowRight, IdentificationCard
} from "@phosphor-icons/react";
import { useTheme } from "@/components/shared/ThemeProvider";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from "recharts";

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT_EXPO } }
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };

// Mock overall metrics
const STATS = [
  { label: "Total Students", value: "5,102", icon: Users, color: "var(--accent)" },
  { label: "Total Registrations", value: "1,842", icon: Ticket, color: "var(--cta)" },
  { label: "Active Events", value: "14", icon: CalendarCheck, color: "var(--accent)" },
  { label: "Avg Attendance %", value: "78.4%", icon: IdentificationCard, color: "var(--status-warning)" },
];

// Department participation
const DEPT_PARTICIPATION = [
  { name: "CSE", registrations: 450, color: "#10B981" },
  { name: "ECE", registrations: 380, color: "#3B82F6" },
  { name: "AIML", registrations: 310, color: "#F59E0B" },
  { name: "AIDS", registrations: 290, color: "#EF4444" },
  { name: "CCE", registrations: 190, color: "#8B5CF6" },
  { name: "Biotech", registrations: 140, color: "#EC4899" },
  { name: "Mech", registrations: 82, color: "#6B7280" },
];

// Registrations by Event
const EVENT_REGISTRATIONS = [
  { title: "CodeStorm", registrations: 120 },
  { title: "AI Workshop", registrations: 60 },
  { title: "RoboWars", registrations: 30 },
  { title: "Prep Bootcamp", registrations: 200 },
  { title: "Rhythms Fest", registrations: 500 },
  { title: "Biotech Sym", registrations: 80 },
];

const NAV_ITEMS = [
  { label: "Admin Panel", icon: House, href: "/admin", active: true },
  { label: "Manage Events", icon: CalendarCheck, href: "/admin/events" },
  { label: "QR Scanner", icon: QrCode, href: "/admin/scanner" },
  { label: "Registrations", icon: ClipboardText, href: "/admin/registrations" },
  { label: "Winner Board", icon: Trophy, href: "/admin/winners" },
  { label: "Student Mode", icon: Users, href: "/dashboard" },
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
          <span className="font-display font-extrabold text-[13px] tracking-tight block leading-none text-[var(--foreground)]">Admin Portal</span>
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

export default function AdminDashboardPage() {
  const [recentRegs, setRecentRegs] = useState<any[]>([]);

  useEffect(() => {
    // Collect tickets/registrations in local storage if any
    const localTickets = JSON.parse(localStorage.getItem("rit_tickets") || "[]");
    setRecentRegs(localTickets.slice(-4).reverse());
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[var(--background)]">
      <Sidebar />
      <main className="lg:ml-[var(--sidebar-width)] min-h-[100dvh] pb-16">
        
        {/* Header */}
        <header className="sticky top-0 z-20 glass border-b border-[var(--surface-border)] px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Executive Dashboard</h1>
            <p className="text-xs text-[var(--foreground-muted)]">RIT College Contest Alert Command Center</p>
          </div>
          <div className="flex gap-2.5">
            <Link href="/admin/events/new" className="px-4 py-2 rounded-xl bg-[var(--cta)] hover:bg-[var(--cta-hover)] text-white text-xs font-bold transition-all shadow-[var(--shadow-cta-glow)] flex items-center gap-1.5">
              Create Event +
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="px-6 lg:px-8 py-8 space-y-8 max-w-6xl mx-auto">
          
          {/* Stats Bar */}
          <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {STATS.map((stat, i) => (
              <motion.div key={stat.label} variants={fadeUp} className="card-bezel">
                <div className="card-bezel-inner p-5 flex items-center justify-between bg-[var(--surface-subtle)]">
                  <div className="space-y-1">
                    <span className="text-xs text-[var(--foreground-muted)] font-medium">{stat.label}</span>
                    <div className="text-2xl font-display font-extrabold text-[var(--foreground)]" style={{ fontFamily: "var(--font-mono)" }}>
                      {stat.value}
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[var(--background)] border border-[var(--surface-border)]">
                    <stat.icon weight="duotone" className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Event registrations Bar (7 cols) */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="lg:col-span-7 card-bezel">
              <div className="card-bezel-inner p-6 space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-1.5"><ChartLineUp weight="bold" /> Registrations Per Event</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={EVENT_REGISTRATIONS} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--surface-border)" />
                      <XAxis dataKey="title" stroke="var(--foreground-muted)" fontSize={10} />
                      <YAxis stroke="var(--foreground-muted)" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--surface-border)' }} />
                      <Bar dataKey="registrations" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={45} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>

            {/* Department Breakdown Pie (5 cols) */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="lg:col-span-5 card-bezel">
              <div className="card-bezel-inner p-6 space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-1.5"><Users weight="bold" /> Department Breakdowns</h3>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={DEPT_PARTICIPATION}
                        cx="50%" cy="50%"
                        innerRadius={50} outerRadius={80}
                        paddingAngle={3}
                        dataKey="registrations"
                      >
                        {DEPT_PARTICIPATION.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Legend listing */}
                  <div className="space-y-1.5 shrink-0 pl-2 text-[10px] font-medium text-[var(--foreground-secondary)]">
                    {DEPT_PARTICIPATION.slice(0, 5).map((entry) => (
                      <div key={entry.name} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span>{entry.name}: {entry.registrations}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

          </div>

          {/* Bottom Bento Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Quick action grid (5 cols) */}
            <div className="lg:col-span-5 card-bezel">
              <div className="card-bezel-inner p-6 space-y-4">
                <h3 className="text-sm font-semibold">Administrative Quick Commands</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Manage Events", icon: CalendarCheck, href: "/admin/events", color: "var(--accent)" },
                    { label: "QR Attendance", icon: QrCode, href: "/admin/scanner", color: "var(--cta)" },
                    { label: "Registrations", icon: ClipboardText, href: "/admin/registrations", color: "var(--accent)" },
                    { label: "Declare Winners", icon: Trophy, href: "/admin/winners", color: "var(--foreground-secondary)" },
                  ].map((act) => (
                    <Link key={act.label} href={act.href}
                      className="flex flex-col items-center gap-2 p-5 rounded-xl border border-[var(--surface-border)] hover:bg-[var(--surface-subtle)] hover:border-[var(--surface-border-hover)] transition-all duration-300">
                      <act.icon weight="duotone" className="w-6 h-6" style={{ color: act.color }} />
                      <span className="text-xs font-semibold text-[var(--foreground-secondary)]">{act.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Registrations Log (7 cols) */}
            <div className="lg:col-span-7 card-bezel">
              <div className="card-bezel-inner">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--surface-border)]">
                  <div className="flex items-center gap-2">
                    <Sparkle weight="fill" className="w-4 h-4 text-[var(--accent)]" />
                    <h3 className="text-sm font-semibold">Recent Platform Registrations</h3>
                  </div>
                  <Link href="/admin/registrations" className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] flex items-center gap-1 transition-colors">
                    View Logs <ArrowRight weight="bold" className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="divide-y divide-[var(--surface-border)]">
                  {recentRegs.length > 0 ? (
                    recentRegs.map((reg) => (
                      <div key={reg.id} className="flex items-center justify-between px-6 py-4 hover:bg-[var(--accent-muted)]/20 transition-colors">
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold">{reg.title}</div>
                          <div className="text-[10px] text-[var(--foreground-muted)]">
                            Ticket: {reg.id} • Registered on: {reg.registeredAt}
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-[var(--accent)] bg-[var(--accent-muted)] px-2 py-0.5 rounded-full border border-[var(--accent)]/15">
                          {reg.teamName ? "Team" : "Individual"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-xs text-[var(--foreground-muted)]">
                      No registrations recorded yet.
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
