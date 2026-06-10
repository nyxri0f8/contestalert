"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import {
  MagnifyingGlass, CalendarCheck, Clock, MapPin, Users,
  Funnel, CaretRight, ArrowRight, Sparkle, X,
  Lightning, House, CalendarBlank, Ticket, Trophy, Medal, Bell,
  Sun, Moon, SignOut, User,
} from "@phosphor-icons/react";
import { useTheme } from "@/components/shared/ThemeProvider";
import { createClient } from "@/lib/supabase/client";
import { EVENT_CATEGORIES, DEPARTMENTS } from "@/types";

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT_EXPO } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } } };
const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: EASE_OUT_EXPO } },
};

const MOCK_EVENTS = [
  { id: "1", title: "CodeStorm Hackathon 2026", category: "hackathon", department: "CSE", date: "Jun 28, 2026", venue: "Main Auditorium", seats: 42, total: 120, deadline: "safe", image: "https://picsum.photos/seed/hack2026/800/500", desc: "48-hour coding marathon with industry mentors and exciting prizes." },
  { id: "2", title: "AI Workshop: Transformers & Beyond", category: "workshop", department: "AIML", date: "Jul 5, 2026", venue: "Lab Block C-301", seats: 18, total: 60, deadline: "warn", image: "https://picsum.photos/seed/aiwork/800/500", desc: "Deep dive into transformer architectures with hands-on coding sessions." },
  { id: "3", title: "Placement Prep Bootcamp", category: "placement", department: "All", date: "Jul 12, 2026", venue: "Seminar Hall A", seats: 120, total: 200, deadline: "safe", image: "https://picsum.photos/seed/place2026/800/500", desc: "Intensive prep covering aptitude, coding, and interview skills." },
  { id: "4", title: "RoboWars Championship", category: "technical", department: "ECE", date: "Jun 22, 2026", venue: "Open Ground", seats: 6, total: 30, deadline: "critical", image: "https://picsum.photos/seed/robo2026/800/500", desc: "Build and battle robots in RIT's flagship robotics competition." },
  { id: "5", title: "Cultural Fest: Rhythms 2026", category: "cultural", department: "All", date: "Aug 2, 2026", venue: "OAT", seats: 500, total: 500, deadline: "safe", image: "https://picsum.photos/seed/cultural2026/800/500", desc: "Annual cultural extravaganza with music, dance, and drama." },
  { id: "6", title: "Biotech Symposium", category: "symposium", department: "Biotechnology", date: "Jul 20, 2026", venue: "Seminar Hall B", seats: 45, total: 80, deadline: "warn", image: "https://picsum.photos/seed/biotech2026/800/500", desc: "Research presentations and keynotes from leading biotech professionals." },
];

const DEADLINE_COLORS: Record<string, string> = { safe: "bg-[#4CAF50]", warn: "bg-[#FF9800]", urgent: "bg-[#FF5722]", critical: "bg-[#D32F2F] animate-pulse" };
const DEADLINE_TEXT: Record<string, string> = { safe: "Open", warn: "Closing Soon", urgent: "Urgent", critical: "Last Day" };

const NAV_ITEMS = [
  { label: "Dashboard", icon: House, href: "/dashboard" },
  { label: "Events", icon: CalendarBlank, href: "/events", active: true },
  { label: "My Tickets", icon: Ticket, href: "/tickets" },
  { label: "Leaderboard", icon: Trophy, href: "/leaderboard" },
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

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = MOCK_EVENTS.filter((e) => {
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedCategory && e.category !== selectedCategory) return false;
    if (selectedDept && e.department !== selectedDept && e.department !== "All") return false;
    return true;
  });

  return (
    <div className="min-h-[100dvh] bg-[var(--background)]">
      <Sidebar />
      <main className="lg:ml-[var(--sidebar-width)] min-h-[100dvh]">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 glass border-b border-[var(--surface-border)]">
          <div className="flex items-center justify-between px-6 lg:px-8 py-3.5">
            <div>
              <h1 className="text-lg font-bold tracking-tight">Events</h1>
              <p className="text-xs text-[var(--foreground-muted)]">{filtered.length} events available</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative hidden sm:block">
                <MagnifyingGlass weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
                <input type="text" placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] text-sm w-56 placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 transition-all duration-300" />
              </div>
              <button onClick={() => setShowFilters(!showFilters)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${showFilters ? "bg-[var(--accent-muted)] text-[var(--accent)]" : "hover:bg-[var(--surface-border)] text-[var(--foreground-secondary)]"}`}>
                <Funnel weight="bold" className="w-[18px] h-[18px]" />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="border-t border-[var(--surface-border)] px-6 lg:px-8 py-3 flex flex-wrap gap-3">
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-[var(--surface-border)] bg-[var(--surface)] text-sm">
                <option value="">All Categories</option>
                {EVENT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-[var(--surface-border)] bg-[var(--surface)] text-sm">
                <option value="">All Departments</option>
                {DEPARTMENTS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
              {(selectedCategory || selectedDept) && (
                <button onClick={() => { setSelectedCategory(""); setSelectedDept(""); }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-[var(--cta)] font-medium hover:bg-[var(--cta-muted)] transition-colors">
                  <X weight="bold" className="w-3 h-3" /> Clear
                </button>
              )}
            </motion.div>
          )}
        </header>

        {/* Event Grid */}
        <div className="px-6 lg:px-8 py-8">
          <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((event) => (
              <motion.div key={event.id} variants={scaleIn}
                whileHover={{ y: -3, transition: { duration: 0.3, ease: EASE_OUT_EXPO } }}
                className="card-bezel group cursor-pointer">
                <Link href={`/events/${event.id}`}>
                  <div className="card-bezel-inner">
                    <div className="relative h-44 overflow-hidden">
                      <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.04]"
                        style={{ backgroundImage: `url(${event.image})` }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#303841]/70 via-[#303841]/10 to-transparent" />
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/12 backdrop-blur-xl text-white text-[10px] font-semibold border border-white/10">
                          <span className={`w-1.5 h-1.5 rounded-full ${DEADLINE_COLORS[event.deadline]}`} />
                          {DEADLINE_TEXT[event.deadline]}
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#303841]/50 backdrop-blur-xl text-white text-[10px] font-mono font-medium">
                          {event.seats}/{event.total} left
                        </span>
                      </div>
                    </div>
                    <div className="p-5 space-y-2.5">
                      <span className="inline-flex px-2 py-0.5 rounded-md bg-[var(--accent-muted)] text-[var(--accent-text)] text-[10px] font-bold uppercase tracking-wider">
                        {event.department}
                      </span>
                      <h3 className="text-[15px] font-semibold tracking-tight group-hover:text-[var(--accent)] transition-colors duration-300 line-clamp-1">
                        {event.title}
                      </h3>
                      <p className="text-xs text-[var(--foreground-muted)] line-clamp-2">{event.desc}</p>
                      <div className="flex items-center gap-3 text-xs text-[var(--foreground-muted)] pt-1">
                        <span className="flex items-center gap-1"><Clock weight="bold" className="w-3 h-3" />{event.date}</span>
                        <span className="flex items-center gap-1"><MapPin weight="bold" className="w-3 h-3" />{event.venue}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {filtered.length === 0 && (
            <div className="text-center py-20 space-y-3">
              <CalendarCheck weight="duotone" className="w-12 h-12 text-[var(--foreground-muted)] mx-auto" />
              <h3 className="font-semibold text-lg">No events found</h3>
              <p className="text-sm text-[var(--foreground-muted)]">Try adjusting your filters or search query.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
