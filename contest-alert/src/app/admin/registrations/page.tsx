"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  DownloadSimple,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/shared/Sidebar";

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT_EXPO } },
};

interface RegistrationRow {
  id: string;
  studentName: string;
  registerNo: string;
  department: string;
  year: number;
  eventTitle: string;
  registeredAt: string;
  attendance: "present" | "absent";
}

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [eventFilter, setEventFilter] = useState("");

  useEffect(() => {
    async function loadRegistrations() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("registrations")
          .select(`
            id,
            ticket_id,
            team_name,
            registered_at,
            profiles(name, register_number, department, year),
            events(title),
            attendance(checked_in_at)
          `)
          .order("registered_at", { ascending: false });

        if (data) {
          const parsed: RegistrationRow[] = data.map((r: any) => {
            const hasAttended = r.attendance
              ? Array.isArray(r.attendance)
                ? r.attendance.length > 0
                : true
              : false;
            return {
              id: r.ticket_id,
              studentName: r.team_name
                ? `${r.profiles?.name || "Student"} (Team: ${r.team_name})`
                : r.profiles?.name || "Student",
              registerNo: r.profiles?.register_number || "N/A",
              department: r.profiles?.department || "N/A",
              year: r.profiles?.year || 1,
              eventTitle: r.events?.title || "Unknown Event",
              registeredAt: r.registered_at
                ? new Date(r.registered_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                  })
                : "N/A",
              attendance: hasAttended ? "present" : "absent",
            };
          });
          setRegistrations(parsed);
        }
      } catch (err) {
        console.error("Failed to load registrations", err);
      }
    }
    loadRegistrations();
  }, []);

  const handleExportCSV = () => {
    if (registrations.length === 0) return;

    const headers = [
      "Ticket ID",
      "Student Name",
      "Register Number",
      "Department",
      "Year",
      "Event Title",
      "Registration Date",
      "Attendance",
    ];
    const rows = filtered.map((r) => [
      r.id,
      r.studentName,
      r.registerNo,
      r.department,
      r.year,
      r.eventTitle,
      r.registeredAt,
      r.attendance,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RIT_Event_Registrations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = registrations.filter((r) => {
    if (
      search &&
      !r.studentName.toLowerCase().includes(search.toLowerCase()) &&
      !r.id.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (deptFilter && r.department !== deptFilter) return false;
    if (eventFilter && !r.eventTitle.toLowerCase().includes(eventFilter.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-[100dvh] bg-transparent">
      <Sidebar />
      <main className="lg:ml-[var(--sidebar-width)] min-h-[100dvh] pb-16">
        {/* Header */}
        <header className="sticky top-0 z-20 glass border-b border-[var(--surface-border)] px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Registrations Registry</h1>
            <p className="text-xs text-[var(--foreground-muted)]">{filtered.length} entries matching filters</p>
          </div>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black text-xs font-bold transition-all shadow-[var(--shadow-accent-glow)] flex items-center gap-1.5"
          >
            <DownloadSimple weight="light" className="w-4 h-4" /> Export CSV
          </button>
        </header>

        {/* Content */}
        <div className="px-6 lg:px-8 py-8 space-y-6 max-w-6xl mx-auto">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[var(--surface-subtle)] p-4 rounded-xl border border-[var(--surface-border)]">
            <div className="relative w-full md:w-72">
              <MagnifyingGlass weight="light" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
              <input
                type="text"
                placeholder="Search by name or ticket ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 w-full rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              >
                <option value="">All Departments</option>
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="AIML">AIML</option>
                <option value="AIDS">AIDS</option>
              </select>

              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-xs max-w-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              >
                <option value="">All Events</option>
                <option value="CodeStorm">CodeStorm Hackathon</option>
                <option value="AI Workshop">AI Workshop</option>
                <option value="RoboWars">RoboWars</option>
              </select>
            </div>
          </div>

          {/* Registrations List table */}
          <div className="card-bezel overflow-hidden">
            <div className="card-bezel-inner overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--surface-border)] bg-[var(--surface)] text-[var(--foreground-muted)] font-bold">
                    <th className="py-3.5 px-4">Ticket ID</th>
                    <th className="py-3.5 px-3">Student Name</th>
                    <th className="py-3.5 px-3">Register No</th>
                    <th className="py-3.5 px-3">Dept</th>
                    <th className="py-3.5 px-3">Event Title</th>
                    <th className="py-3.5 px-3">Registration Date</th>
                    <th className="py-3.5 px-4 text-center">Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--surface-border)]">
                  {filtered.length > 0 ? (
                    filtered.map((r) => (
                      <tr key={r.id} className="hover:bg-[var(--surface-subtle)] transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[var(--cta)]">{r.id}</td>
                        <td className="py-3.5 px-3 font-semibold text-[var(--foreground)]">{r.studentName}</td>
                        <td className="py-3.5 px-3 font-mono text-[var(--foreground-secondary)]">{r.registerNo}</td>
                        <td className="py-3.5 px-3">
                          <span className="inline-block px-1.5 py-0.5 rounded bg-[var(--accent-muted)] text-[var(--accent-text)] text-[9px] font-bold">
                            {r.department}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-[var(--foreground-secondary)]">
                          {r.eventTitle}
                        </td>
                        <td className="py-3.5 px-3 text-[var(--foreground-muted)]">{r.registeredAt}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              r.attendance === "present"
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                : "bg-red-500/10 text-red-500 border border-red-500/20"
                            }`}
                          >
                            {r.attendance}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-[var(--foreground-muted)]">
                        No registrations matching filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
