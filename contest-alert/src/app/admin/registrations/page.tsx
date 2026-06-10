"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Lightning, CalendarCheck, Ticket, Trophy, Bell, SignOut,
  ClipboardText, QrCode, Users, House, Sun, Moon,
  DownloadSimple, Funnel, MagnifyingGlass
} from "@phosphor-icons/react";
import { useTheme } from "@/components/shared/ThemeProvider";

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT_EXPO } }
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

const DEFAULT_REGISTRATIONS: RegistrationRow[] = [
  { id: "EVT-2026-784912", studentName: "Varun K.", registerNo: "211621104012", department: "CSE", year: 3, eventTitle: "CodeStorm Hackathon 2026", registeredAt: "Jun 09, 2026", attendance: "present" },
  { id: "EVT-2026-104928", studentName: "Varun K.", registerNo: "211621104012", department: "CSE", year: 3, eventTitle: "AI Workshop: Transformers", registeredAt: "Jun 09, 2026", attendance: "absent" },
  { id: "EVT-2026-902412", studentName: "Sanjay Kumar", registerNo: "211621106041", department: "ECE", year: 4, eventTitle: "RoboWars Championship", registeredAt: "Jun 08, 2026", attendance: "present" },
  { id: "EVT-2026-302948", studentName: "Preethi S.", registerNo: "211621203004", department: "AIML", year: 2, eventTitle: "AI Workshop: Transformers", registeredAt: "Jun 08, 2026", attendance: "present" },
  { id: "EVT-2026-103948", studentName: "Abishek R.", registerNo: "211621104001", department: "CSE", year: 3, eventTitle: "CodeStorm Hackathon 2026", registeredAt: "Jun 07, 2026", attendance: "absent" }
];

const NAV_ITEMS = [
  { label: "Admin Panel", icon: House, href: "/admin" },
  { label: "Manage Events", icon: CalendarCheck, href: "/admin/events" },
  { label: "QR Scanner", icon: QrCode, href: "/admin/scanner" },
  { label: "Registrations", icon: ClipboardText, href: "/admin/registrations", active: true },
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

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [eventFilter, setEventFilter] = useState("");

  useEffect(() => {
    // Read registrations from local storage and sync
    const storedTickets = localStorage.getItem("rit_tickets");
    const checkedInIds = JSON.parse(localStorage.getItem("rit_attendance") || "[]");

    if (storedTickets) {
      const tickets = JSON.parse(storedTickets);
      const parsed: RegistrationRow[] = tickets.map((t: any) => ({
        id: t.id,
        studentName: t.teamName ? `Team: ${t.teamName}` : "Varun K.",
        registerNo: "211621104012", // Mock standard register number
        department: t.eventId === "1" ? "CSE" : t.eventId === "2" ? "AIML" : "ECE",
        year: 3,
        eventTitle: t.title,
        registeredAt: t.registeredAt || "Jun 09, 2026",
        attendance: checkedInIds.includes(t.id) ? "present" : "absent"
      }));
      setRegistrations(parsed);
    } else {
      setRegistrations(DEFAULT_REGISTRATIONS);
      localStorage.setItem("rit_tickets", JSON.stringify(DEFAULT_REGISTRATIONS.map(r => ({
        id: r.id,
        title: r.eventTitle,
        eventId: r.eventTitle.includes("CodeStorm") ? "1" : "2",
        teamName: r.studentName.includes("Team") ? r.studentName.split(": ")[1] : null,
        registeredAt: r.registeredAt
      }))));
    }
  }, []);

  const handleExportCSV = () => {
    if (registrations.length === 0) return;
    
    // Create CSV rows
    const headers = ["Ticket ID", "Student Name", "Register Number", "Department", "Year", "Event Title", "Registration Date", "Attendance"];
    const rows = filtered.map(r => [r.id, r.studentName, r.registerNo, r.department, r.year, r.eventTitle, r.registeredAt, r.attendance]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RIT_Event_Registrations_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = registrations.filter(r => {
    if (search && !r.studentName.toLowerCase().includes(search.toLowerCase()) && !r.id.toLowerCase().includes(search.toLowerCase())) return false;
    if (deptFilter && r.department !== deptFilter) return false;
    if (eventFilter && !r.eventTitle.toLowerCase().includes(eventFilter.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-[100dvh] bg-[var(--background)]">
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
            <DownloadSimple weight="bold" className="w-4 h-4" /> Export CSV
          </button>
        </header>

        {/* Content */}
        <div className="px-6 lg:px-8 py-8 space-y-6 max-w-6xl mx-auto">
          
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[var(--surface-subtle)] p-4 rounded-xl border border-[var(--surface-border)]">
            <div className="relative w-full md:w-72">
              <MagnifyingGlass weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
              <input 
                type="text" placeholder="Search by name or ticket ID..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 w-full rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" 
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-xs">
                <option value="">All Departments</option>
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="AIML">AIML</option>
                <option value="AIDS">AIDS</option>
              </select>

              <select value={eventFilter} onChange={e => setEventFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-xs max-w-xs">
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
                        <td className="py-3.5 px-4 font-mono font-bold text-[var(--cta)]">
                          {r.id}
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-[var(--foreground)]">
                          {r.studentName}
                        </td>
                        <td className="py-3.5 px-3 font-mono text-[var(--foreground-secondary)]">
                          {r.registerNo}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="inline-block px-1.5 py-0.5 rounded bg-[var(--accent-muted)] text-[var(--accent-text)] text-[9px] font-bold">
                            {r.department}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-[var(--foreground-secondary)]">
                          {r.eventTitle}
                        </td>
                        <td className="py-3.5 px-3 text-[var(--foreground-muted)]">
                          {r.registeredAt}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            r.attendance === "present" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                          }`}>
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
