"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import {
  QrCode,
  CheckCircle,
  Warning,
  MagnifyingGlass,
  Camera,
  CameraSlash,
  Clock,
  Trash,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/shared/Sidebar";

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT_EXPO } },
};

interface ScanLog {
  ticketId: string;
  studentName: string;
  eventTitle: string;
  time: string;
  status: "success" | "duplicate" | "invalid";
}

export default function QRScannerPage() {
  const [ticketId, setTicketId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [logs, setLogs] = useState<ScanLog[]>([]);
  
  // Real Camera States
  const [cameraActive, setCameraActive] = useState(false);
  
  // Custom Animations & Sound States
  const [showAnimation, setShowAnimation] = useState<"valid" | "wrong" | null>(null);
  const [animationData, setAnimationData] = useState<any>(null);

  // Scanner Instance Reference
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    // Load local logs
    const storedLogs = localStorage.getItem("rit_scanner_logs");
    if (storedLogs) {
      setLogs(JSON.parse(storedLogs));
    }
  }, []);

  // Web Audio Synthesizer: Success Chime
  const playSuccessChime = () => {
    if (typeof window === "undefined") return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playTone = (freq: number, startOffset: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime + startOffset);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startOffset + duration);
        
        osc.start(ctx.currentTime + startOffset);
        osc.stop(ctx.currentTime + startOffset + duration);
      };
      
      playTone(659.25, 0, 0.12); // E5
      playTone(880.00, 0.08, 0.22); // A5
    } catch (e) {
      console.warn("AudioContext error", e);
    }
  };

  // Web Audio Synthesizer: Error/Buzzer Sound
  const playBuzzerSound = () => {
    if (typeof window === "undefined") return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(98, ctx.currentTime); // low G
      osc2.type = "square";
      osc2.frequency.setValueAtTime(102, ctx.currentTime); // dissonant pair

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.4);
      osc2.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("AudioContext error", e);
    }
  };

  // Dynamic Camera Scanner Lifecycle
  useEffect(() => {
    if (cameraActive) {
      // Import library dynamically to bypass Next.js SSR build errors
      import("html5-qrcode").then(({ Html5Qrcode }) => {
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (width, height) => {
              const size = Math.min(width, height) * 0.7;
              return { width: size, height: size };
            }
          },
          (decodedText: string) => {
            // Stop scanning temporarily to avoid multiple immediate triggers
            handleScanTicket(decodedText);
          },
          () => {} // silent frame failures to keep logger clean
        ).catch((err) => {
          console.error("Scanner failed to start", err);
          setCameraActive(false);
        });
      });
    }

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => {
          scannerRef.current = null;
        }).catch((err: any) => console.error("Scanner failed to stop", err));
      }
    };
  }, [cameraActive]);

  const handleScanTicket = async (idToScan: string) => {
    if (!idToScan || scanning || showAnimation) return;
    setScanning(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Query database registration record by ticket_id
      const { data: reg } = await supabase
        .from("registrations")
        .select(`
          id,
          ticket_id,
          team_name,
          user_id,
          events(id, title),
          profiles(name, department, achievement_points),
          attendance(checked_in_at)
        `)
        .eq("ticket_id", idToScan.trim())
        .maybeSingle();

      if (reg) {
        const hasAttended = reg.attendance
          ? Array.isArray(reg.attendance)
            ? reg.attendance.length > 0
            : true
          : false;

        const regEvents = reg.events as any;
        const regProfiles = reg.profiles as any;

        const studentName = reg.team_name
          ? `${regProfiles?.name || "Student"} (Team: ${reg.team_name})`
          : regProfiles?.name || "Student";
        const eventTitle = regEvents?.title || "Unknown Event";

        if (hasAttended) {
          // DUPLICATE scan
          setAnimationData({
            status: "duplicate",
            ticketId: reg.ticket_id,
            studentName,
            eventTitle,
            message: "Duplicate ticket. Already checked in!",
          });
          setShowAnimation("wrong");
          playBuzzerSound();
          addLog(reg.ticket_id, studentName, eventTitle, "duplicate");
        } else {
          // VALID scan: Write attendance check-in
          const { error: attErr } = await supabase.from("attendance").insert({
            registration_id: reg.id,
            checked_in_by: user.id,
          });

          if (attErr) throw attErr;

          // Add +20 attendance achievement points
          await supabase
            .from("profiles")
            .update({ achievement_points: (regProfiles?.achievement_points || 0) + 20 })
            .eq("id", reg.user_id);

          // Dispatch real-time user notification
          await supabase.from("notifications").insert({
            user_id: reg.user_id,
            title: "Event Attendance Verified",
            message: `Checked in successfully for ${eventTitle}! (+20 Points)`,
            type: "ticket_generated",
            related_event_id: regEvents?.id,
          });

          setAnimationData({
            status: "success",
            ticketId: reg.ticket_id,
            studentName,
            eventTitle,
            message: "Ticket authorized successfully!",
          });
          setShowAnimation("valid");
          playSuccessChime();
          addLog(reg.ticket_id, studentName, eventTitle, "success");
        }
      } else {
        // INVALID scan
        setAnimationData({
          status: "invalid",
          ticketId: idToScan,
          message: "Ticket does not exist in our system database.",
        });
        setShowAnimation("wrong");
        playBuzzerSound();
        addLog(idToScan, "Unknown Profile", "N/A", "invalid");
      }
    } catch (err: any) {
      console.error(err);
      setAnimationData({
        status: "invalid",
        ticketId: idToScan,
        message: err.message || "An unexpected scanning verification error occurred.",
      });
      setShowAnimation("wrong");
      playBuzzerSound();
      addLog(idToScan, "Error", "N/A", "invalid");
    } finally {
      setScanning(false);
      setTicketId("");
    }
  };

  const addLog = (
    ticketId: string,
    studentName: string,
    eventTitle: string,
    status: "success" | "duplicate" | "invalid"
  ) => {
    const newLog: ScanLog = {
      ticketId,
      studentName,
      eventTitle,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      status,
    };
    setLogs((prev) => {
      const updated = [newLog, ...prev].slice(0, 15);
      localStorage.setItem("rit_scanner_logs", JSON.stringify(updated));
      return updated;
    });
  };

  const clearLogs = () => {
    setLogs([]);
    localStorage.removeItem("rit_scanner_logs");
  };

  return (
    <div className="min-h-[100dvh] bg-transparent">
      <Sidebar />
      <main className="lg:ml-[var(--sidebar-width)] min-h-[100dvh] pb-16">
        
        {/* Header */}
        <header className="sticky top-0 z-20 glass border-b border-[var(--surface-border)] px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">QR Attendance Scanner</h1>
            <p className="text-xs text-[var(--foreground-muted)]">
              Check in registered students dynamically using active camera scanners
            </p>
          </div>
        </header>

        <div className="px-6 lg:px-8 py-8 space-y-8 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Viewport & Scanner Controls (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Camera Scanner Viewport */}
              <div className="card-bezel overflow-hidden">
                <div className="card-bezel-inner p-4 bg-black aspect-square flex flex-col justify-between relative">
                  {/* Camera overlay corners */}
                  <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-[var(--accent)] z-10" />
                  <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-[var(--accent)] z-10" />
                  <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-[var(--accent)] z-10" />
                  <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-[var(--accent)] z-10" />

                  {/* Laser line scanning effect */}
                  {cameraActive && (
                    <motion.div
                      initial={{ y: "15%" }}
                      animate={{ y: "85%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute left-6 right-6 h-0.5 bg-[var(--accent)] shadow-[0_0_12px_rgba(118,171,174,0.8)] z-10"
                    />
                  )}

                  {/* Camera Lens Wrapper */}
                  <div className="absolute inset-0 z-0 overflow-hidden flex items-center justify-center">
                    {cameraActive ? (
                      <div id="qr-reader" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center">
                        <QrCode weight="light" className="w-14 h-14 text-neutral-700 animate-pulse" />
                        <div className="text-xs text-neutral-500 max-w-[200px] leading-relaxed">
                          Camera feed offline. Click button below to prompt permissions and scan.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Lens Status Indicator */}
                  <div className="absolute top-4 left-4 z-10 text-[9px] font-bold tracking-wider font-mono px-2 py-0.5 rounded bg-black/75 border border-white/5 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${cameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    {cameraActive ? "LENS: CAMERA ACTIVE" : "LENS: STANDBY"}
                  </div>

                  {/* Toggle Camera Scan Trigger */}
                  <div className="w-full mt-auto z-10">
                    <button
                      onClick={() => setCameraActive(!cameraActive)}
                      className={`w-full py-3 flex items-center justify-center gap-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                        cameraActive
                          ? "bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_16px_rgba(239,68,68,0.25)]"
                          : "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black shadow-[var(--shadow-accent-glow)]"
                      }`}
                    >
                      {cameraActive ? (
                        <>
                          <CameraSlash weight="bold" className="w-4 h-4" /> Stop Scanner
                        </>
                      ) : (
                        <>
                          <Camera weight="bold" className="w-4 h-4" /> Initialize Camera
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Manual Input form */}
              <div className="card-bezel">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleScanTicket(ticketId);
                  }}
                  className="card-bezel-inner p-5 space-y-3"
                >
                  <label className="text-xs font-semibold text-[var(--foreground-secondary)]">
                    Manual Ticket Verification
                  </label>
                  <div className="relative">
                    <MagnifyingGlass weight="light" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. EVT-2026-784912"
                      value={ticketId}
                      onChange={(e) => setTicketId(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={scanning || !ticketId}
                    className="w-full py-2 bg-[var(--surface)] hover:bg-[var(--surface-subtle)] text-[var(--foreground)] border border-[var(--surface-border)] text-xs font-semibold rounded-lg transition-colors active:scale-[0.98] cursor-pointer"
                  >
                    {scanning ? "Validating ID..." : "Submit Code ID"}
                  </button>
                </form>
              </div>
            </div>

            {/* Logs panel (7 cols) */}
            <div className="lg:col-span-7">
              <div className="card-bezel">
                <div className="card-bezel-inner">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--surface-border)]">
                    <h3 className="text-sm font-semibold">Attendance Checking Records</h3>
                    {logs.length > 0 && (
                      <button
                        onClick={clearLogs}
                        className="text-xs text-[var(--cta)] font-semibold hover:bg-[var(--cta-muted)] px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash weight="light" className="w-3.5 h-3.5" /> Clear logs
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-[var(--surface-border)] max-h-[30rem] overflow-y-auto">
                    {logs.length > 0 ? (
                      logs.map((l, index) => (
                        <div key={index} className="flex items-center justify-between px-6 py-3.5 text-xs">
                          <div className="space-y-0.5 pr-4">
                            <div className="font-semibold text-white">
                              {l.studentName}
                            </div>
                            <div className="text-[10px] text-[var(--foreground-muted)] flex items-center gap-1.5">
                              <span>Ticket: <span className="font-mono font-bold text-neutral-400">{l.ticketId}</span></span>
                              <span>•</span>
                              <span>{l.eventTitle}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0 space-y-1">
                            <span className="text-[9px] text-[var(--foreground-muted)] flex items-center gap-1 justify-end">
                              <Clock weight="light" className="w-3 h-3" /> {l.time}
                            </span>
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                l.status === "success"
                                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                  : l.status === "duplicate"
                                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                  : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                              }`}
                            >
                              {l.status}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-16 text-xs text-[var(--foreground-muted)]">
                        No check-in operations recorded in standby log.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* POP-OUT TICKET ANIMATION MODAL INTERFACES */}
      <AnimatePresence>
        {showAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            {showAnimation === "valid" ? (
              /* Success Valid Entry Card Ticket */
              <motion.div
                initial={{ scale: 0.5, y: 50, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  y: 0, 
                  opacity: 1,
                  transition: { type: "spring", damping: 15 }
                }}
                exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.2 } }}
                className="relative w-full max-w-sm bg-gradient-to-br from-neutral-900 to-black border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.25)] rounded-3xl overflow-hidden p-6 text-center space-y-6"
              >
                {/* Decorative border line */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-400" />
                
                {/* Checkmark circle */}
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.2)]">
                  <CheckCircle weight="fill" className="w-9 h-9" />
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-extrabold tracking-widest text-emerald-400">
                    Valid Entry Ticket
                  </div>
                  <h3 className="font-display font-black text-xl tracking-tight text-white line-clamp-1">
                    {animationData?.studentName}
                  </h3>
                </div>

                {/* Dotted pass cutout separator */}
                <div className="flex items-center gap-2">
                  <div className="w-4 h-8 rounded-r-full bg-black/80 border-r border-emerald-500/20 -ml-8" />
                  <div className="flex-1 border-t-2 border-dashed border-emerald-500/20" />
                  <div className="w-4 h-8 rounded-l-full bg-black/80 border-l border-emerald-500/20 -mr-8" />
                </div>

                {/* Verified entry description details */}
                <div className="space-y-4 text-xs text-neutral-300 text-left bg-neutral-950 p-4 rounded-2xl border border-white/5 font-mono">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider block">Target Event</span>
                      <span className="font-semibold text-white truncate block">{animationData?.eventTitle}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider block">Ticket ID</span>
                      <span className="font-bold text-emerald-400 block">{animationData?.ticketId}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-3">
                    <div>
                      <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider block">Scan Result</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1 text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        CHECKED IN
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider block">Award Points</span>
                      <span className="text-emerald-400 font-bold">+20 Points</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowAnimation(null)}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer"
                >
                  Scan Next Ticket
                </button>
              </motion.div>
            ) : (
              /* Failure / Invalid / Duplicate Error Card */
              <motion.div
                initial={{ scale: 0.5, y: 50, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  y: 0, 
                  opacity: 1,
                  x: [0, -12, 12, -12, 12, 0],
                  transition: { 
                    type: "spring", 
                    damping: 10,
                    x: { duration: 0.4, delay: 0.05 }
                  }
                }}
                exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.2 } }}
                className="relative w-full max-w-sm bg-gradient-to-br from-neutral-900 to-black border border-rose-500/30 shadow-[0_0_50px_rgba(239,68,68,0.25)] rounded-3xl overflow-hidden p-6 text-center space-y-6"
              >
                {/* Decorative border line */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 to-red-600" />
                
                {/* Danger exclamation circle */}
                <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-500 shadow-[0_0_24px_rgba(239,68,68,0.2)]">
                  <Warning weight="fill" className="w-9 h-9" />
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-extrabold tracking-widest text-rose-500">
                    {animationData?.status === "duplicate" ? "Duplicate Entry" : "Invalid Ticket"}
                  </div>
                  <h3 className="font-display font-bold text-sm tracking-tight text-white leading-relaxed">
                    {animationData?.message}
                  </h3>
                </div>

                {/* Dotted pass cutout separator */}
                <div className="flex items-center gap-2">
                  <div className="w-4 h-8 rounded-r-full bg-black/80 border-r border-rose-500/20 -ml-8" />
                  <div className="flex-1 border-t-2 border-dashed border-rose-500/20" />
                  <div className="w-4 h-8 rounded-l-full bg-black/80 border-l border-rose-500/20 -mr-8" />
                </div>

                {/* Ticket ID metadata description */}
                <div className="space-y-3.5 text-xs text-neutral-300 text-left bg-neutral-950 p-4 rounded-2xl border border-white/5 font-mono">
                  <div>
                    <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider block">Attempted Ticket ID</span>
                    <span className="text-rose-400 font-bold block">{animationData?.ticketId}</span>
                  </div>
                  {animationData?.studentName && (
                    <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-3">
                      <div>
                        <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider block">Registered to</span>
                        <span className="font-semibold text-white truncate block">{animationData?.studentName}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider block">Event</span>
                        <span className="font-semibold text-white truncate block">{animationData?.eventTitle}</span>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowAnimation(null)}
                  className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] cursor-pointer"
                >
                  Retry Scan
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
