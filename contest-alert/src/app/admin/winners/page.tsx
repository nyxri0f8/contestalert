"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Lightning, CalendarCheck, Ticket, Trophy, Bell, SignOut,
  QrCode, ClipboardText, Users, House, Sun, Moon,
  CheckCircle, ListChecks, Warning, User, Trash
} from "@phosphor-icons/react";
import { useTheme } from "@/components/shared/ThemeProvider";

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT_EXPO } }
};

interface WinnerRow {
  id: string;
  eventId: string;
  eventTitle: string;
  studentName: string;
  registerNo: string;
  department: string;
  position: "winner" | "runner_up" | "special_mention";
  pointsAwarded: number;
  declaredAt: string;
}

const DEFAULT_WINNERS: WinnerRow[] = [
  { id: "win-1", eventId: "1", eventTitle: "CodeStorm Hackathon 2026", studentName: "Sanjay Kumar", registerNo: "211621104035", department: "CSE", position: "winner", pointsAwarded: 50, declaredAt: "Jun 09, 2026" },
  { id: "win-2", eventId: "1", eventTitle: "CodeStorm Hackathon 2026", studentName: "Preethi S.", registerNo: "211621203004", department: "AIML", position: "runner_up", pointsAwarded: 30, declaredAt: "Jun 09, 2026" }
];

const NAV_ITEMS = [
  { label: "Admin Panel", icon: House, href: "/admin" },
  { label: "Manage Events", icon: CalendarCheck, href: "/admin/events" },
  { label: "QR Scanner", icon: QrCode, href: "/admin/scanner" },
  { label: "Registrations", icon: ClipboardText, href: "/admin/registrations" },
  { label: "Winner Board", icon: Trophy, href: "/admin/winners", active: true },
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

export default function WinnersPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [winners, setWinners] = useState<WinnerRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [selectedEventId, setSelectedEventId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [registerNo, setRegisterNo] = useState("");
  const [department, setDepartment] = useState("CSE");
  const [position, setPosition] = useState<"winner" | "runner_up" | "special_mention">("winner");

  useEffect(() => {
    // Sync published events
    const storedEvents = localStorage.getItem("rit_events");
    if (storedEvents) {
      setEvents(JSON.parse(storedEvents));
    }

    // Sync winner declarations
    const storedWinners = localStorage.getItem("rit_declared_winners");
    if (storedWinners) {
      setWinners(JSON.parse(storedWinners));
    } else {
      setWinners(DEFAULT_WINNERS);
      localStorage.setItem("rit_declared_winners", JSON.stringify(DEFAULT_WINNERS));
    }
  }, []);

  const handleDeclareWinner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;

    setLoading(true);

    const event = events.find(ev => ev.id === selectedEventId) || { title: "Custom Event" };
    const pointsAwarded = position === "winner" ? 50 : position === "runner_up" ? 30 : 10;

    setTimeout(() => {
      const newWinner: WinnerRow = {
        id: `win-${Math.random().toString()}`,
        eventId: selectedEventId,
        eventTitle: event.title,
        studentName,
        registerNo,
        department,
        position,
        pointsAwarded,
        declaredAt: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
      };

      const updated = [newWinner, ...winners];
      setWinners(updated);
      localStorage.setItem("rit_declared_winners", JSON.stringify(updated));

      // Trigger user achievements / notification alert trigger
      const currentNotes = JSON.parse(localStorage.getItem("rit_notifications") || "[]");
      currentNotes.unshift({
        id: Math.random().toString(),
        title: "Winner Declared!",
        message: `${studentName} (${department}) secured ${position.replace("_", " ")} in ${event.title}, earning +${pointsAwarded} points!`,
        type: "winner_declared",
        date: "Just Now",
        read: false
      });
      localStorage.setItem("rit_notifications", JSON.stringify(currentNotes));

      // Reset form
      setSelectedEventId("");
      setStudentName("");
      setRegisterNo("");
      setPosition("winner");
      setLoading(false);
    }, 1000);
  };

  const removeWinner = (id: string) => {
    if (confirm("Are you sure you want to revoke this winner status? Points will be deducted.")) {
      const updated = winners.filter(w => w.id !== id);
      setWinners(updated);
      localStorage.setItem("rit_declared_winners", JSON.stringify(updated));
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--background)]">
      <Sidebar />
      <main className="lg:ml-[var(--sidebar-width)] min-h-[100dvh] pb-16">
        
        {/* Header */}
        <header className="sticky top-0 z-20 glass border-b border-[var(--surface-border)] px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Winner Declarations</h1>
            <p className="text-xs text-[var(--foreground-muted)]">Declare positions, award points, and trigger achievement banners</p>
          </div>
        </header>

        {/* Content grid */}
        <div className="px-6 lg:px-8 py-8 space-y-8 max-w-5xl mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Input Form (5 cols) */}
            <div className="lg:col-span-5">
              <motion.div variants={fadeUp} initial="hidden" animate="visible" className="card-bezel">
                <form onSubmit={handleDeclareWinner} className="card-bezel-inner p-5 space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5 border-b border-[var(--surface-border)] pb-2.5"><Trophy weight="fill" className="text-[var(--accent)]" /> Declare Event Winner</h3>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--foreground-secondary)]">Select Event</label>
                    <select 
                      required value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    >
                      <option value="">Choose an active event...</option>
                      {events.map((ev: any) => (
                        <option key={ev.id} value={ev.id}>{ev.title} ({ev.department})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--foreground-secondary)]">Student or Team Name</label>
                    <input 
                      type="text" required placeholder="e.g. Varun K. or CyberKnights"
                      value={studentName} onChange={e => setStudentName(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--foreground-secondary)]">Register Number</label>
                      <input 
                        type="text" required placeholder="211621104012"
                        value={registerNo} onChange={e => setRegisterNo(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--foreground-secondary)]">Department</label>
                      <select value={department} onChange={e => setDepartment(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]">
                        <option value="CSE">CSE</option>
                        <option value="ECE">ECE</option>
                        <option value="AIML">AIML</option>
                        <option value="AIDS">AIDS</option>
                        <option value="Biotech">Biotech</option>
                        <option value="Mech">Mech</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--foreground-secondary)]">Award Position</label>
                    <select value={position} onChange={e => setPosition(e.target.value as any)}
                      className="w-full p-2.5 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]">
                      <option value="winner">Winner (50 Points)</option>
                      <option value="runner_up">Runner Up (30 Points)</option>
                      <option value="special_mention">Special Mention (10 Points)</option>
                    </select>
                  </div>

                  <button 
                    type="submit" disabled={loading || !selectedEventId}
                    className="w-full py-2.5 bg-[var(--cta)] hover:bg-[var(--cta-hover)] text-white text-xs font-bold rounded-xl transition-all shadow-[var(--shadow-cta-glow)] flex items-center justify-center"
                  >
                    {loading ? "Publishing winner..." : "Declare Winner"}
                  </button>

                </form>
              </motion.div>
            </div>

            {/* Winners Board logs (7 cols) */}
            <div className="lg:col-span-7">
              <div className="card-bezel">
                <div className="card-bezel-inner">
                  <div className="px-6 py-4 border-b border-[var(--surface-border)]">
                    <h3 className="text-sm font-semibold flex items-center gap-1.5"><ListChecks /> Declared Winners History</h3>
                  </div>

                  <div className="divide-y divide-[var(--surface-border)] max-h-96 overflow-y-auto">
                    {winners.length > 0 ? (
                      winners.map((w) => (
                        <div key={w.id} className="flex items-center justify-between px-6 py-4 hover:bg-[var(--surface-subtle)] transition-colors">
                          <div className="space-y-1 pr-4">
                            <div className="text-xs font-semibold text-[var(--foreground)]">{w.studentName} ({w.department})</div>
                            <div className="text-[10px] text-[var(--foreground-muted)]">{w.eventTitle}</div>
                            <div className="text-[9px] text-[var(--foreground-muted)]">Reg No: {w.registerNo} • {w.declaredAt}</div>
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                w.position === "winner" ? "bg-amber-500/10 text-amber-500" :
                                w.position === "runner_up" ? "bg-slate-400/10 text-slate-400" :
                                "bg-amber-700/10 text-amber-700"
                              }`}>
                                {w.position.replace("_", " ")}
                              </span>
                              <div className="text-[10px] font-mono font-bold text-[var(--accent)] mt-0.5">+{w.pointsAwarded} pts</div>
                            </div>
                            
                            <button 
                              onClick={() => removeWinner(w.id)}
                              className="p-1.5 border border-[var(--surface-border)] rounded-lg text-slate-400 hover:text-[var(--cta)] hover:border-[var(--cta)]/20 transition-colors"
                              title="Revoke Winner"
                            >
                              <Trash weight="bold" className="w-3.5 h-3.5" />
                            </button>
                          </div>

                        </div>
                      ))
                    ) : (
                      <div className="text-center py-16 text-xs text-[var(--foreground-muted)]">
                        No winners declared yet for this semester.
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
