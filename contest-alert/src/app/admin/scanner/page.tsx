"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Lightning, CalendarCheck, Ticket, Trophy, Bell, SignOut,
  QrCode, ClipboardText, Users, House, Sun, Moon,
  Scan, MagnifyingGlass, CheckCircle, Warning, User, IdentificationCard
} from "@phosphor-icons/react";
import { useTheme } from "@/components/shared/ThemeProvider";

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT_EXPO } }
};

interface ScanLog {
  ticketId: string;
  studentName: string;
  eventTitle: string;
  time: string;
  status: "success" | "duplicate" | "invalid";
}

const NAV_ITEMS = [
  { label: "Admin Panel", icon: House, href: "/admin" },
  { label: "Manage Events", icon: CalendarCheck, href: "/admin/events" },
  { label: "QR Scanner", icon: QrCode, href: "/admin/scanner", active: true },
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

export default function QRScannerPage() {
  const [ticketId, setTicketId] = useState("");
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [scanning, setScanning] = useState(false);
  
  // Loaded list of tickets to validate against
  const [allTickets, setAllTickets] = useState<any[]>([]);

  useEffect(() => {
    // Fetch all current registrations/tickets
    const storedTickets = localStorage.getItem("rit_tickets");
    if (storedTickets) {
      setAllTickets(JSON.parse(storedTickets));
    }
    // Load local scanner logs if any
    const storedLogs = localStorage.getItem("rit_scanner_logs");
    if (storedLogs) {
      setLogs(JSON.parse(storedLogs));
    }
  }, []);

  const handleScanTicket = (idToScan: string) => {
    if (!idToScan) return;
    setScanning(true);
    setScanResult(null);

    setTimeout(() => {
      setScanning(false);
      const ticket = allTickets.find(t => t.id.toLowerCase() === idToScan.trim().toLowerCase());
      
      const attendanceList = JSON.parse(localStorage.getItem("rit_attendance") || "[]");
      const isAlreadyCheckedIn = attendanceList.includes(idToScan.trim());

      if (ticket) {
        if (isAlreadyCheckedIn) {
          // Flag as duplicate
          setScanResult({
            status: "duplicate",
            ticketId: ticket.id,
            studentName: ticket.teamName ? `Team: ${ticket.teamName}` : "Varun (Student)",
            eventTitle: ticket.title,
            message: "This ticket has already been checked in!"
          });
          addLog(ticket.id, ticket.teamName || "Varun", ticket.title, "duplicate");
        } else {
          // Success
          attendanceList.push(ticket.id);
          localStorage.setItem("rit_attendance", JSON.stringify(attendanceList));

          setScanResult({
            status: "success",
            ticketId: ticket.id,
            studentName: ticket.teamName ? `Team: ${ticket.teamName}` : "Varun (Student)",
            eventTitle: ticket.title,
            message: "Attendance marked successfully!"
          });
          addLog(ticket.id, ticket.teamName || "Varun", ticket.title, "success");
        }
      } else {
        // Invalid
        setScanResult({
          status: "invalid",
          ticketId: idToScan,
          message: "Ticket ID does not exist in registrations."
        });
        addLog(idToScan, "Unknown", "N/A", "invalid");
      }
      setTicketId("");
    }, 1000);
  };

  const addLog = (ticketId: string, studentName: string, eventTitle: string, status: "success" | "duplicate" | "invalid") => {
    const newLog: ScanLog = {
      ticketId,
      studentName,
      eventTitle,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      status
    };
    const updated = [newLog, ...logs].slice(0, 15);
    setLogs(updated);
    localStorage.setItem("rit_scanner_logs", JSON.stringify(updated));
  };

  // Quick simulate helper
  const simulateRandomScan = () => {
    if (allTickets.length === 0) {
      alert("No student registrations exist. Register for an event first!");
      return;
    }
    const randomIndex = Math.floor(Math.random() * allTickets.length);
    const selected = allTickets[randomIndex];
    handleScanTicket(selected.id);
  };

  const clearLogs = () => {
    setLogs([]);
    localStorage.removeItem("rit_scanner_logs");
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--background)]">
      <Sidebar />
      <main className="lg:ml-[var(--sidebar-width)] min-h-[100dvh] pb-16">
        
        {/* Header */}
        <header className="sticky top-0 z-20 glass border-b border-[var(--surface-border)] px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">QR Attendance Scanner</h1>
            <p className="text-xs text-[var(--foreground-muted)]">Check-in students by scanning tickets or entering ticket IDs</p>
          </div>
        </header>

        <div className="px-6 lg:px-8 py-8 space-y-8 max-w-5xl mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Viewport & Scanner Controls (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Mock Viewport */}
              <div className="card-bezel overflow-hidden">
                <div className="card-bezel-inner p-4 bg-black aspect-square flex flex-col justify-between relative">
                  
                  {/* Camera overlay corners */}
                  <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-[var(--accent)]" />
                  <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-[var(--accent)]" />
                  <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-[var(--accent)]" />
                  <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-[var(--accent)]" />
                  
                  {/* Laser line animation */}
                  {scanning && (
                    <motion.div 
                      initial={{ y: "15%" }}
                      animate={{ y: "85%" }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="absolute left-6 right-6 h-0.5 bg-[var(--accent)] shadow-[0_0_8px_var(--accent)] z-10" 
                    />
                  )}

                  <div className="text-[10px] text-emerald-500 font-semibold tracking-wider font-mono self-start bg-black/40 px-2 py-0.5 rounded">
                    LENS: MOCK_CAMERA_1
                  </div>

                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <Scan className="w-12 h-12 text-neutral-600 animate-pulse" />
                    <p className="text-[11px] text-neutral-500 font-medium text-center max-w-xs">
                      Align ticket QR code within frames or click simulation button below.
                    </p>
                  </div>

                  <button 
                    onClick={simulateRandomScan}
                    className="w-full py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black text-xs font-bold rounded-xl transition-all shadow-[var(--shadow-accent-glow)] z-10 uppercase tracking-wider"
                  >
                    Simulate QR Scan
                  </button>

                </div>
              </div>

              {/* Manual Input form */}
              <div className="card-bezel">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleScanTicket(ticketId); }}
                  className="card-bezel-inner p-5 space-y-3"
                >
                  <label className="text-xs font-semibold text-[var(--foreground-secondary)]">Manual Ticket ID Verification</label>
                  <div className="relative">
                    <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
                    <input 
                      type="text" required placeholder="e.g. EVT-2026-784912"
                      value={ticketId} onChange={e => setTicketId(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" 
                    />
                  </div>
                  <button 
                    type="submit" disabled={scanning || !ticketId}
                    className="w-full py-2 bg-[var(--surface)] hover:bg-[var(--surface-subtle)] text-[var(--foreground)] border border-[var(--surface-border)] text-xs font-semibold rounded-lg transition-colors"
                  >
                    {scanning ? "Verifying..." : "Verify Ticket"}
                  </button>
                </form>
              </div>

            </div>

            {/* Results & Logs panel (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Scan result notification banner */}
              {scanResult && (
                <motion.div 
                  initial={{ scale: 0.98, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="card-bezel"
                >
                  <div className={`card-bezel-inner p-6 space-y-4 rounded-xl border ${
                    scanResult.status === "success" ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500" :
                    scanResult.status === "duplicate" ? "bg-amber-500/5 border-amber-500/20 text-amber-500" :
                    "bg-red-500/5 border-red-500/20 text-red-500"
                  }`}>
                    
                    <div className="flex gap-3 items-start">
                      {scanResult.status === "success" ? <CheckCircle weight="fill" className="w-6 h-6 shrink-0" /> : <Warning weight="fill" className="w-6 h-6 shrink-0" />}
                      <div className="space-y-1 text-xs">
                        <div className="font-bold text-sm text-[var(--foreground)] uppercase tracking-wide">
                          {scanResult.status === "success" ? "Ticket Verified" : scanResult.status === "duplicate" ? "Duplicate Scan" : "Invalid Ticket"}
                        </div>
                        <p className="text-[var(--foreground-secondary)]">{scanResult.message}</p>
                      </div>
                    </div>

                    {scanResult.status !== "invalid" && (
                      <div className="grid grid-cols-2 gap-4 border-t border-[var(--surface-border)] pt-4 text-xs text-[var(--foreground-secondary)]">
                        <div>
                          <span className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-wider block">Student / Team</span>
                          <span className="font-bold">{scanResult.studentName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-wider block">Event Title</span>
                          <span className="font-bold">{scanResult.eventTitle}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Logs */}
              <div className="card-bezel">
                <div className="card-bezel-inner">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--surface-border)]">
                    <h3 className="text-sm font-semibold">Attendance Scanning Logs</h3>
                    {logs.length > 0 && (
                      <button onClick={clearLogs} className="text-xs text-[var(--cta)] font-medium hover:bg-[var(--cta-muted)] px-2.5 py-1.5 rounded-lg transition-colors">
                        Clear logs
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-[var(--surface-border)] max-h-96 overflow-y-auto">
                    {logs.length > 0 ? (
                      logs.map((l, index) => (
                        <div key={index} className="flex items-center justify-between px-6 py-3.5 text-xs">
                          <div className="space-y-0.5">
                            <div className="font-semibold">{l.studentName} • <span className="font-mono text-[11px] text-[var(--foreground-muted)]">{l.ticketId}</span></div>
                            <div className="text-[10px] text-[var(--foreground-muted)]">{l.eventTitle}</div>
                          </div>
                          <div className="text-right shrink-0 space-y-1">
                            <span className="text-[9px] text-[var(--foreground-muted)] block">{l.time}</span>
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              l.status === "success" ? "bg-emerald-500/10 text-emerald-500" :
                              l.status === "duplicate" ? "bg-amber-500/10 text-amber-500" :
                              "bg-red-500/10 text-red-500"
                            }`}>
                              {l.status}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-16 text-xs text-[var(--foreground-muted)]">
                        No logs recorded yet. Start scanning to verify.
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
