"use client";

import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Ticket,
  Trophy,
  Users,
  QrCode,
  ClipboardText,
  ChartLineUp,
  Sparkle,
  Fire,
  ArrowRight,
  IdentificationCard,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Sidebar } from "@/components/shared/Sidebar";
import * as XLSX from "xlsx";
import { Warning, DownloadSimple } from "@phosphor-icons/react";

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT_EXPO } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any[]>([]);
  const [deptParticipation, setDeptParticipation] = useState<any[]>([]);
  const [eventRegistrations, setEventRegistrations] = useState<any[]>([]);
  const [recentRegs, setRecentRegs] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [eventsNeedingBackup, setEventsNeedingBackup] = useState<any[]>([]);
  const [downloadingBackup, setDownloadingBackup] = useState(false);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const supabase = createClient();

        // 1. Fetch Stats
        const { count: studentCount } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true });

        const { count: regCount } = await supabase
          .from("registrations")
          .select("id", { count: "exact", head: true });

        const { count: activeEventCount } = await supabase
          .from("events")
          .select("id", { count: "exact", head: true })
          .eq("status", "active");

        const { count: attendanceCount } = await supabase
          .from("attendance")
          .select("id", { count: "exact", head: true });

        const avgAttendance =
          regCount && regCount > 0 ? ((attendanceCount || 0) / regCount * 100).toFixed(1) + "%" : "0%";

        setStats([
          { label: "Total Users", value: (studentCount || 0).toLocaleString(), icon: Users, color: "var(--accent)" },
          { label: "Total Registrations", value: (regCount || 0).toLocaleString(), icon: Ticket, color: "var(--cta)" },
          { label: "Active Events", value: (activeEventCount || 0).toString(), icon: CalendarCheck, color: "var(--accent)" },
          { label: "Avg Attendance %", value: avgAttendance, icon: IdentificationCard, color: "var(--status-warning)" },
        ]);

        // 2. Fetch Department Participation using Leaderboard RPC
        const { data: dbLeaderboard } = await supabase.rpc("get_department_leaderboard");
        const colorMap: Record<string, string> = {
          CSE: "#10B981",
          ECE: "#3B82F6",
          AIML: "#F59E0B",
          AIDS: "#EF4444",
          CCE: "#8B5CF6",
          Biotechnology: "#EC4899",
          Mechanical: "#6B7280",
        };
        const parsedDepts = (dbLeaderboard || []).map((d: any) => ({
          name: d.department === "Biotechnology" ? "Biotech" : d.department === "Mechanical" ? "Mech" : d.department,
          registrations: parseInt(d.total_registrations) || 0,
          color: colorMap[d.department] || "#6B7280",
        }));
        setDeptParticipation(parsedDepts);

        // 3. Fetch Event Registrations
        const { data: eventRegs } = await supabase
          .from("events")
          .select("title, registrations(count)")
          .eq("status", "active");

        const parsedEvents = (eventRegs || []).map((e: any) => ({
          title: e.title,
          registrations: e.registrations?.[0]?.count || 0,
        }));
        setEventRegistrations(parsedEvents);

        // Heatmap Data Generation
        const { data: allRegs } = await supabase.from("registrations").select(`
            registered_at,
            profiles(department),
            events(category)
          `);

        if (allRegs) {
          const categories = ["hackathon", "workshop", "symposium", "placement", "sports", "cultural"];
          const depts = ["CSE", "ECE", "AIML", "AIDS", "CCE", "Biotechnology", "Mechanical", "VLSI", "CSBS"];
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
              const count = allRegs.filter((r: any) => {
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
        }

        // Fetch events needing backup (deadline within 7 days)
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        
        const { data: backupEvents } = await supabase
          .from("events")
          .select("id, title, deadline")
          .eq("status", "active")
          .eq("is_backed_up", false)
          .lte("deadline", sevenDaysFromNow.toISOString())
          .gte("deadline", new Date().toISOString());
        
        setEventsNeedingBackup(backupEvents || []);

        // 4. Fetch Recent Registrations
        const { data: recent } = await supabase
          .from("registrations")
          .select(`
            id,
            ticket_id,
            registered_at,
            team_name,
            events(title)
          `)
          .order("registered_at", { ascending: false })
          .limit(4);

        if (recent) {
          const parsedRecent = recent.map((r: any) => ({
            id: r.ticket_id,
            title: r.events?.title || "Unknown Event",
            registeredAt: new Date(r.registered_at).toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
            teamName: r.team_name,
          }));
          setRecentRegs(parsedRecent);
        }
      } catch (err) {
        console.error("Failed to load admin dashboard data", err);
      }
    }
    loadAdminData();

    const supabase = createClient();
    const channel = supabase
      .channel('admin_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => loadAdminData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, () => loadAdminData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const downloadBackup = async () => {
    if (eventsNeedingBackup.length === 0) return;
    setDownloadingBackup(true);
    try {
      const supabase = createClient();
      const wb = XLSX.utils.book_new();
      
      let totalRegs = 0;
      let totalAttendance = 0;
      let deptCounts: Record<string, number> = {};

      for (const event of eventsNeedingBackup) {
        // Fetch registrations with profiles and attendance
        const { data: regs } = await supabase
          .from("registrations")
          .select(`
            registered_at, team_name,
            profiles(name, register_number, department, year, section),
            attendance(checked_in_at)
          `)
          .eq("event_id", event.id);

        if (regs && regs.length > 0) {
          totalRegs += regs.length;
          
          const sheetData = regs.map(r => {
            const p = (r.profiles as any) || {};
            const att = r.attendance as any;
            if (att) totalAttendance++;
            if (p.department) {
              deptCounts[p.department] = (deptCounts[p.department] || 0) + 1;
            }

            return {
              "Student Name": p.name || "Unknown",
              "Roll Number": p.register_number || "-",
              "Department": p.department || "-",
              "Year": p.year || "-",
              "Section": p.section || "-",
              "Team Name": r.team_name || "-",
              "Registration Date": new Date(r.registered_at).toLocaleString(),
              "Attended": att ? "Yes" : "No",
              "Check-in Time": att ? new Date(att.checked_in_at).toLocaleString() : "-"
            };
          });

          const ws = XLSX.utils.json_to_sheet(sheetData);
          // Sheet names must be <= 31 chars
          XLSX.utils.book_append_sheet(wb, ws, event.title.substring(0, 31));
        } else {
          // Empty sheet if no regs
          const ws = XLSX.utils.json_to_sheet([{ Message: "No registrations yet" }]);
          XLSX.utils.book_append_sheet(wb, ws, event.title.substring(0, 31));
        }
      }

      // Final Sheet: Overall Stats
      let topDept = "-";
      let maxCount = 0;
      Object.entries(deptCounts).forEach(([dept, count]) => {
        if (count > maxCount) {
          maxCount = count;
          topDept = dept;
        }
      });

      const statsData = [
        { Metric: "Total Registrations (These Events)", Value: totalRegs },
        { Metric: "Average Attendance %", Value: totalRegs > 0 ? ((totalAttendance / totalRegs) * 100).toFixed(1) + "%" : "0%" },
        { Metric: "Departments Participated", Value: Object.keys(deptCounts).length },
        { Metric: "Top Department", Value: `${topDept} (${maxCount} regs)` }
      ];
      
      const statsWs = XLSX.utils.json_to_sheet(statsData);
      XLSX.utils.book_append_sheet(wb, statsWs, "Overall Stats");

      // Download file
      XLSX.writeFile(wb, `ContestAlert_Backup_${new Date().toISOString().split('T')[0]}.xlsx`);

      // Mark as backed up in DB
      const eventIds = eventsNeedingBackup.map(e => e.id);
      await supabase.from("events").update({ is_backed_up: true }).in("id", eventIds);
      
      // Dismiss banner
      setEventsNeedingBackup([]);
      
    } catch (err) {
      console.error("Backup failed", err);
      alert("Failed to generate backup.");
    } finally {
      setDownloadingBackup(false);
    }
  };

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
        <header className="sticky top-0 z-20 glass border-b border-[var(--surface-border)] px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Executive Dashboard</h1>
            <p className="text-xs text-[var(--foreground-muted)]">RIT College Contest Alert Command Center</p>
          </div>
          <div className="flex gap-2.5">
            <Link
              href="/admin/events/new"
              className="px-4 py-2 rounded-xl bg-[var(--cta)] hover:bg-[var(--cta-hover)] text-white text-xs font-bold transition-all shadow-[var(--shadow-cta-glow)] flex items-center gap-1.5"
            >
              Create Event +
            </Link>
          </div>
        </header>

        {/* Content */}
        {eventsNeedingBackup.length > 0 && (
          <div className="bg-red-500/10 border-b border-red-500/20 px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-[69px] z-10 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                <Warning weight="bold" className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-red-500">Action Required: Event Backups Pending</div>
                <div className="text-[10px] text-red-500/80 font-medium">
                  {eventsNeedingBackup.length} event(s) have deadlines within 7 days and haven't been backed up.
                </div>
              </div>
            </div>
            <button
              onClick={downloadBackup}
              disabled={downloadingBackup}
              className="shrink-0 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-[var(--shadow-glow)] disabled:opacity-50"
            >
              <DownloadSimple weight="bold" className="w-4 h-4" />
              {downloadingBackup ? "Generating Backup..." : "Download XLSX Backup"}
            </button>
          </div>
        )}
        <div className="px-6 lg:px-8 py-8 space-y-8 max-w-6xl mx-auto">
          {/* Stats Bar */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
          >
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={fadeUp} className="card-bezel">
                <div className="card-bezel-inner p-5 flex items-center justify-between bg-[var(--surface-subtle)]">
                  <div className="space-y-1">
                    <span className="text-xs text-[var(--foreground-muted)] font-medium">{stat.label}</span>
                    <div
                      className="text-2xl font-display font-extrabold text-[var(--foreground)]"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {stat.value}
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[var(--background)] border border-[var(--surface-border)]">
                    <stat.icon weight="light" className="w-5 h-5" style={{ color: stat.color }} />
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
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <ChartLineUp weight="light" className="w-4.5 h-4.5" /> Registrations Per Event
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={eventRegistrations} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--surface-border)" />
                      <XAxis dataKey="title" stroke="var(--foreground-muted)" fontSize={10} />
                      <YAxis stroke="var(--foreground-muted)" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--surface-border)" }} />
                      <Bar dataKey="registrations" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={45} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>

            {/* Department Breakdown Pie (5 cols) */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="lg:col-span-5 card-bezel">
              <div className="card-bezel-inner p-6 space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <Users weight="light" className="w-4.5 h-4.5" /> Department Breakdowns
                </h3>
                <div className="h-64 flex items-center justify-center">
                  <div className="w-1/2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={deptParticipation}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="registrations"
                        >
                          {deptParticipation.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend listing */}
                  <div className="space-y-1.5 shrink-0 pl-2 text-[10px] font-medium text-[var(--foreground-secondary)] w-1/2">
                    {deptParticipation.slice(0, 5).map((entry) => (
                      <div key={entry.name} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="truncate block max-w-[100px]">
                          {entry.name}: {entry.registrations}
                        </span>
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
                    <Link
                      key={act.label}
                      href={act.href}
                      className="flex flex-col items-center gap-2 p-5 rounded-xl border border-[var(--surface-border)] hover:bg-[var(--surface-subtle)] hover:border-[var(--surface-border-hover)] transition-all duration-300 active:scale-[0.97]"
                    >
                      <act.icon weight="light" className="w-6 h-6" style={{ color: act.color }} />
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
                    <Sparkle weight="light" className="w-4 h-4 text-[var(--accent)]" />
                    <h3 className="text-sm font-semibold">Recent Platform Registrations</h3>
                  </div>
                  <Link
                    href="/admin/registrations"
                    className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] flex items-center gap-1 transition-colors"
                  >
                    View Logs <ArrowRight weight="light" className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="divide-y divide-[var(--surface-border)]">
                  {recentRegs.length > 0 ? (
                    recentRegs.map((reg) => (
                      <div
                        key={reg.id}
                        className="flex items-center justify-between px-6 py-4 hover:bg-[var(--accent-muted)]/20 transition-colors"
                      >
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

          {/* Department Heatmap Matrix */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Fire weight="light" className="text-amber-500 w-4 h-4" /> Category Heatmap (Engagement Index)
            </h3>
            <div className="card-bezel overflow-hidden">
              <div className="card-bezel-inner overflow-x-auto p-6">
                <div className="min-w-[500px] grid grid-cols-[1.5fr_repeat(9,1fr)] gap-2.5 text-center text-xs">
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
                  <div className="font-bold text-[var(--foreground-secondary)]">VLSI</div>
                  <div className="font-bold text-[var(--foreground-secondary)]">CSBS</div>

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
                      <div className={`p-2.5 rounded-lg ${getHeatmapColor(row.VLSI)}`}>{row.VLSI}</div>
                      <div className={`p-2.5 rounded-lg ${getHeatmapColor(row.CSBS)}`}>{row.CSBS}</div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
