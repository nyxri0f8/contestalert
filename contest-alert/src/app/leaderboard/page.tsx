"use client";

import { motion } from "framer-motion";
import React, { useState, useEffect, Fragment } from "react";
import Link from "next/link";
import {
  Trophy, Medal, CalendarBlank, Ticket, Bell, Lightning,
  House, Sun, Moon, SignOut, CaretUp, CaretDown, Info,
  Sparkle, ChartLineUp, SquaresFour, Fire
} from "@phosphor-icons/react";
import { useTheme } from "@/components/shared/ThemeProvider";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from "recharts";

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT_EXPO } }
};

interface DeptStats {
  department: string;
  fullName: string;
  points: number;
  registrations: number;
  attendance: number;
  wins: number;
  attendanceRate: number;
  trend: "up" | "down" | "stable";
}

const INITIAL_DEPARTMENTS: DeptStats[] = [
  { department: "CSE", fullName: "Computer Science & Engineering", points: 1450, registrations: 120, attendance: 95, wins: 12, attendanceRate: 79.1, trend: "up" },
  { department: "ECE", fullName: "Electronics & Communication Engineering", points: 1210, registrations: 95, attendance: 80, wins: 8, attendanceRate: 84.2, trend: "up" },
  { department: "AIML", fullName: "Artificial Intelligence & Machine Learning", points: 980, registrations: 72, attendance: 60, wins: 5, attendanceRate: 83.3, trend: "stable" },
  { department: "AIDS", fullName: "Artificial Intelligence & Data Science", points: 840, registrations: 65, attendance: 50, wins: 4, attendanceRate: 76.9, trend: "down" },
  { department: "CCE", fullName: "Computer & Communication Engineering", points: 520, registrations: 42, attendance: 35, wins: 2, attendanceRate: 83.3, trend: "up" },
  { department: "Biotechnology", fullName: "Biotechnology", points: 410, registrations: 35, attendance: 25, wins: 1, attendanceRate: 71.4, trend: "stable" },
  { department: "Mechanical", fullName: "Mechanical Engineering", points: 280, registrations: 22, attendance: 15, wins: 0, attendanceRate: 68.1, trend: "down" },
];

const HISTORICAL_TRENDS = [
  { name: "Week 1", CSE: 200, ECE: 150, AIML: 100, AIDS: 80 },
  { name: "Week 2", CSE: 500, ECE: 400, AIML: 300, AIDS: 250 },
  { name: "Week 3", CSE: 850, ECE: 750, AIML: 550, AIDS: 480 },
  { name: "Week 4", CSE: 1100, ECE: 980, AIML: 750, AIDS: 650 },
  { name: "Week 5", CSE: 1450, ECE: 1210, AIML: 980, AIDS: 840 },
];

// Matrix representing engagement levels in different categories
// (Value out of 10 representing engagement level for color intensity)
const HEATMAP_DATA = [
  { category: "Hackathons", CSE: 10, ECE: 6, AIML: 9, AIDS: 8, CCE: 5, BT: 2, ME: 1 },
  { category: "Workshops", CSE: 9, ECE: 8, AIML: 10, AIDS: 9, CCE: 7, BT: 6, ME: 4 },
  { category: "Symposiums", CSE: 8, ECE: 9, AIML: 7, AIDS: 6, CCE: 6, BT: 5, ME: 3 },
  { category: "Placements", CSE: 10, ECE: 9, AIML: 8, AIDS: 7, CCE: 8, BT: 7, ME: 5 },
  { category: "Sports", CSE: 5, ECE: 7, AIML: 4, AIDS: 5, CCE: 6, BT: 8, ME: 10 },
  { category: "Culturals", CSE: 7, ECE: 8, AIML: 6, AIDS: 7, CCE: 8, BT: 9, ME: 8 }
];

const NAV_ITEMS = [
  { label: "Dashboard", icon: House, href: "/dashboard" },
  { label: "Events", icon: CalendarBlank, href: "/events" },
  { label: "My Tickets", icon: Ticket, href: "/tickets" },
  { label: "Leaderboard", icon: Trophy, href: "/leaderboard", active: true },
  { label: "Achievements", icon: Medal, href: "/achievements" },
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

export default function LeaderboardPage() {
  const [departments, setDepartments] = useState<DeptStats[]>([]);

  useEffect(() => {
    // Look up winner declarations in local storage if any to recalculate scores dynamically
    const winners = JSON.parse(localStorage.getItem("rit_declared_winners") || "[]");
    const storedTickets = JSON.parse(localStorage.getItem("rit_tickets") || "[]");

    let updatedDepts = [...INITIAL_DEPARTMENTS];

    // Compute extra points based on winner declaration + local tickets registrations (using CSE/ECE etc. mock maps)
    // Simply add points here if database changes are simulated
    setDepartments(updatedDepts);
  }, []);

  const top3 = departments.slice(0, 3);
  const restDepts = departments.slice(3);

  // Heatmap block color intensity generator
  const getHeatmapColor = (value: number) => {
    if (value === 0) return "bg-[var(--surface)]";
    if (value <= 3) return "bg-[var(--accent)]/10 text-[var(--accent)]";
    if (value <= 6) return "bg-[var(--accent)]/30 text-[var(--accent)]";
    if (value <= 8) return "bg-[var(--accent)]/60 text-white";
    return "bg-[var(--accent)] text-black font-bold";
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--background)]">
      <Sidebar />
      <main className="lg:ml-[var(--sidebar-width)] min-h-[100dvh] pb-16">
        
        {/* Header */}
        <header className="sticky top-0 z-20 glass border-b border-[var(--surface-border)] px-6 lg:px-8 py-3.5">
          <div>
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Trophy weight="fill" className="text-[var(--accent)] w-5.5 h-5.5" /> Department Leaderboard
            </h1>
            <p className="text-xs text-[var(--foreground-muted)]">Real-time standings based on registration (10pts), attendance (20pts), and wins (50pts)</p>
          </div>
        </header>

        <div className="px-6 lg:px-8 py-8 space-y-8 max-w-6xl mx-auto">

          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4">
            
            {/* 2nd Place */}
            {top3[1] && (
              <motion.div 
                key="podium-2nd"
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: EASE_OUT_EXPO }}
                className="order-2 md:order-1 card-bezel"
              >
                <div className="card-bezel-inner p-6 text-center space-y-4 bg-[var(--surface-subtle)] relative border-b-4 border-b-slate-400">
                  <div className="absolute top-4 left-4 font-display font-extrabold text-slate-400/20 text-4xl">#2</div>
                  <div className="w-14 h-14 bg-slate-400/10 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <Medal weight="fill" className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg">{top3[1].department}</h3>
                    <p className="text-[10px] text-[var(--foreground-muted)] truncate">{top3[1].fullName}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-display font-extrabold text-[var(--foreground)]" style={{ fontFamily: "var(--font-mono)" }}>
                      {top3[1].points} <span className="text-xs text-[var(--foreground-muted)] font-normal">pts</span>
                    </div>
                    <div className="text-[11px] text-[var(--foreground-muted)]">
                      {top3[1].registrations} Registrations • {top3[1].wins} Wins
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 1st Place */}
            {top3[0] && (
              <motion.div 
                key="podium-1st"
                initial={{ opacity: 0, y: 40 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
                className="order-1 md:order-2 card-bezel md:-translate-y-4"
              >
                <div className="card-bezel-inner p-8 text-center space-y-4 bg-[var(--surface)] relative border-b-4 border-b-[var(--accent)] shadow-[var(--shadow-accent-glow)]/10">
                  <div className="absolute top-4 left-4 font-display font-extrabold text-[var(--accent)]/15 text-5xl">#1</div>
                  <div className="w-16 h-16 bg-[var(--accent-muted)] rounded-full flex items-center justify-center mx-auto text-[var(--accent)] animate-bounce" style={{ animationDuration: '3s' }}>
                    <Trophy weight="fill" className="w-9 h-9" />
                  </div>
                  <div>
                    <h2 className="font-display font-extrabold text-xl text-[var(--foreground)]">{top3[0].department}</h2>
                    <p className="text-xs text-[var(--foreground-muted)] truncate">{top3[0].fullName}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-display font-extrabold text-[var(--accent)]" style={{ fontFamily: "var(--font-mono)" }}>
                      {top3[0].points} <span className="text-xs text-[var(--foreground-muted)] font-normal">pts</span>
                    </div>
                    <div className="text-xs text-[var(--foreground-muted)]">
                      {top3[0].registrations} Registrations • {top3[0].wins} Wins
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 3rd Place */}
            {top3[2] && (
              <motion.div 
                key="podium-3rd"
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: EASE_OUT_EXPO }}
                className="order-3 card-bezel"
              >
                <div className="card-bezel-inner p-6 text-center space-y-4 bg-[var(--surface-subtle)] relative border-b-4 border-b-amber-700">
                  <div className="absolute top-4 left-4 font-display font-extrabold text-amber-700/20 text-4xl">#3</div>
                  <div className="w-14 h-14 bg-amber-700/10 rounded-full flex items-center justify-center mx-auto text-amber-700">
                    <Medal weight="fill" className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg">{top3[2].department}</h3>
                    <p className="text-[10px] text-[var(--foreground-muted)] truncate">{top3[2].fullName}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-display font-extrabold text-[var(--foreground)]" style={{ fontFamily: "var(--font-mono)" }}>
                      {top3[2].points} <span className="text-xs text-[var(--foreground-muted)] font-normal">pts</span>
                    </div>
                    <div className="text-[11px] text-[var(--foreground-muted)]">
                      {top3[2].registrations} Registrations • {top3[2].wins} Wins
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </div>

          {/* Leaderboard Table & Trend Charts (Bento) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Table (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-1.5"><SquaresFour weight="bold" /> Standings Table</h3>
              <div className="card-bezel overflow-hidden">
                <div className="card-bezel-inner overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[var(--surface-border)] bg-[var(--surface)] text-[var(--foreground-muted)] font-bold">
                        <th className="py-3.5 px-4 text-center w-12">Rank</th>
                        <th className="py-3.5 px-3">Department</th>
                        <th className="py-3.5 px-3 text-right">Points</th>
                        <th className="py-3.5 px-3 text-right">Registrations</th>
                        <th className="py-3.5 px-3 text-right">Attendance %</th>
                        <th className="py-3.5 px-3 text-center w-10">Trend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--surface-border)]">
                      {departments.map((d, i) => (
                        <tr key={d.department} className="hover:bg-[var(--surface-subtle)] transition-colors">
                          <td className="py-3.5 px-4 text-center font-bold font-mono">
                            {i + 1}
                          </td>
                          <td className="py-3.5 px-3 font-semibold text-[var(--foreground)]">
                            <div>{d.department}</div>
                            <div className="text-[9px] text-[var(--foreground-muted)] font-medium md:max-w-xs truncate">{d.fullName}</div>
                          </td>
                          <td className="py-3.5 px-3 text-right font-bold font-mono text-[var(--foreground)]">
                            {d.points}
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono text-[var(--foreground-secondary)]">
                            {d.registrations}
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono text-[var(--foreground-secondary)]">
                            {d.attendanceRate}%
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            {d.trend === "up" && <CaretUp weight="bold" className="w-4 h-4 text-[#4CAF50] mx-auto" />}
                            {d.trend === "down" && <CaretDown weight="bold" className="w-4 h-4 text-[#FF5722] mx-auto" />}
                            {d.trend === "stable" && <span className="block w-2 h-0.5 bg-[var(--foreground-muted)] mx-auto" />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Growth Chart (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-1.5"><ChartLineUp weight="bold" /> Weekly Point Growth</h3>
              <div className="card-bezel">
                <div className="card-bezel-inner p-5 space-y-2">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={HISTORICAL_TRENDS} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCse" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorEce" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--cta)" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="var(--cta)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--surface-border)" />
                        <XAxis dataKey="name" stroke="var(--foreground-muted)" fontSize={10} />
                        <YAxis stroke="var(--foreground-muted)" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--surface-border)' }} />
                        <Area type="monotone" dataKey="CSE" stroke="var(--accent)" fillOpacity={1} fill="url(#colorCse)" strokeWidth={2} />
                        <Area type="monotone" dataKey="ECE" stroke="var(--cta)" fillOpacity={1} fill="url(#colorEce)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 text-[10px] font-semibold text-[var(--foreground-muted)] border-t border-[var(--surface-border)] pt-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" /> CSE Track
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[var(--cta)]" /> ECE Track
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Department Heatmap Matrix */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Fire weight="fill" className="text-amber-500 w-4 h-4" /> Category Heatmap (Engagement Index)
            </h3>
            <div className="card-bezel overflow-hidden">
              <div className="card-bezel-inner overflow-x-auto p-6">
                <div className="min-w-[500px] grid grid-cols-8 gap-2.5 text-center text-xs">
                  
                  {/* Row headers (Categories) */}
                  <div className="font-semibold text-left text-[var(--foreground-secondary)] flex items-center">Category</div>
                  <div className="font-bold text-[var(--foreground-secondary)]">CSE</div>
                  <div className="font-bold text-[var(--foreground-secondary)]">ECE</div>
                  <div className="font-bold text-[var(--foreground-secondary)]">AIML</div>
                  <div className="font-bold text-[var(--foreground-secondary)]">AIDS</div>
                  <div className="font-bold text-[var(--foreground-secondary)]">CCE</div>
                  <div className="font-bold text-[var(--foreground-secondary)]">BT</div>
                  <div className="font-bold text-[var(--foreground-secondary)]">ME</div>

                  {HEATMAP_DATA.map((row) => (
                    <React.Fragment key={row.category}>
                      <div className="font-medium text-left py-2 border-b border-[var(--surface-border)] flex items-center text-[var(--foreground-muted)]">
                        {row.category}
                      </div>
                      <div className={`p-2.5 rounded-lg ${getHeatmapColor(row.CSE)}`}>{row.CSE}</div>
                      <div className={`p-2.5 rounded-lg ${getHeatmapColor(row.ECE)}`}>{row.ECE}</div>
                      <div className={`p-2.5 rounded-lg ${getHeatmapColor(row.AIML)}`}>{row.AIML}</div>
                      <div className={`p-2.5 rounded-lg ${getHeatmapColor(row.AIDS)}`}>{row.AIDS}</div>
                      <div className={`p-2.5 rounded-lg ${getHeatmapColor(row.CCE)}`}>{row.CCE}</div>
                      <div className={`p-2.5 rounded-lg ${getHeatmapColor(row.BT)}`}>{row.BT}</div>
                      <div className={`p-2.5 rounded-lg ${getHeatmapColor(row.ME)}`}>{row.ME}</div>
                    </React.Fragment>
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
