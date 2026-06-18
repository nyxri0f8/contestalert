"use client";

import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import {
  Trophy,
  Medal,
  CaretUp,
  CaretDown,
  Sparkle,
  ChartLineUp,
  SquaresFour,
  Fire,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Sidebar } from "@/components/shared/Sidebar";

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;

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

export default function LeaderboardPage() {
  const [departments, setDepartments] = useState<DeptStats[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);

  useEffect(() => {
    async function loadLeaderboardData() {
      try {
        const supabase = createClient();

        // 1. Fetch rankings
        const { data: dbLeaderboard } = await supabase.rpc("get_department_leaderboard");

        const deptNames: Record<string, string> = {
          CSE: "Computer Science & Engineering",
          ECE: "Electronics & Communication Engineering",
          AIML: "Artificial Intelligence & Machine Learning",
          AIDS: "Artificial Intelligence & Data Science",
          CCE: "Computer & Communication Engineering",
          Biotechnology: "Biotechnology",
          Mechanical: "Mechanical Engineering",
        };

        const parsedDepts = (dbLeaderboard || []).map((d: any) => ({
          department: d.department,
          fullName: deptNames[d.department] || d.department,
          points: parseInt(d.total_points) || 0,
          registrations: parseInt(d.total_registrations) || 0,
          attendance: parseInt(d.total_attendance) || 0,
          wins: parseInt(d.total_wins) || 0,
          attendanceRate: parseFloat(d.attendance_rate) || 0,
          trend: "stable" as const,
        }));

        parsedDepts.sort((a: any, b: any) => b.points - a.points);
        setDepartments(parsedDepts);

        // 2. Fetch registrations for weekly progress & heatmap
        const { data: regs } = await supabase.from("registrations").select(`
            registered_at,
            profiles(department),
            events(category)
          `);

        if (regs) {
          const categories = ["hackathon", "workshop", "symposium", "placement", "sports", "cultural"];
          const depts = ["CSE", "ECE", "AIML", "AIDS", "CCE", "Biotechnology", "Mechanical"];

          const categoryLabels: Record<string, string> = {
            hackathon: "Hackathons",
            workshop: "Workshops",
            symposium: "Symposiums",
            placement: "Placements",
            sports: "Sports",
            cultural: "Culturals",
          };

          const heatmap = categories.map((cat) => {
            const row: any = { category: categoryLabels[cat] || cat };
            depts.forEach((d) => {
              const count = regs.filter((r: any) => {
                const profile: any = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
                const event: any = Array.isArray(r.events) ? r.events[0] : r.events;
                return profile?.department === d && event?.category === cat;
              }).length;
              const cellKey = d === "Biotechnology" ? "BT" : d === "Mechanical" ? "ME" : d;
              row[cellKey] = count;
            });
            return row;
          });
          setHeatmapData(heatmap);

          const weeklyMap: Record<string, Record<string, number>> = {
            "Week 1": { CSE: 0, ECE: 0, AIML: 0, AIDS: 0, CCE: 0, BT: 0, ME: 0 },
            "Week 2": { CSE: 0, ECE: 0, AIML: 0, AIDS: 0, CCE: 0, BT: 0, ME: 0 },
            "Week 3": { CSE: 0, ECE: 0, AIML: 0, AIDS: 0, CCE: 0, BT: 0, ME: 0 },
            "Week 4": { CSE: 0, ECE: 0, AIML: 0, AIDS: 0, CCE: 0, BT: 0, ME: 0 },
          };

          regs.forEach((r: any) => {
            const profile: any = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
            const d = profile?.department;
            if (d) {
              const regDate = new Date(r.registered_at);
              const diffDays = Math.floor((Date.now() - regDate.getTime()) / (1000 * 86400));
              let weekKey = "Week 4";
              if (diffDays > 21) weekKey = "Week 1";
              else if (diffDays > 14) weekKey = "Week 2";
              else if (diffDays > 7) weekKey = "Week 3";

              const key = d === "Biotechnology" ? "BT" : d === "Mechanical" ? "ME" : d;
              if (weeklyMap[weekKey] && weeklyMap[weekKey][key] !== undefined) {
                weeklyMap[weekKey][key] += 10;
              }
            }
          });

          const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"];
          const accumulatedTrends = weeks.map((w, idx) => {
            const row: any = { name: w };
            ["CSE", "ECE", "AIML", "AIDS", "CCE", "BT", "ME"].forEach((d) => {
              let pts = 0;
              for (let i = 0; i <= idx; i++) {
                pts += weeklyMap[weeks[i]][d] || 0;
              }
              row[d] = pts;
            });
            return row;
          });
          setTrends(accumulatedTrends);
        }
      } catch (err) {
        console.error("Failed to load leaderboard details:", err);
      }
    }

    loadLeaderboardData();
  }, []);

  const top3 = departments.slice(0, 3);

  // Heatmap block color intensity generator
  const getHeatmapColor = (value: number) => {
    if (value === 0) return "bg-[var(--surface)]";
    if (value <= 3) return "bg-[var(--accent)]/10 text-[var(--accent)]";
    if (value <= 6) return "bg-[var(--accent)]/30 text-[var(--accent)]";
    if (value <= 8) return "bg-[var(--accent)]/60 text-white";
    return "bg-[var(--accent)] text-black font-bold";
  };

  return (
    <div className="min-h-[100dvh] bg-transparent">
      <Sidebar />
      <main className="lg:ml-[var(--sidebar-width)] min-h-[100dvh] pb-16">
        {/* Header */}
        <header className="sticky top-0 z-20 glass border-b border-[var(--surface-border)] px-6 lg:px-8 py-3.5">
          <div>
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Trophy weight="light" className="text-[var(--accent)] w-5.5 h-5.5" /> Department Leaderboard
            </h1>
            <p className="text-xs text-[var(--foreground-muted)]">
              Real-time standings based on registration (10pts), attendance (20pts), and wins (50pts)
            </p>
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
                  <div className="absolute top-4 left-4 font-display font-extrabold text-slate-400/20 text-4xl">
                    #2
                  </div>
                  <div className="w-14 h-14 bg-slate-400/10 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <Medal weight="light" className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg">{top3[1].department}</h3>
                    <p className="text-[10px] text-[var(--foreground-muted)] truncate">{top3[1].fullName}</p>
                  </div>
                  <div className="space-y-1">
                    <div
                      className="text-2xl font-display font-extrabold text-[var(--foreground)]"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
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
                  <div className="absolute top-4 left-4 font-display font-extrabold text-[var(--accent)]/15 text-5xl">
                    #1
                  </div>
                  <div
                    className="w-16 h-16 bg-[var(--accent-muted)] rounded-full flex items-center justify-center mx-auto text-[var(--accent)] animate-bounce"
                    style={{ animationDuration: "3s" }}
                  >
                    <Trophy weight="light" className="w-9 h-9" />
                  </div>
                  <div>
                    <h2 className="font-display font-extrabold text-xl text-[var(--foreground)]">
                      {top3[0].department}
                    </h2>
                    <p className="text-xs text-[var(--foreground-muted)] truncate">{top3[0].fullName}</p>
                  </div>
                  <div className="space-y-1">
                    <div
                      className="text-3xl font-display font-extrabold text-[var(--accent)]"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
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
                  <div className="absolute top-4 left-4 font-display font-extrabold text-amber-700/20 text-4xl">
                    #3
                  </div>
                  <div className="w-14 h-14 bg-amber-700/10 rounded-full flex items-center justify-center mx-auto text-amber-700">
                    <Medal weight="light" className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg">{top3[2].department}</h3>
                    <p className="text-[10px] text-[var(--foreground-muted)] truncate">{top3[2].fullName}</p>
                  </div>
                  <div className="space-y-1">
                    <div
                      className="text-2xl font-display font-extrabold text-[var(--foreground)]"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
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
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <SquaresFour weight="light" className="w-4.5 h-4.5" /> Standings Table
              </h3>
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
                          <td className="py-3.5 px-4 text-center font-bold font-mono">{i + 1}</td>
                          <td className="py-3.5 px-3 font-semibold text-[var(--foreground)]">
                            <div>{d.department}</div>
                            <div className="text-[9px] text-[var(--foreground-muted)] font-medium md:max-w-xs truncate">
                              {d.fullName}
                            </div>
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
                            {d.trend === "up" && <CaretUp weight="light" className="w-4 h-4 text-[#4CAF50] mx-auto" />}
                            {d.trend === "down" && (
                              <CaretDown weight="light" className="w-4 h-4 text-[#FF5722] mx-auto" />
                            )}
                            {d.trend === "stable" && (
                              <span className="block w-2 h-0.5 bg-[var(--foreground-muted)] mx-auto" />
                            )}
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
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <ChartLineUp weight="light" className="w-4.5 h-4.5" /> Weekly Point Growth
              </h3>
              <div className="card-bezel">
                <div className="card-bezel-inner p-5 space-y-2">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCse" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorEce" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--cta)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="var(--cta)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--surface-border)" />
                        <XAxis dataKey="name" stroke="var(--foreground-muted)" fontSize={10} />
                        <YAxis stroke="var(--foreground-muted)" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--surface-border)" }} />
                        <Area
                          type="monotone"
                          dataKey="CSE"
                          stroke="var(--accent)"
                          fillOpacity={1}
                          fill="url(#colorCse)"
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="ECE"
                          stroke="var(--cta)"
                          fillOpacity={1}
                          fill="url(#colorEce)"
                          strokeWidth={2}
                        />
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
              <Fire weight="light" className="text-amber-500 w-4 h-4" /> Category Heatmap (Engagement Index)
            </h3>
            <div className="card-bezel overflow-hidden">
              <div className="card-bezel-inner overflow-x-auto p-6">
                <div className="min-w-[500px] grid grid-cols-8 gap-2.5 text-center text-xs">
                  {/* Row headers (Categories) */}
                  <div className="font-semibold text-left text-[var(--foreground-secondary)] flex items-center">
                    Category
                  </div>
                  <div className="font-bold text-[var(--foreground-secondary)]">CSE</div>
                  <div className="font-bold text-[var(--foreground-secondary)]">ECE</div>
                  <div className="font-bold text-[var(--foreground-secondary)]">AIML</div>
                  <div className="font-bold text-[var(--foreground-secondary)]">AIDS</div>
                  <div className="font-bold text-[var(--foreground-secondary)]">CCE</div>
                  <div className="font-bold text-[var(--foreground-secondary)]">BT</div>
                  <div className="font-bold text-[var(--foreground-secondary)]">ME</div>

                  {heatmapData.map((row) => (
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
