"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  PencilSimple,
  Trash,
  Archive,
  MagnifyingGlass,
  Users,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { getEventImageUrls } from "@/lib/supabase/storage";
import { Sidebar } from "@/components/shared/Sidebar";

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

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");

  const loadEvents = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from("events").select("*, registrations(count)");
      const eventsWithImages = data ? await getEventImageUrls(data) : null;

      if (data) {
        const parsed: EventType[] = data.map((e: any) => {
          const regCount = e.registrations?.[0]?.count || 0;
          return {
            id: e.id,
            title: e.title,
            category: e.category,
            department: e.department || "General",
            date: new Date(e.event_date).toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            }),
            venue: e.venue || "TBD",
            seats: e.capacity - regCount,
            total: e.capacity,
            deadline: new Date(e.deadline).getTime() < Date.now() ? "critical" : "safe",
            deadlinedate: new Date(e.deadline).toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            }),
            fee: parseFloat(e.fee) || 0,
            image: e.cover_image || "https://picsum.photos/seed/hack2026/800/500",
            status: e.status,
          };
        });
        setEvents(parsed);
      }
    } catch (err) {
      console.error("Failed to load events", err);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const deleteEvent = async (id: string) => {
    if (confirm("Are you sure you want to delete this event? This will remove all registration references.")) {
      try {
        const supabase = createClient();
        const { error } = await supabase.from("events").delete().eq("id", id);
        if (!error) {
          setEvents((prev) => prev.filter((e) => e.id !== id));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const archiveEvent = async (id: string) => {
    const current = events.find((e) => e.id === id);
    if (!current) return;
    const newStatus = current.status === "archived" ? "active" : "archived";
    try {
      const supabase = createClient();
      const { error } = await supabase.from("events").update({ status: newStatus }).eq("id", id);
      if (!error) {
        setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = events.filter((e) => {
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterDept && e.department !== filterDept) return false;
    return true;
  });

  return (
    <div className="min-h-[100dvh] bg-transparent">
      <Sidebar />
      <main className="lg:ml-[var(--sidebar-width)] min-h-[100dvh] pb-16">
        {/* Header */}
        <header className="sticky top-0 z-20 glass border-b border-[var(--surface-border)] px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Manage Events</h1>
            <p className="text-xs text-[var(--foreground-muted)]">{filtered.length} events published</p>
          </div>
          <Link
            href="/admin/events/new"
            className="px-4 py-2 rounded-xl bg-[var(--cta)] hover:bg-[var(--cta-hover)] text-white text-xs font-bold transition-all shadow-[var(--shadow-cta-glow)] flex items-center gap-1.5"
          >
            <Plus weight="light" className="w-3.5 h-3.5" /> Create Event
          </Link>
        </header>

        {/* Content */}
        <div className="px-6 lg:px-8 py-8 space-y-6 max-w-6xl mx-auto">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[var(--surface-subtle)] p-4 rounded-xl border border-[var(--surface-border)]">
            <div className="relative w-full sm:w-72">
              <MagnifyingGlass weight="light" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
              <input
                type="text"
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 w-full rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-xs w-full sm:w-40 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              >
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
                        <td className="py-3.5 px-3 font-medium text-[var(--foreground-secondary)]">{e.date}</td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded bg-[var(--accent-muted)] text-[var(--accent-text)] text-[9px] font-bold uppercase">
                            {e.department}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono font-semibold text-[var(--foreground)]">
                          {e.total - e.seats} / {e.total}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              e.status === "archived"
                                ? "bg-slate-400/10 text-slate-400 border border-slate-400/20"
                                : "bg-[#4CAF50]/10 text-[#4CAF50] border border-[#4CAF50]/20"
                            }`}
                          >
                            {e.status || "active"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <Link
                              href={`/admin/events/${e.id}/registrations`}
                              className="p-2 border border-[var(--surface-border)] rounded-lg text-[var(--foreground-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-colors"
                              title="View Registrations"
                            >
                              <Users weight="light" className="w-3.5 h-3.5" />
                            </Link>
                            <Link
                              href={`/admin/events/${e.id}`}
                              className="p-2 border border-[var(--surface-border)] rounded-lg text-[var(--foreground-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-colors"
                              title="Edit Event"
                            >
                              <PencilSimple weight="light" className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => archiveEvent(e.id)}
                              className="p-2 border border-[var(--surface-border)] rounded-lg text-[var(--foreground-secondary)] hover:text-amber-500 hover:border-amber-500/30 transition-colors"
                              title="Archive / Restore Event"
                            >
                              <Archive weight="light" className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteEvent(e.id)}
                              className="p-2 border border-[var(--surface-border)] rounded-lg text-[var(--foreground-secondary)] hover:text-[var(--cta)] hover:border-[var(--cta)]/30 transition-colors"
                              title="Delete Event"
                            >
                              <Trash weight="light" className="w-3.5 h-3.5" />
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
