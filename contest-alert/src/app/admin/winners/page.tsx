"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Trophy, ListChecks, Trash } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/shared/Sidebar";

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

  const loadEventsAndWinners = async () => {
    try {
      const supabase = createClient();
      // Load active events
      const { data: activeEvents } = await supabase
        .from("events")
        .select("id, title, department")
        .eq("status", "active");
      if (activeEvents) {
        setEvents(activeEvents);
      }

      // Load winners joined with events and profiles
      const { data: dbWinners } = await supabase
        .from("winners")
        .select(`
          id,
          event_id,
          position,
          declared_at,
          events(title),
          profiles(name, register_number, department)
        `)
        .order("declared_at", { ascending: false });

      if (dbWinners) {
        const parsed: WinnerRow[] = dbWinners.map((w: any) => {
          const pointsAwarded = w.position === "winner" ? 50 : w.position === "runner_up" ? 30 : 10;
          return {
            id: w.id,
            eventId: w.event_id,
            eventTitle: w.events?.title || "Unknown Event",
            studentName: w.profiles?.name || "Student",
            registerNo: w.profiles?.register_number || "N/A",
            department: w.profiles?.department || "N/A",
            position: w.position,
            pointsAwarded,
            declaredAt: w.declared_at ? new Date(w.declared_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "N/A"
          };
        });
        setWinners(parsed);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadEventsAndWinners();
  }, []);

  const handleDeclareWinner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;

    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find profile by registerNo
      const { data: student, error: profileErr } = await supabase
        .from("profiles")
        .select("id, name, department, achievement_points")
        .eq("register_number", registerNo.trim())
        .maybeSingle();

      if (!student) {
        alert("Student profile with this register number does not exist! Please check and try again.");
        setLoading(false);
        return;
      }

      // Insert winner
      const { error: winnerErr } = await supabase
        .from("winners")
        .insert({
          event_id: selectedEventId,
          user_id: student.id,
          position: position,
          declared_by: user.id
        });

      if (winnerErr) {
        throw winnerErr;
      }

      // Increment achievement points
      const pointsAwarded = position === "winner" ? 50 : position === "runner_up" ? 30 : 10;
      await supabase
        .from("profiles")
        .update({ achievement_points: (student.achievement_points || 0) + pointsAwarded })
        .eq("id", student.id);

      // Create notification
      const event = events.find(ev => ev.id === selectedEventId) || { title: "Event" };
      await supabase
        .from("notifications")
        .insert({
          user_id: student.id,
          title: "Winner Declared!",
          message: `Congratulations! You secured ${position.replace("_", " ")} in ${event.title}, earning +${pointsAwarded} points!`,
          type: "winner_declared",
          related_event_id: selectedEventId
        });

      // Reload
      await loadEventsAndWinners();

      // Reset form
      setSelectedEventId("");
      setStudentName("");
      setRegisterNo("");
      setPosition("winner");
    } catch (err) {
      console.error(err);
      alert("Error declaring winner: " + (err as any).message);
    } finally {
      setLoading(false);
    }
  };

  const removeWinner = async (id: string) => {
    if (confirm("Are you sure you want to revoke this winner status? Points will be deducted.")) {
      try {
        const supabase = createClient();
        // Fetch winner details to deduct points
        const { data: winnerData } = await supabase
          .from("winners")
          .select("user_id, position")
          .eq("id", id)
          .maybeSingle();

        if (winnerData) {
          const { error: deleteErr } = await supabase
            .from("winners")
            .delete()
            .eq("id", id);

          if (!deleteErr) {
            // Deduct points
            const pointsToDeduct = winnerData.position === "winner" ? 50 : winnerData.position === "runner_up" ? 30 : 10;
            const { data: student } = await supabase
              .from("profiles")
              .select("achievement_points")
              .eq("id", winnerData.user_id)
              .maybeSingle();

            if (student) {
              await supabase
                .from("profiles")
                .update({ achievement_points: Math.max(0, (student.achievement_points || 0) - pointsToDeduct) })
                .eq("id", winnerData.user_id);
            }

            setWinners(prev => prev.filter(w => w.id !== id));
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="min-h-[100dvh] bg-transparent">
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
                  <h3 className="text-sm font-semibold flex items-center gap-1.5 border-b border-[var(--surface-border)] pb-2.5">
                    <Trophy weight="light" className="text-[var(--accent)] w-5 h-5" /> Declare Event Winner
                  </h3>
                  
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
                  <div className="px-6 py-4 border-b border-[var(--surface-border)] flex items-center gap-2">
                    <ListChecks weight="light" className="w-5 h-5 text-[var(--foreground)]" />
                    <h3 className="text-sm font-semibold">Declared Winners History</h3>
                  </div>

                  <div className="divide-y divide-[var(--surface-border)] max-h-[30rem] overflow-y-auto">
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
                              className="p-1.5 border border-[var(--surface-border)] rounded-lg text-slate-400 hover:text-[var(--cta)] hover:border-[var(--cta)]/20 transition-colors animate-press"
                              title="Revoke Winner"
                            >
                              <Trash weight="light" className="w-4 h-4" />
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
