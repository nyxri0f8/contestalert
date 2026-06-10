"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Lightning,
  Trophy,
  Users,
  CalendarCheck,
  ArrowRight,
  GraduationCap,
  Ticket,
  ChartLineUp,
  MagnifyingGlass,
  Bell,
  Sun,
  Moon,
  List,
  X,
  MapPin,
  Clock,
  CaretRight,
  Star,
  Sparkle,
  Bookmark,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useTheme } from "@/components/shared/ThemeProvider";

// ============================================================
// ANIMATION VARIANTS (custom cubic-bezier)
// ============================================================

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.7, ease: EASE_OUT_EXPO },
  },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1, scale: 1,
    transition: { duration: 0.5, ease: EASE_OUT_EXPO },
  },
};

// ============================================================
// ACADEMIC & INSTITUTIONAL MOCK DATA
// ============================================================

const MOCK_ANNOUNCEMENTS = [
  { id: "1", title: "Circular: Registration open for Smart India Hackathon internal rounds", date: "June 12, 2026", urgent: true },
  { id: "2", title: "National Level Project Symposium 'INNOFEST 2026' schedule announced", date: "June 18, 2026", urgent: false },
  { id: "3", title: "Important: Attendance guidelines updated for all co-curricular contests", date: "June 20, 2026", urgent: false },
];

const MOCK_STATS = [
  { label: "Co-curricular Events", value: "24", icon: CalendarCheck, color: "var(--accent)" },
  { label: "Student Enrollments", value: "4,827", icon: Users, color: "var(--accent)" },
  { label: "Total Branch Points", value: "12,340", icon: Trophy, color: "var(--cta)" },
  { label: "Accredited Programs", value: "7", icon: GraduationCap, color: "var(--cta)" },
];

const MOCK_EVENTS = [
  {
    id: "1", title: "CodeStorm Hackathon 2026", category: "Hackathon",
    department: "CSE", date: "Jun 28, 2026", venue: "Main Auditorium",
    seats: 42, deadline: "safe" as const, coordinator: "Dr. A. Ramesh",
    image: "https://picsum.photos/seed/hackathon2026/800/500",
  },
  {
    id: "2", title: "AI Workshop: Transformers & Beyond", category: "Workshop",
    department: "AIML", date: "Jul 5, 2026", venue: "Lab Block C-301",
    seats: 18, deadline: "warn" as const, coordinator: "Mrs. S. Priya",
    image: "https://picsum.photos/seed/aiworkshop/800/500",
  },
  {
    id: "3", title: "Placement Prep Bootcamp", category: "Placement",
    department: "All Depts", date: "Jul 12, 2026", venue: "Seminar Hall A",
    seats: 120, deadline: "safe" as const, coordinator: "Mr. K. Selvam",
    image: "https://picsum.photos/seed/placement2026/800/500",
  },
  {
    id: "4", title: "RoboWars Championship", category: "Technical",
    department: "ECE", date: "Jun 22, 2026", venue: "Open Ground",
    seats: 6, deadline: "critical" as const, coordinator: "Dr. M. Vinoth",
    image: "https://picsum.photos/seed/robowars/800/500",
  },
];

const MOCK_LEADERBOARD = [
  { rank: 1, department: "CSE", full: "Computer Science & Engineering", points: 2840, registrations: 892, badge: "Event Leaders" },
  { rank: 2, department: "ECE", full: "Electronics & Communication", points: 2310, registrations: 714, badge: "Innovation Hub" },
  { rank: 3, department: "AIML", full: "AI & Machine Learning", points: 1980, registrations: 645, badge: "Rising Star" },
  { rank: 4, department: "AIDS", full: "AI & Data Science", points: 1720, registrations: 534, badge: null },
  { rank: 5, department: "CCE", full: "Computer & Communication", points: 1450, registrations: 412, badge: null },
  { rank: 6, department: "BT", full: "Biotechnology", points: 1120, registrations: 298, badge: null },
  { rank: 7, department: "ME", full: "Mechanical Engineering", points: 890, registrations: 231, badge: null },
];

const MOCK_SPOTLIGHT = [
  { title: "Smart India Hackathon 2026 Winners", team: "Team CyberKnights (CSE)", award: "First Prize - ₹1,00,000 Cash Award", desc: "Designed an automated logistics dispatch software using AI for the Ministry of Ports, Shipping and Waterways." },
  { title: "IEEE International Conference Publication", team: "K. Vignesh (ECE, Final Year)", award: "Best Paper Publication Award", desc: "Presented a novel low-power sensor design for underwater environmental tracking applications at the annual IEEE convention." },
  { title: "National Robotics Championship", team: "Team RIT Robo (ECE & Mech)", award: "Overall Runners-Up Trophy", desc: "Successfully built a combat-ready robotic chassis with pneumatic weapon systems and cleared the active arena rounds." },
];

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

// ============================================================
// NAVBAR & TOP ANNOUNCEMENTS
// ============================================================

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Top Announcements Banner */}
      <div className="fixed top-0 left-0 right-0 h-9 bg-[var(--charcoal)] text-white text-xs flex items-center justify-center gap-3 z-50 px-4">
        <span className="bg-[var(--accent)] text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0">Circular</span>
        <div className="truncate font-medium">
          Smart India Hackathon 2026 internal submission deadline extended. Contact department coordinators for abstract reviews.
        </div>
      </div>

      <motion.nav
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
        className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] border ${
          scrolled
            ? "bg-white/70 backdrop-blur-xl border-white/70 shadow-[0_10px_30px_rgba(48,56,65,0.06)]"
            : "bg-white/45 backdrop-blur-md border-white/50 shadow-[0_4px_12px_rgba(48,56,65,0.02)]"
        }`}
        style={{ width: "min(92vw, 880px)" }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 pl-1">
          <div className="bg-white px-2 py-1 rounded-lg border border-neutral-100 shadow-sm flex items-center justify-center shrink-0">
            <img src="/images/logo.png" alt="RIT Logo" className="h-6 w-auto object-contain" />
          </div>
          <span className="text-[var(--surface-border)] font-normal">|</span>
          <span className="font-display font-extrabold text-[13px] tracking-tight block leading-none text-[var(--foreground)]">Contest Alert</span>
        </Link>

        <div className="flex-1" />

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-0.5">
          {["Events", "Leaderboard", "Spotlight", "About"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="px-3.5 py-1.5 text-[13px] font-medium text-[var(--foreground-secondary)] hover:text-[var(--foreground)] rounded-full hover:bg-[var(--surface-border)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
            >
              {item}
            </a>
          ))}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-border)] transition-all duration-300"
          aria-label="Toggle theme"
        >
          {resolvedTheme === "dark" ? <Sun weight="bold" className="w-4 h-4" /> : <Moon weight="bold" className="w-4 h-4" />}
        </button>

        {/* CTA Button — Student/Faculty Login */}
        <Link
          href="/login"
          className="group relative flex items-center gap-2 pl-4 pr-2 py-1.5 rounded-full bg-[var(--cta)] text-white text-[13px] font-semibold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[var(--shadow-cta-glow)] active:scale-[0.97]"
        >
          <span>Student Login</span>
          <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-105 transition-transform duration-300">
            <ArrowRight weight="bold" className="w-3 h-3" />
          </span>
        </Link>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--surface-border)] transition-all duration-300"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X weight="bold" className="w-4 h-4" /> : <List weight="bold" className="w-4 h-4" />}
        </button>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-[var(--background)]/95 backdrop-blur-3xl flex flex-col items-center justify-center gap-10"
          >
            {["Events", "Leaderboard", "Spotlight", "About"].map((item, i) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={() => setIsOpen(false)}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ delay: i * 0.06, duration: 0.4, ease: EASE_OUT_EXPO }}
                className="text-3xl font-display font-bold tracking-tight text-[var(--foreground)]"
              >
                {item}
              </motion.a>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4, ease: EASE_OUT_EXPO }}
            >
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[var(--cta)] text-white font-semibold"
              >
                Student Login <ArrowRight weight="bold" className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================
// ACADEMIC HERO SECTION
// ============================================================

function HeroSection() {
  return (
    <section className="relative min-h-[100dvh] flex items-center overflow-hidden pt-28 bg-[var(--background)]">
      {/* Liquid Gradient Orbs in Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[var(--accent)]/15 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[-10%] w-[450px] h-[450px] rounded-full bg-[var(--cta)]/10 blur-[120px]" />
        <div className="absolute top-[40%] left-[30%] w-[350px] h-[350px] rounded-full bg-[var(--accent)]/10 blur-[100px] animate-float" />
      </div>

      <div className="relative max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 z-10">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center"
        >
          {/* Left Content */}
          <div className="lg:col-span-7 space-y-8">
            <motion.div variants={fadeUp} className="space-y-6">
              <span className="eyebrow border border-[var(--surface-border)] text-[var(--accent-text)] bg-[var(--accent-muted)]/75 backdrop-blur-md">
                <span className="status-dot status-dot--teal animate-pulse" />
                Rajalakshmi Institute of Technology
              </span>

              <h1 className="!leading-[1.1] text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--foreground)] text-wrap-balance">
                Academic Event &
                <br />
                <span className="text-[var(--accent)]">Co-Curricular Hub</span>
              </h1>

              <p className="text-base sm:text-lg text-[var(--foreground-secondary)] max-w-[58ch] leading-relaxed">
                Centralized platform facilitating national hackathons, technical symposia, HOD seminars,
                and branch workshops. Link your competitive successes with official academic standings.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
              {/* Primary Login CTA — Button-in-Button Layout */}
              <Link
                href="/login"
                className="group relative inline-flex items-center gap-3 pl-7 pr-2 py-2 rounded-full bg-[var(--cta)] text-white font-semibold text-sm transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[var(--shadow-cta-glow)] hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Access Student Portal</span>
                <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-[1px] transition-transform duration-300">
                  <ArrowRight weight="bold" className="w-3.5 h-3.5" />
                </span>
              </Link>

              {/* Secondary Leaderboard link */}
              <a
                href="#leaderboard"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-[var(--surface-border)] bg-white/40 backdrop-blur-md text-sm font-medium text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:border-[var(--accent)] hover:bg-[var(--accent-muted)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02] active:scale-[0.98]"
              >
                <Trophy weight="duotone" className="w-4 h-4 text-[var(--accent)]" />
                Branch Standings
              </a>
            </motion.div>

            {/* Program Details */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-8 pt-2">
              {[
                { label: "B.E/B.Tech Students", value: "5,200+" },
                { label: "Accredited Programs", value: "7 Branches" },
                { label: "Active Co-curriculars", value: "142 Yearly" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-xl font-display font-bold tracking-tight text-[var(--foreground)]" style={{ fontFamily: "var(--font-mono)" }}>
                    {stat.value}
                  </div>
                  <div className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-wider font-semibold mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right Column: Notice Board & Circulars — Double-Bezel Nested Glass Card */}
          <motion.div variants={fadeUp} className="lg:col-span-5 relative hidden lg:block">
            <div className="card-bezel-elevated overflow-hidden bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_12px_40px_rgba(0,0,0,0.03)]">
              <div className="card-bezel-inner p-6 space-y-5 bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)]">
                <div className="flex items-center justify-between border-b border-[var(--surface-border)] pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-secondary)] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--cta)] animate-pulse" />
                    Notice Board & Circulars
                  </h3>
                  <span className="text-[10px] font-mono text-[var(--foreground-muted)]">Official Feed</span>
                </div>

                <div className="space-y-4">
                  {MOCK_ANNOUNCEMENTS.map((note) => (
                    <div key={note.id} className="p-4 rounded-xl border border-white/30 bg-white/20 hover:border-[var(--accent)]/30 transition-all duration-300">
                      <div className="flex justify-between items-start gap-3 mb-2">
                        <span className="text-[10px] text-[var(--foreground-muted)] font-semibold">{note.date}</span>
                        {note.urgent && (
                          <span className="text-[8px] bg-[var(--cta-muted)] text-[var(--cta)] px-2 py-0.5 rounded font-bold uppercase">Urgent</span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-[var(--foreground)] hover:text-[var(--accent)] transition-colors cursor-pointer leading-relaxed">
                        {note.title}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <Link href="/login" className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/20 border border-white/40 hover:bg-[var(--accent-muted)] hover:border-[var(--accent)]/30 text-xs font-semibold text-[var(--foreground-secondary)] hover:text-[var(--accent)] transition-all">
                    Access Academic Calendar
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================
// STATS BAR
// ============================================================

function StatsBar() {
  return (
    <section className="relative py-7 border-y border-[var(--surface-border)]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {MOCK_STATS.map((stat) => (
            <motion.div key={stat.label} variants={fadeUp} className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: `color-mix(in srgb, ${stat.color} 12%, transparent)` }}
              >
                <stat.icon weight="duotone" className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div>
                <div className="text-xl font-display font-bold tracking-tight" style={{ fontFamily: "var(--font-mono)" }}>
                  {stat.value}
                </div>
                <div className="text-[11px] text-[var(--foreground-muted)] font-medium">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================
// EVENTS SECTION — branch wise circulars
// ============================================================

function EventsSection() {
  return (
    <section id="events" className="py-[var(--space-section)]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="space-y-14"
        >
          {/* Header */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="space-y-3">
              <span className="eyebrow">
                <Sparkle weight="fill" className="w-3 h-3 text-[var(--accent)]" />
                Branch Circulars & Events
              </span>
              <h2>Upcoming Co-curricular Events</h2>
              <p className="text-[var(--foreground-secondary)]">
                National symposia, branch seminars, and student hackathons hosted across departments.
              </p>
            </div>
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[var(--surface-border)] text-[13px] font-medium hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all duration-300 self-start sm:self-auto"
            >
              View Full Calendar
              <CaretRight weight="bold" className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-300" />
            </Link>
          </motion.div>

          {/* Bento Grid */}
          <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {MOCK_EVENTS.map((event) => (
              <motion.div
                key={event.id}
                variants={scaleIn}
                whileHover={{ y: -3, transition: { duration: 0.3, ease: EASE_OUT_EXPO } }}
                className="card-bezel bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.01)] group cursor-pointer"
              >
                <div className="card-bezel-inner bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)]">
                  {/* Image Container */}
                  <div className="relative h-52 overflow-hidden">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.04]"
                      style={{ backgroundImage: `url(${event.image})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#303841]/70 via-[#303841]/15 to-transparent" />

                    {/* Category badge */}
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/12 backdrop-blur-xl text-white text-[11px] font-semibold border border-white/10 shadow-sm">
                        <span className={`w-1.5 h-1.5 rounded-full ${DEADLINE_COLORS[event.deadline]}`} />
                        {event.category}
                      </span>
                    </div>

                    {/* Deadline status */}
                    <div className="absolute top-4 right-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white ${DEADLINE_COLORS[event.deadline]}`}>
                        {DEADLINE_TEXT[event.deadline]}
                      </span>
                    </div>

                    {/* Seats remaining */}
                    <div className="absolute bottom-4 right-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#303841]/60 backdrop-blur-xl text-white text-[11px] font-mono font-medium">
                        {event.seats} seats remaining
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex px-2.5 py-0.5 rounded-md bg-[var(--accent-muted)] text-[var(--accent-text)] text-[10px] font-bold uppercase tracking-wider border border-[var(--accent)]/10">
                        {event.department} Branch
                      </span>
                      <span className="text-[10px] font-semibold text-[var(--foreground-muted)] flex items-center gap-1">
                        <Bookmark weight="fill" className="text-[var(--cta)] w-3 h-3" />
                        E-Certificate Issued
                      </span>
                    </div>

                    <h3 className="text-[1.1rem] font-semibold tracking-tight group-hover:text-[var(--accent)] transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]">
                      {event.title}
                    </h3>

                    <div className="text-xs text-[var(--foreground-secondary)] grid grid-cols-2 gap-2 bg-[var(--surface-subtle)] p-3 rounded-xl border border-[var(--surface-border)]">
                      <div>Coordinator: <span className="font-semibold text-[var(--foreground)]">{event.coordinator}</span></div>
                      <div>Format: <span className="font-semibold text-[var(--foreground)]">Inter-Branch</span></div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[var(--foreground-muted)] pt-2 border-t border-[var(--surface-border)]">
                      <span className="flex items-center gap-1.5">
                        <Clock weight="bold" className="w-3.5 h-3.5" />
                        {event.date}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-[var(--foreground-muted)]" />
                      <span className="flex items-center gap-1.5">
                        <MapPin weight="bold" className="w-3.5 h-3.5" />
                        {event.venue}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================
// STUDENT SPOTLIGHT — branch achievements
// ============================================================

function StudentSpotlight() {
  return (
    <section id="spotlight" className="py-[var(--space-section)] border-t border-[var(--surface-border)]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="space-y-14"
        >
          {/* Header */}
          <motion.div variants={fadeUp} className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="eyebrow">
              <Sparkle weight="fill" className="w-3 h-3 text-[var(--accent)]" />
              Student Co-Curricular Spotlight
            </span>
            <h2>Celebrating Branch Excellence</h2>
            <p className="text-[var(--foreground-secondary)] mx-auto text-sm sm:text-base">
              Spotlighting student teams representing Rajalakshmi Institute of Technology in national and international arenas.
            </p>
          </motion.div>

          {/* Spotlight Cards Grid */}
          <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MOCK_SPOTLIGHT.map((item) => (
              <motion.div key={item.title} variants={scaleIn} className="card-bezel bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.01)] group">
                <div className="card-bezel-inner p-6 space-y-4 flex flex-col justify-between h-full bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)] hover:bg-white/20 transition-all duration-300">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full bg-[var(--cta-muted)] text-[var(--cta)] text-[9px] font-bold uppercase tracking-wider">
                        {item.team}
                      </span>
                    </div>
                    <h4 className="font-semibold text-sm tracking-tight text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors duration-300 leading-snug">
                      {item.title}
                    </h4>
                    <div className="text-xs font-mono font-bold text-[var(--accent)] bg-[var(--accent-muted)]/40 px-2.5 py-1.5 rounded-lg border border-[var(--accent)]/15">
                      {item.award}
                    </div>
                    <p className="text-[11px] text-[var(--foreground-secondary)] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================
// DEPARTMENT LEADERBOARD SECTION
// ============================================================

function LeaderboardSection() {
  return (
    <section id="leaderboard" className="py-[var(--space-section)] bg-[var(--background-secondary)] border-y border-[var(--surface-border)]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-14"
        >
          {/* Left info column */}
          <motion.div variants={fadeUp} className="lg:col-span-5 space-y-7">
            <span className="eyebrow">
              <Trophy weight="fill" className="w-3 h-3 text-[var(--accent)]" />
              Branch Leaderboard Index
            </span>
            <h2 className="!leading-[1.1]">
              Annual Branch
              <br />
              Engagement Score
            </h2>
            <p className="text-[var(--foreground-secondary)] leading-relaxed">
              Every student event registration, official check-in, and podium finish earns points for their respective engineering branch. Compare performance rankings dynamically.
            </p>

            <div className="space-y-2.5 pt-3 border-t border-[var(--surface-border)]">
              {[
                { label: "National Event Registration", points: "+10 pts", color: "var(--accent)" },
                { label: "Seminars & Attendance Verify", points: "+20 pts", color: "var(--accent)" },
                { label: "1st Place Contest Winner", points: "+50 pts", color: "var(--cta)" },
                { label: "Contest Runner-Up Finish", points: "+30 pts", color: "var(--cta)" },
              ].map((rule) => (
                <div key={rule.label} className="flex items-center justify-between py-2 border-b border-[var(--surface-border)] last:border-0">
                  <span className="text-xs text-[var(--foreground-secondary)]">{rule.label}</span>
                  <span className="font-mono font-bold text-xs" style={{ color: rule.color }}>{rule.points}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right leaderboard table */}
          <motion.div variants={fadeUp} className="lg:col-span-7">
            <div className="card-bezel-elevated bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_12px_40px_rgba(0,0,0,0.03)]">
              <div className="card-bezel-inner bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)]">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 px-6 py-3.5 text-[10px] uppercase tracking-widest text-[var(--foreground-muted)] font-bold border-b border-[var(--surface-border)]">
                  <div className="col-span-1">Rank</div>
                  <div className="col-span-5">Engineering Branch</div>
                  <div className="col-span-3 text-right">Total Index</div>
                  <div className="col-span-3 text-right">Registrations</div>
                </div>

                {/* Rows */}
                {MOCK_LEADERBOARD.map((dept, i) => (
                  <motion.div
                    key={dept.department}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06, duration: 0.5, ease: EASE_OUT_EXPO }}
                    className={`grid grid-cols-12 gap-2 px-6 py-4 items-center border-b border-[var(--surface-border)] last:border-0 transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[var(--accent-muted)] ${
                      i === 0 ? "bg-[var(--accent-muted)]/60" : ""
                    }`}
                  >
                    <div className="col-span-1">
                      {i < 3 ? (
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                          i === 0 ? "bg-[var(--cta)]" : i === 1 ? "bg-[var(--accent)]" : "bg-[var(--charcoal)]"
                        }`}>
                          {i + 1}
                        </span>
                      ) : (
                        <span className="font-mono font-bold text-xs text-[var(--foreground-muted)]">{i + 1}</span>
                      )}
                    </div>
                    <div className="col-span-5 flex items-center gap-2.5 min-w-0">
                      <div className="min-w-0">
                        <span className="font-semibold text-sm block truncate">{dept.department}</span>
                        <span className="text-[10px] text-[var(--foreground-muted)] hidden sm:block truncate">{dept.full}</span>
                      </div>
                      {dept.badge && (
                        <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-[var(--cta-muted)] text-[var(--cta)] text-[9px] font-bold uppercase tracking-wider shrink-0">
                          {dept.badge}
                        </span>
                      )}
                    </div>
                    <div className="col-span-3 text-right">
                      <span className="font-mono font-bold text-sm">{dept.points.toLocaleString()}</span>
                    </div>
                    <div className="col-span-3 text-right">
                      <span className="font-mono text-sm text-[var(--foreground-secondary)]">{dept.registrations}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================
// HOW IT WORKS
// ============================================================

function HowItWorks() {
  const steps = [
    { icon: GraduationCap, title: "Authenticate with RIT ID", description: "Use your official college Microsoft/Google SSO. Complete profile registration with roll number." },
    { icon: MagnifyingGlass, title: "Browse Official Circulars", description: "Discover technical hackathons and co-curricular programs hosted by all 7 departments." },
    { icon: Ticket, title: "Verify Digital Entry Pass", description: "Receive a custom QR-coded entry ticket instantly. Show it at the venue gates for attendance logging." },
    { icon: ChartLineUp, title: "Earn Department Points", description: "Log check-ins to gain points for your engineering branch. Collect achievement awards." },
  ];

  return (
    <section id="about" className="py-[var(--space-section)]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="space-y-14"
        >
          <motion.div variants={fadeUp} className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="eyebrow">Co-curricular Protocol</span>
            <h2>Student Registration Flow</h2>
            <p className="text-[var(--foreground-secondary)] mx-auto">Four official steps to access, register, and log campus events.</p>
          </motion.div>

          <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((step, i) => (
              <motion.div key={step.title} variants={scaleIn} className="card-bezel bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.01)] group">
                <div className="card-bezel-inner p-8 space-y-5 text-center bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)]">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--accent-muted)] flex items-center justify-center mx-auto group-hover:scale-110 group-hover:bg-[var(--accent-muted-strong)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                    <step.icon weight="duotone" className="w-6 h-6 text-[var(--accent)]" />
                  </div>
                  <div className="text-[10px] font-mono font-bold text-[var(--foreground-muted)] uppercase tracking-widest">
                    Step {i + 1}
                  </div>
                  <h4 className="font-semibold tracking-tight text-[var(--foreground)]">{step.title}</h4>
                  <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================
// CTA SECTION
// ============================================================

function CTASection() {
  return (
    <section className="py-[var(--space-section)] border-t border-[var(--surface-border)]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
          className="card-bezel-elevated bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_12px_45px_rgba(0,0,0,0.04)]"
        >
          <div className="card-bezel-inner relative overflow-hidden bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)]">
            {/* BG gradient */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[var(--accent)]/8 to-transparent" />
              <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-gradient-to-tr from-[var(--cta)]/6 to-transparent" />
            </div>

            <div className="relative px-8 py-20 sm:px-16 text-center space-y-8">
              <span className="eyebrow">
                <Bell weight="fill" className="w-3 h-3 text-[var(--accent)]" />
                RIT Co-Curricular Platform
              </span>

              <h2 className="max-w-2xl mx-auto">
                Ready to Represent
                <br />
                Your Engineering Branch?
              </h2>

              <p className="text-[var(--foreground-secondary)] max-w-lg mx-auto text-sm sm:text-base">
                Log in to check live department circulars, retrieve your active digital event passes, and track points for your academic branch standings.
              </p>

              <div className="flex flex-wrap justify-center gap-4 pt-2">
                <Link
                  href="/login"
                  className="group relative inline-flex items-center gap-3 pl-8 pr-2 py-2 rounded-full bg-[var(--cta)] text-white font-semibold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[var(--shadow-cta-glow)] active:scale-[0.97]"
                >
                  <span>Access Portal Login</span>
                  <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-[1px] transition-transform duration-300">
                    <ArrowRight weight="bold" className="w-4 h-4" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================
// FOOTER
// ============================================================

function Footer() {
  return (
    <footer className="border-t border-[var(--surface-border)] py-12">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-white px-2 py-1 rounded-lg border border-neutral-100 shadow-sm flex items-center justify-center shrink-0">
              <img src="/images/logo.png" alt="RIT Logo" className="h-6 w-auto object-contain" />
            </div>
            <span className="text-[var(--surface-border)] font-normal">|</span>
            <span className="font-display font-extrabold text-[13px] tracking-tight block leading-none text-[var(--foreground)]">Contest Alert</span>
          </div>

          <div className="text-center text-xs text-[var(--foreground-muted)] space-y-1">
            <p>Affiliated with Anna University • Approved by AICTE • NBA & NAAC Accredited Institution</p>
            <p>Built for Rajalakshmi Institute of Technology Chennai. Managed by Student Affairs Office.</p>
          </div>

          <div className="flex items-center gap-5 text-sm text-[var(--foreground-muted)]">
            <a href="#" className="hover:text-[var(--foreground)] transition-colors duration-300">Privacy</a>
            <a href="#" className="hover:text-[var(--foreground)] transition-colors duration-300">Terms</a>
            <a href="#" className="hover:text-[var(--foreground)] transition-colors duration-300">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============================================================
// MAIN PAGE EXPORT
// ============================================================

export default function LandingPage() {
  return (
    <main className="relative">
      <Navbar />
      <HeroSection />
      <StatsBar />
      <EventsSection />
      <StudentSpotlight />
      <LeaderboardSection />
      <HowItWorks />
      <CTASection />
      <Footer />
    </main>
  );
}
