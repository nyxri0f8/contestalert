"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Lightning, CalendarCheck, Ticket, Trophy, Bell, SignOut,
  Plus, PencilSimple, Trash, Archive, House, Sun, Moon,
  QrCode, ClipboardText, Users, Funnel, MagnifyingGlass
} from "@phosphor-icons/react";
import { useTheme } from "@/components/shared/ThemeProvider";

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT_EXPO } }
};

interface EventType {
  id: string;
  title: string;
  category: string;
  department: string;
  date: string;
  venue: string;
  seats: number;
  total: number;
  deadline: string;
  deadlinedate: string;
  fee: number;
  image: string;
  status?: string; // active, archived
}

const DEFAULT_EVENTS: EventType[] = [
  { id: "1", title: "CodeStorm Hackathon 2026", category: "hackathon", department: "CSE", date: "Jun 28, 2026", venue: "Main Auditorium", seats: 42, total: 120, deadline: "safe", deadlinedate: "Jun 25, 2026", fee: 150, image: "https://picsum.photos/seed/hack2026/800/500", status: "active" },
  { id: "2", title: "AI Workshop: Transformers", category: "workshop", department: "AIML", date: "Jul 5, 2026", venue: "Lab Block C-301", seats: 18, total: 60, deadline: "warn", deadlinedate: "Jul 2, 2026", fee: 0, image: "https://picsum.photos/seed/aiwork/800/500", status: "active" },
  { id: "3", title: "Placement Prep Bootcamp", category: "placement", department: "All", date: "Jul 12, 2026", venue: "Seminar Hall A", seats: 120, total: 200, deadline: "safe", deadlinedate: "Jul 10, 2026", fee: 0, image: "https://picsum.photos/seed/place2026/800/500", status: "active" },
  { id: "4", title: "RoboWars Championship", category: "technical", department: "ECE", date: "Jun 22, 2026", venue: "Open Ground", seats: 6, total: 30, deadline: "critical", deadlinedate: "Jun 21, 2026", fee: 300, image: "https://picsum.photos/seed/robo2026/800/500", status: "active" },
];

const NAV_ITEMS = [
  { label: "Admin Panel", icon: House, href: "/admin" },
  { label: "Manage Events", icon: CalendarCheck, href: "/admin/events", active: true },
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

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("rit_events");
    if (stored) {
      setEvents(JSON.parse(stored));
    } else {
      setEvents(DEFAULT_EVENTS);
      localStorage.setItem("rit_events", JSON.stringify(DEFAULT_EVENTS));
    }
  }, []);

  const deleteEvent = (id: string) => {
    if (confirm("Are you sure you want to delete this event? This will remove all registration references.")) {
      const updated = events.filter(e => e.id !== id);
      setEvents(updated);
      localStorage.setItem("rit_events", JSON.stringify(updated));
    }
  };

  const archiveEvent = (id: string) => {
    const updated = events.map(e => e.id === id ? { ...e, status: e.status === "archived" ? "active" : "archived" } : e);
    setEvents(updated);
    localStorage.setItem("rit_events", JSON.stringify(updated));
  };

  const filtered = events.filter(e => {
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterDept && e.department !== filterDept) return false;
    return true;
  });

  return (
    <div className="min-h-[100dvh] bg-[var(--background)]">
      <Sidebar />
      <main className="lg:ml-[var(--sidebar-width)] min-h-[100dvh] pb-16">
        
        {/* Header */}
        <header className="sticky top-0 z-20 glass border-b border-[var(--surface-border)] px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Manage Events</h1>
            <p className="text-xs text-[var(--foreground-muted)]">{filtered.length} events published</p>
          </div>
          <Link href="/admin/events/new" className="px-4 py-2 rounded-xl bg-[var(--cta)] hover:bg-[var(--cta-hover)] text-white text-xs font-bold transition-all shadow-[var(--shadow-cta-glow)] flex items-center gap-1.5">
            <Plus weight="bold" className="w-3.5 h-3.5" /> Create Event
          </Link>
        </header>

        {/* Content */}
        <div className="px-6 lg:px-8 py-8 space-y-6 max-w-6xl mx-auto">
          
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[var(--surface-subtle)] p-4 rounded-xl border border-[var(--surface-border)]">
            <div className="relative w-full sm:w-72">
              <MagnifyingGlass weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
              <input 
                type="text" placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 w-full rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" 
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-xs w-full sm:w-40">
                <option value="">All Departments</option>
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="AIML">AIML</option>
                <option value="AIDS">AIDS</option>
                <option value="All">General / All</option>
              </select>
            </div>
          </div>

          {/* Events Grid Table */}
          <div className="card-bezel overflow-hidden">
            <div className="card-bezel-inner overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--surface-border)] bg-[var(--surface)] text-[var(--foreground-muted)] font-bold">
                    <th className="py-3.5 px-4">Event Details</th>
                    <th className="py-3.5 px-3">Date</th>
                    <th className="py-3.5 px-3 text-center">Department</th>
                    <th className="py-3.5 px-3 text-center">Registrations</th>
                    <th className="py-3.5 px-3 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--surface-border)]">
                  {filtered.length > 0 ? (
                    filtered.map((e) => (
                      <tr key={e.id} className="hover:bg-[var(--surface-subtle)] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img src={e.image} className="w-10 h-7 rounded object-cover" alt="" />
                            <div>
                              <div className="font-semibold text-[13px] text-[var(--foreground)]">{e.title}</div>
                              <div className="text-[10px] text-[var(--foreground-muted)] uppercase">{e.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 font-medium text-[var(--foreground-secondary)]">
                          {e.date}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded bg-[var(--accent-muted)] text-[var(--accent-text)] text-[9px] font-bold uppercase">
                            {e.department}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono font-semibold text-[var(--foreground)]">
                          {e.total - e.seats} / {e.total}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            e.status === "archived" 
                              ? "bg-slate-400/10 text-slate-400 border border-slate-400/20" 
                              : "bg-[#4CAF50]/10 text-[#4CAF50] border border-[#4CAF50]/20"
                          }`}>
                            {e.status || "active"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <Link href={`/admin/events/${e.id}`} className="p-2 border border-[var(--surface-border)] rounded-lg text-[var(--foreground-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-colors" title="Edit Event">
                              <PencilSimple className="w-3.5 h-3.5" />
                            </Link>
                            <button onClick={() => archiveEvent(e.id)} className="p-2 border border-[var(--surface-border)] rounded-lg text-[var(--foreground-secondary)] hover:text-amber-500 hover:border-amber-500/30 transition-colors" title="Archive / Restore Event">
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => deleteEvent(e.id)} className="p-2 border border-[var(--surface-border)] rounded-lg text-[var(--foreground-secondary)] hover:text-[var(--cta)] hover:border-[var(--cta)]/30 transition-colors" title="Delete Event">
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-[var(--foreground-muted)]">
                        No events found matching current criteria.
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
