"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MagnifyingGlass,
  CalendarCheck,
  Clock,
  MapPin,
  Funnel,
  X,
  Link as LinkIcon,
  ArrowSquareOut,
  Buildings,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { EVENT_CATEGORIES, DEPARTMENTS } from "@/types";
import { Sidebar } from "@/components/shared/Sidebar";

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

// DEADLINE TEXT & COLORS CONFIG
const DEADLINE_COLORS: Record<string, string> = {
  safe: "bg-[#4CAF50]",
  warn: "bg-[#FF9800]",
  urgent: "bg-[#FF5722]",
  critical: "bg-[#D32F2F] animate-pulse",
};
const DEADLINE_TEXT: Record<string, string> = {
  safe: "Open",
  warn: "Closing Soon",
  urgent: "Urgent",
  critical: "Last Day",
};

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedType, setSelectedType] = useState<"" | "internal" | "external">("");
  const [showFilters, setShowFilters] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    async function loadEvents() {
      try {
        const supabase = createClient();
        const { data: dbEvents } = await supabase
          .from("events")
          .select("*, registrations(count)");

        if (dbEvents) {
          setEvents(
            dbEvents.map((e: any) => {
              const registeredCount = e.registrations?.[0]?.count || 0;
              const remainingSeats = Math.max(0, e.capacity - registeredCount);

              // deadline status
              const deadlineDate = new Date(e.deadline);
              const diff = deadlineDate.getTime() - Date.now();
              const deadlineStatus =
                diff < 0
                  ? "critical"
                  : diff < 86400000
                  ? "urgent"
                  : diff < 86400000 * 3
                  ? "warn"
                  : "safe";

              return {
                id: e.id,
                title: e.title,
                category: e.category,
                department: e.department || "All",
                eventType: e.event_type || "internal",
                externalLink: e.external_link || null,
                date: new Date(e.event_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "2-digit",
                  year: "numeric",
                }),
                venue: e.venue,
                seats: remainingSeats,
                total: e.capacity,
                deadline: deadlineStatus,
                desc: e.description,
                image: e.cover_image || "https://picsum.photos/seed/default/800/500",
              };
            })
          );
        }
      } catch (err) {
        console.error("Failed to load events list:", err);
      }
    }
    loadEvents();
  }, []);

  const filtered = events.filter((e) => {
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedCategory && e.category !== selectedCategory) return false;
    if (selectedDept && e.department !== selectedDept && e.department !== "All") return false;
    if (selectedType && e.eventType !== selectedType) return false;
    return true;
  });

  return (
    <div className="min-h-[100dvh] bg-transparent">
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
                <MagnifyingGlass weight="light" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] text-sm w-56 placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 transition-all duration-300"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  showFilters
                    ? "bg-[var(--accent-muted)] text-[var(--accent)]"
                    : "hover:bg-[var(--surface-border)] text-[var(--foreground-secondary)]"
                }`}
              >
                <Funnel weight="light" className="w-[18px] h-[18px]" />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-[var(--surface-border)] px-6 lg:px-8 py-3 flex flex-wrap gap-3"
            >
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-[var(--surface-border)] bg-[var(--surface)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              >
                <option value="">All Categories</option>
                {EVENT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-[var(--surface-border)] bg-[var(--surface)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              >
                <option value="">All Departments</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
              {(selectedCategory || selectedDept) && (
                <button
                  onClick={() => {
                    setSelectedCategory("");
                    setSelectedDept("");
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-[var(--cta)] font-medium hover:bg-[var(--cta-muted)] transition-colors"
                >
                  <X weight="light" className="w-3 h-3" /> Clear
                </button>
              )}
            </motion.div>
          )}

          {/* Type Filter Tabs */}
          <div className="border-t border-[var(--surface-border)] px-6 lg:px-8 py-2 flex gap-1">
            {[
              { value: "", label: "All Events" },
              { value: "internal", label: "Internal" },
              { value: "external", label: "External" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSelectedType(tab.value as any)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                  selectedType === tab.value
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--foreground-secondary)] hover:bg-[var(--surface-border)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        {/* Event Grid */}
        <div className="px-6 lg:px-8 py-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
          >
            {filtered.map((event) => (
              <motion.div
                key={event.id}
                variants={scaleIn}
                whileHover={{ y: -3, transition: { duration: 0.3, ease: EASE_OUT_EXPO } }}
                className="card-bezel group cursor-pointer"
              >
                <Link href={`/events/${event.id}`}>
                  <div className="card-bezel-inner">
                    <div className="relative h-44 overflow-hidden">
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.04]"
                        style={{ backgroundImage: `url(${event.image})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--charcoal)]/80 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/12 backdrop-blur-xl text-white text-[10px] font-semibold border border-white/10">
                          <span className={`w-1.5 h-1.5 rounded-full ${DEADLINE_COLORS[event.deadline]}`} />
                          {DEADLINE_TEXT[event.deadline]}
                        </span>
                        {event.eventType === "external" && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--cta)]/80 backdrop-blur-xl text-white text-[10px] font-bold border border-white/10">
                            <ArrowSquareOut weight="bold" className="w-3 h-3" /> External
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-3 right-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[var(--charcoal)]/50 backdrop-blur-xl text-white text-[10px] font-mono font-medium">
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
                        <span className="flex items-center gap-1">
                          <Clock weight="light" className="w-3.5 h-3.5" />
                          {event.date}
                        </span>
                        {event.eventType === "external" ? (
                          <span className="flex items-center gap-1 text-[var(--cta)]">
                            <LinkIcon weight="light" className="w-3.5 h-3.5" />
                            External Link
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <MapPin weight="light" className="w-3.5 h-3.5" />
                            {event.venue}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {filtered.length === 0 && (
            <div className="text-center py-20 space-y-3">
              <CalendarCheck weight="light" className="w-12 h-12 text-[var(--foreground-muted)] mx-auto" />
              <h3 className="font-semibold text-lg">No events found</h3>
              <p className="text-sm text-[var(--foreground-muted)]">Try adjusting your filters or search query.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

