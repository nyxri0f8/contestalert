"use client";

import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
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
  ArrowUpRight,
  Medal,
  Crown,
  Fire,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useTheme } from "@/components/shared/ThemeProvider";
import { createClient } from "@/lib/supabase/client";

// ============================================================
// ANIMATION VARIANTS (custom cubic-bezier — zero linear)
// ============================================================

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 28, filter: "blur(8px)" },
  visible: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { duration: 0.8, ease: EASE_OUT_EXPO },
  },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92, filter: "blur(4px)" },
  visible: {
    opacity: 1, scale: 1, filter: "blur(0px)",
    transition: { duration: 0.6, ease: EASE_OUT_EXPO },
  },
};

const slideInLeft = {
  hidden: { opacity: 0, x: -32, filter: "blur(8px)" },
  visible: {
    opacity: 1, x: 0, filter: "blur(0px)",
    transition: { duration: 0.7, ease: EASE_OUT_EXPO },
  },
};

// Deadline configs
const DEADLINE_COLORS: Record<string, string> = {
  safe: "bg-emerald-500",
  warn: "bg-amber-500",
  urgent: "bg-orange-500",
  critical: "bg-red-500 animate-pulse",
};

const DEADLINE_TEXT: Record<string, string> = {
  safe: "Open",
  warn: "Closing Soon",
  urgent: "Urgent",
  critical: "Last Day",
};

// Animated counter hook
function useAnimatedCounter(end: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = 0;
          const startTime = Date.now();
          const tick = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out expo
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(start + (end - start) * eased));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return { count, ref };
}

// ============================================================
// NAVBAR — Floating Glass Pill
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
        className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          scrolled
            ? "glass-premium shadow-lg"
            : "glass shadow-sm"
        }`}
        style={{ width: "min(92vw, 880px)" }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 pl-1">
          <div className="bg-white dark:bg-white/95 px-2 py-1 rounded-lg border border-neutral-100 shadow-sm flex items-center justify-center shrink-0">
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
          {resolvedTheme === "dark" ? <Sun weight="light" className="w-4 h-4" /> : <Moon weight="light" className="w-4 h-4" />}
        </button>

        {/* CTA Button */}
        <Link
          href="/login"
          className="group relative flex items-center gap-2 pl-4 pr-2 py-1.5 rounded-full bg-[var(--cta)] text-white text-[13px] font-semibold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[var(--shadow-cta-glow)] active:scale-[0.97]"
        >
          <span>Student Login</span>
          <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-105 transition-transform duration-300">
            <ArrowRight weight="light" className="w-3 h-3" />
          </span>
        </Link>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--surface-border)] transition-all duration-300"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X weight="light" className="w-4 h-4" /> : <List weight="light" className="w-4 h-4" />}
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
            className="fixed inset-0 z-40 bg-[var(--background)]/90 backdrop-blur-3xl flex flex-col items-center justify-center gap-10"
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
                Student Login <ArrowRight weight="light" className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================
// HERO SECTION — Cinematic, editorial split
// ============================================================

function HeroSection() {
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    async function loadAnnouncements() {
      try {
        const supabase = createClient();
        const { data: eventsData } = await supabase
          .from("events")
          .select("id, title, created_at, deadline")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(3);

        if (eventsData) {
          setAnnouncements(
            eventsData.map((e: any) => ({
              id: e.id,
              title: `Circular: Registration open for ${e.title}`,
              date: new Date(e.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
              }),
              urgent: new Date(e.deadline).getTime() - Date.now() < 86400000 * 2,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to load announcements:", err);
      }
    }
    loadAnnouncements();
  }, []);

  return (
    <section className="relative min-h-[100dvh] flex items-center overflow-hidden pt-28 bg-transparent">
      {/* Ambient hero glow orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] left-[10%] w-[500px] h-[500px] rounded-full bg-[var(--accent)]/15 dark:bg-[var(--accent)]/20 blur-[120px] animate-glow-pulse" />
        <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full bg-[var(--cta)]/10 dark:bg-[var(--cta)]/15 blur-[120px] animate-glow-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute top-[40%] right-[30%] w-[200px] h-[200px] rounded-full bg-[var(--accent)]/8 blur-[80px] animate-float" />
      </div>

      <div className="relative max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 z-10">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center"
        >
          {/* Left Content — Editorial Typography */}
          <div className="lg:col-span-7 space-y-10">
            <motion.div variants={fadeUp} className="space-y-7">
              <span className="eyebrow border border-[var(--accent)]/20 text-[var(--accent-text)] bg-[var(--accent-muted)]/75 backdrop-blur-md">
                <span className="status-dot status-dot--teal animate-pulse" />
                Rajalakshmi Institute of Technology
              </span>

              <h1 className="!leading-[1.02]">
                <span className="block text-[var(--foreground)]">Academic Event &</span>
                <span className="gradient-text-animated">Co-Curricular Hub</span>
              </h1>

              <p className="text-base sm:text-lg text-[var(--foreground-secondary)] max-w-[55ch] leading-relaxed">
                Centralized platform facilitating national hackathons, technical symposia, HOD seminars,
                and branch workshops. Link your competitive successes with official academic standings.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
              {/* Primary CTA — Button-in-Button */}
              <Link
                href="/login"
                className="group relative inline-flex items-center gap-3 pl-8 pr-2.5 py-2.5 rounded-full bg-[var(--cta)] text-white font-semibold text-[15px] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_0_40px_rgba(255,87,34,0.25)] hover:scale-[1.02] active:scale-[0.97]"
              >
                <span>Access Student Portal</span>
                <span className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-110 transition-all duration-300">
                  <ArrowRight weight="light" className="w-4 h-4" />
                </span>
              </Link>

              {/* Secondary */}
              <a
                href="#leaderboard"
                className="inline-flex items-center gap-2.5 px-7 py-3 rounded-full border border-[var(--surface-border)] bg-white/40 dark:bg-white/5 backdrop-blur-md text-sm font-medium text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:border-[var(--accent)] hover:bg-[var(--accent-muted)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02] active:scale-[0.98]"
              >
                <Trophy weight="light" className="w-4 h-4 text-[var(--accent)]" />
                Branch Standings
              </a>
            </motion.div>

            {/* Program Stats */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-10 pt-4">
              {[
                { label: "B.E/B.Tech Students", value: "5,200+" },
                { label: "Accredited Programs", value: "7 Branches" },
                { label: "Active Co-curriculars", value: "142 Yearly" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-display font-bold tracking-tight text-[var(--foreground)]" style={{ fontFamily: "var(--font-mono)" }}>
                    {stat.value}
                  </div>
                  <div className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-wider font-semibold mt-1.5">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right Column: Notice Board — Double-Bezel Glass */}
          <motion.div variants={fadeUp} className="lg:col-span-5 relative hidden lg:block">
            {/* Decorative floating elements */}
            <div className="absolute -top-8 -right-6 w-16 h-16 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center animate-float">
              <Trophy weight="light" className="w-6 h-6 text-[var(--accent)]" />
            </div>
            <div className="absolute -bottom-4 -left-4 w-12 h-12 rounded-xl bg-[var(--cta)]/10 border border-[var(--cta)]/20 flex items-center justify-center animate-float" style={{ animationDelay: "1.5s" }}>
              <Lightning weight="light" className="w-5 h-5 text-[var(--cta)]" />
            </div>

            <div className="card-bezel-elevated glass-premium">
              <div className="card-bezel-inner p-7 space-y-5 bg-transparent">
                <div className="flex items-center justify-between border-b border-[var(--surface-border)] pb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-secondary)] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--cta)] animate-pulse" />
                    Notice Board & Circulars
                  </h3>
                  <span className="text-[10px] font-mono text-[var(--foreground-muted)]">Official Feed</span>
                </div>

                <div className="space-y-3">
                  {announcements.length > 0 ? (
                    announcements.map((note) => (
                      <div key={note.id} className="p-4 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-subtle)]/50 hover:border-[var(--accent)]/30 hover:bg-[var(--accent-muted)]/30 transition-all duration-300 group cursor-pointer">
                        <div className="flex justify-between items-start gap-3 mb-2">
                          <span className="text-[10px] text-[var(--foreground-muted)] font-semibold">{note.date}</span>
                          {note.urgent && (
                            <span className="text-[8px] bg-[var(--cta-muted)] text-[var(--cta)] px-2 py-0.5 rounded font-bold uppercase">Urgent</span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors leading-relaxed">
                          {note.title}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-[var(--foreground-muted)] text-center py-8">
                      No active announcements at this time.
                    </div>
                  )}
                </div>

                <div className="pt-3">
                  <Link href="/login" className="group w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--accent-muted)] border border-[var(--surface-border)] hover:bg-[var(--accent-muted-strong)] hover:border-[var(--accent)]/30 text-xs font-semibold text-[var(--foreground-secondary)] hover:text-[var(--accent-text)] transition-all duration-300">
                    Access Academic Calendar
                    <ArrowUpRight weight="light" className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
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
// STATS BAR — Glass Bento Cards with Animated Counters
// ============================================================

function StatsBar() {
  const [stats, setStats] = useState([
    { label: "Co-curricular Events", rawValue: 0, icon: CalendarCheck, color: "var(--accent)" },
    { label: "Student Enrollments", rawValue: 0, icon: Users, color: "var(--accent)" },
    { label: "Total Branch Points", rawValue: 0, icon: Trophy, color: "var(--cta)" },
    { label: "Accredited Programs", rawValue: 7, icon: GraduationCap, color: "var(--cta)" },
  ]);

  useEffect(() => {
    async function loadStats() {
      try {
        const supabase = createClient();
        const { count: activeCount } = await supabase
          .from("events")
          .select("id", { count: "exact", head: true })
          .eq("status", "active");

        const { count: studentsCount } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "student");

        const { data: profilesData } = await supabase
          .from("profiles")
          .select("achievement_points");

        const totalPoints = profilesData?.reduce((sum, p) => sum + (p.achievement_points || 0), 0) || 0;

        setStats([
          { label: "Co-curricular Events", rawValue: activeCount || 0, icon: CalendarCheck, color: "var(--accent)" },
          { label: "Student Enrollments", rawValue: studentsCount || 0, icon: Users, color: "var(--accent)" },
          { label: "Total Branch Points", rawValue: totalPoints, icon: Trophy, color: "var(--cta)" },
          { label: "Accredited Programs", rawValue: 7, icon: GraduationCap, color: "var(--cta)" },
        ]);
      } catch (err) {
        console.error("Failed to load homepage stats:", err);
      }
    }
    loadStats();
  }, []);

  return (
    <section className="relative py-10 bg-transparent">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5"
        >
          {stats.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function StatCard({ stat }: { stat: { label: string; rawValue: number; icon: any; color: string } }) {
  const { count, ref } = useAnimatedCounter(stat.rawValue);

  return (
    <motion.div ref={ref} variants={scaleIn} className="stat-card group">
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 group-hover:rotate-3"
          style={{ background: `color-mix(in srgb, ${stat.color} 12%, transparent)` }}
        >
          <stat.icon weight="light" className="w-5 h-5" style={{ color: stat.color }} />
        </div>
        <div>
          <div className="text-2xl font-display font-bold tracking-tight" style={{ fontFamily: "var(--font-mono)" }}>
            {stat.rawValue > 100 ? count.toLocaleString() : count || stat.rawValue}
          </div>
          <div className="text-[11px] text-[var(--foreground-muted)] font-medium">{stat.label}</div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// EVENTS SECTION — Premium Bento Cards
// ============================================================

function EventsSection() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    async function loadEvents() {
      try {
        const supabase = createClient();
        const { data: dbEvents } = await supabase
          .from("events")
          .select("*, registrations(count)")
          .eq("status", "active")
          .order("event_date", { ascending: true })
          .limit(4);

        if (dbEvents) {
          setEvents(dbEvents.map(e => {
            const registeredCount = e.registrations?.[0]?.count || 0;
            const remainingSeats = Math.max(0, e.capacity - registeredCount);
            
            const deadlineDate = new Date(e.deadline);
            const diff = deadlineDate.getTime() - Date.now();
            const deadlineStatus = diff < 0 ? "critical" : diff < 86400000 ? "urgent" : diff < 86400000 * 3 ? "warn" : "safe";

            return {
              id: e.id,
              title: e.title,
              category: e.category,
              department: e.department || "All",
              eventType: e.event_type || "internal",
              date: new Date(e.event_date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
              venue: e.venue,
              seats: remainingSeats,
              deadline: deadlineStatus,
              coordinator: e.contact_person || "Dept Coordinator",
              image: e.cover_image || "https://picsum.photos/seed/default/800/500"
            };
          }));
        }
      } catch (err) {
        console.error("Failed to load events for homepage:", err);
      }
    }
    loadEvents();
  }, []);

  return (
    <section id="events" className="py-[var(--space-section)] bg-transparent">
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
                <Sparkle weight="light" className="w-3 h-3 text-[var(--accent)]" />
                Branch Circulars & Events
              </span>
              <h2>Upcoming Co-curricular Events</h2>
              <p className="text-[var(--foreground-secondary)]">
                National symposia, branch seminars, and student hackathons hosted across departments.
              </p>
            </div>
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[var(--surface-border)] text-[13px] font-medium hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent-muted)] transition-all duration-300 self-start sm:self-auto"
            >
              View Full Calendar
              <CaretRight weight="light" className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-300" />
            </Link>
          </motion.div>

          {/* Bento Grid */}
          <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {events.map((event) => (
              <motion.div
                key={event.id}
                variants={scaleIn}
                whileHover={{ y: -4, transition: { duration: 0.3, ease: EASE_OUT_EXPO } }}
                className="card-bezel group cursor-pointer"
              >
                <Link href={`/login`}>
                  <div className="card-bezel-inner bg-transparent shadow-none">
                    {/* Image */}
                    <div className="relative h-56 overflow-hidden">
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.06]"
                        style={{ backgroundImage: `url(${event.image})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                      {/* Category pill */}
                      <div className="absolute top-4 left-4 flex gap-1.5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-xl text-white text-[11px] font-semibold border border-white/15 shadow-sm">
                          <span className={`w-1.5 h-1.5 rounded-full ${DEADLINE_COLORS[event.deadline]}`} />
                          {event.category}
                        </span>
                        {event.eventType === "external" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[var(--cta)]/80 backdrop-blur-xl text-white text-[10px] font-bold border border-white/15">
                            ↗ External
                          </span>
                        )}
                      </div>

                      {/* Deadline badge */}
                      <div className="absolute top-4 right-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white ${DEADLINE_COLORS[event.deadline]}`}>
                          {DEADLINE_TEXT[event.deadline]}
                        </span>
                      </div>

                      {/* Seats */}
                      <div className="absolute bottom-4 right-4">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-xl text-white text-[11px] font-mono font-medium border border-white/10">
                          {event.seats} seats remaining
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex px-2.5 py-0.5 rounded-md bg-[var(--accent-muted)] text-[var(--accent-text)] text-[10px] font-bold uppercase tracking-wider border border-[var(--accent)]/10">
                          {event.department} Branch
                        </span>
                        <span className="text-[10px] font-semibold text-[var(--foreground-muted)] flex items-center gap-1">
                          <Bookmark weight="light" className="text-[var(--cta)] w-3 h-3" />
                          E-Certificate Issued
                        </span>
                      </div>

                      <h3 className="text-[1.15rem] font-semibold tracking-tight group-hover:text-[var(--accent)] transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]">
                        {event.title}
                      </h3>

                      <div className="text-xs text-[var(--foreground-secondary)] grid grid-cols-2 gap-2 bg-[var(--surface-subtle)]/60 p-3.5 rounded-xl border border-[var(--surface-border)]">
                        <div>Coordinator: <span className="font-semibold text-[var(--foreground)]">{event.coordinator}</span></div>
                        <div>Format: <span className="font-semibold text-[var(--foreground)]">Inter-Branch</span></div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-[var(--foreground-muted)] pt-3 border-t border-[var(--surface-border)]">
                        <span className="flex items-center gap-1.5">
                          <Clock weight="light" className="w-3.5 h-3.5" />
                          {event.date}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-[var(--foreground-muted)]" />
                        <span className="flex items-center gap-1.5">
                          <MapPin weight="light" className="w-3.5 h-3.5" />
                          {event.venue}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================
// STUDENT SPOTLIGHT — Achievement Cards
// ============================================================

function StudentSpotlight() {
  const [spotlight, setSpotlight] = useState<any[]>([]);

  useEffect(() => {
    async function loadSpotlight() {
      try {
        const supabase = createClient();
        const { data: winnersData } = await supabase
          .from("winners")
          .select("position, declared_at, profiles(name, department), events(title, category)")
          .order("declared_at", { ascending: false })
          .limit(3);

        if (winnersData && winnersData.length > 0) {
          setSpotlight(winnersData.map(w => {
            const profile: any = Array.isArray(w.profiles) ? w.profiles[0] : w.profiles;
            const event: any = Array.isArray(w.events) ? w.events[0] : w.events;
            return {
              title: `${profile?.name || "Student"} (${profile?.department || "Dept"})`,
              team: event?.category?.toUpperCase() || "EVENT",
              award: `${w.position === "winner" ? "First Place" : w.position === "runner_up" ? "Runner-Up" : "Special Mention"}`,
              desc: `Recognized for outstanding achievement in the ${event?.title || "contest"}. Declared on ${new Date(w.declared_at).toLocaleDateString()}`,
              icon: w.position === "winner" ? Crown : w.position === "runner_up" ? Medal : Star,
              iconColor: w.position === "winner" ? "#FFD700" : w.position === "runner_up" ? "#C0C0C0" : "var(--accent)",
            };
          }));
        } else {
          setSpotlight([]);
        }
      } catch (err) {
        console.error("Failed to load spotlight achievements:", err);
      }
    }
    loadSpotlight();
  }, []);

  return (
    <section id="spotlight" className="py-[var(--space-section)] border-t border-[var(--surface-border)] bg-transparent">
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
              <Sparkle weight="light" className="w-3 h-3 text-[var(--accent)]" />
              Student Co-Curricular Spotlight
            </span>
            <h2>Celebrating Branch Excellence</h2>
            <p className="text-[var(--foreground-secondary)] mx-auto text-sm sm:text-base">
              Spotlighting student teams representing Rajalakshmi Institute of Technology in national and international arenas.
            </p>
          </motion.div>

          {/* Spotlight Cards */}
          <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {spotlight.length > 0 ? (
              spotlight.map((item) => (
                <motion.div key={item.title} variants={scaleIn} className="card-bezel group">
                  <div className="card-bezel-inner p-7 space-y-5 flex flex-col justify-between h-full bg-transparent shadow-none hover:bg-[var(--accent-muted)]/20 transition-all duration-500">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full bg-[var(--cta-muted)] text-[var(--cta)] text-[9px] font-bold uppercase tracking-wider">
                          {item.team}
                        </span>
                        <item.icon weight="fill" className="w-5 h-5" style={{ color: item.iconColor }} />
                      </div>
                      <h4 className="font-semibold text-sm tracking-tight text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors duration-300 leading-snug">
                        {item.title}
                      </h4>
                      <div className="text-xs font-mono font-bold text-[var(--accent)] bg-[var(--accent-muted)]/50 px-3 py-2 rounded-lg border border-[var(--accent)]/15">
                        {item.award}
                      </div>
                      <p className="text-[11px] text-[var(--foreground-secondary)] leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 text-xs text-[var(--foreground-muted)]">
                No podium finishes recorded yet for this semester.
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================
// DEPARTMENT LEADERBOARD — Premium Table with Rank Badges
// ============================================================

function LeaderboardSection() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const supabase = createClient();
        const { data: leaderboardData } = await supabase.rpc('get_department_leaderboard');
        
        if (leaderboardData) {
          const deptNames: Record<string, string> = {
            CSE: "Computer Science & Engineering",
            ECE: "Electronics & Communication",
            AIML: "AI & Machine Learning",
            AIDS: "AI & Data Science",
            CCE: "Computer & Communication",
            Biotechnology: "Biotechnology",
            Mechanical: "Mechanical Engineering"
          };

          const maxPoints = Math.max(...leaderboardData.map((d: any) => d.total_points || 1));

          setLeaderboard(leaderboardData.map((d: any, idx: number) => ({
            rank: idx + 1,
            department: d.department,
            full: deptNames[d.department] || d.department,
            points: d.total_points || 0,
            registrations: d.total_registrations || 0,
            percentage: Math.round(((d.total_points || 0) / maxPoints) * 100),
            badge: idx === 0 ? "Event Leaders" : idx === 1 ? "Innovation Hub" : idx === 2 ? "Rising Star" : null
          })));
        }
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
      }
    }
    loadLeaderboard();
  }, []);

  return (
    <section id="leaderboard" className="py-[var(--space-section)] bg-transparent border-y border-[var(--surface-border)]">
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
              <Trophy weight="light" className="w-3 h-3 text-[var(--accent)]" />
              Branch Leaderboard Index
            </span>
            <h2 className="!leading-[1.1]">
              Annual Branch
              <br />
              <span className="gradient-text">Engagement Score</span>
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
                <div key={rule.label} className="flex items-center justify-between py-2.5 border-b border-[var(--surface-border)] last:border-0">
                  <span className="text-xs text-[var(--foreground-secondary)]">{rule.label}</span>
                  <span className="font-mono font-bold text-xs" style={{ color: rule.color }}>{rule.points}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — Leaderboard Table */}
          <motion.div variants={fadeUp} className="lg:col-span-7">
            <div className="card-bezel-elevated glass-premium">
              <div className="card-bezel-inner bg-transparent shadow-none">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 px-6 py-4 text-[10px] uppercase tracking-widest text-[var(--foreground-muted)] font-bold border-b border-[var(--surface-border)]">
                  <div className="col-span-1">Rank</div>
                  <div className="col-span-5">Engineering Branch</div>
                  <div className="col-span-3 text-right">Total Index</div>
                  <div className="col-span-3 text-right">Registrations</div>
                </div>

                {/* Rows */}
                {leaderboard.map((dept, i) => (
                  <motion.div
                    key={dept.department}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06, duration: 0.5, ease: EASE_OUT_EXPO }}
                    className={`grid grid-cols-12 gap-2 px-6 py-4 items-center border-b border-[var(--surface-border)] last:border-0 transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[var(--accent-muted)] ${
                      i === 0 ? "bg-[var(--accent-muted)]/60" : ""
                    }`}
                  >
                    <div className="col-span-1">
                      {i < 3 ? (
                        <span className={`rank-badge ${
                          i === 0 ? "rank-badge--gold" : i === 1 ? "rank-badge--silver" : "rank-badge--bronze"
                        }`}>
                          {i + 1}
                        </span>
                      ) : (
                        <span className="font-mono font-bold text-xs text-[var(--foreground-muted)] pl-2">{i + 1}</span>
                      )}
                    </div>
                    <div className="col-span-5 flex items-center gap-2.5 min-w-0">
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-sm block truncate">{dept.department}</span>
                        <span className="text-[10px] text-[var(--foreground-muted)] hidden sm:block truncate">{dept.full}</span>
                        {/* Progress bar */}
                        <div className="progress-bar mt-1.5 hidden sm:block">
                          <div className="progress-bar-fill" style={{ width: `${dept.percentage}%` }} />
                        </div>
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
// HOW IT WORKS — Connected Timeline Steps
// ============================================================

function HowItWorks() {
  const steps = [
    { icon: GraduationCap, title: "Authenticate with RIT ID", description: "Use your official college Microsoft/Google SSO. Complete profile registration with roll number." },
    { icon: MagnifyingGlass, title: "Browse Official Circulars", description: "Discover technical hackathons and co-curricular programs hosted by all 7 departments." },
    { icon: Ticket, title: "Verify Digital Entry Pass", description: "Receive a custom QR-coded entry ticket instantly. Show it at the venue gates for attendance logging." },
    { icon: ChartLineUp, title: "Earn Department Points", description: "Log check-ins to gain points for your engineering branch. Collect achievement awards." },
  ];

  return (
    <section id="about" className="py-[var(--space-section)] bg-transparent">
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
              <motion.div key={step.title} variants={scaleIn} className={`card-bezel group ${i < 3 ? "timeline-connector" : ""}`}>
                <div className="card-bezel-inner p-8 space-y-5 text-center bg-transparent shadow-none hover:bg-[var(--accent-muted)]/20 transition-all duration-500">
                  <div className="relative mx-auto">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--accent-muted)] flex items-center justify-center mx-auto group-hover:scale-110 group-hover:bg-[var(--accent-muted-strong)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                      <step.icon weight="light" className="w-7 h-7 text-[var(--accent)]" />
                    </div>
                    {/* Step number badge */}
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[var(--cta)] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                      {i + 1}
                    </div>
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
// CTA SECTION — Cinematic Glass
// ============================================================

function CTASection() {
  return (
    <section className="py-[var(--space-section)] border-t border-[var(--surface-border)] bg-transparent">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
          className="card-bezel-elevated glass-premium"
        >
          <div className="card-bezel-inner relative overflow-hidden bg-transparent shadow-none">
            {/* Ambient gradients */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-[var(--accent)]/10 to-transparent" />
              <div className="absolute bottom-0 left-0 w-[40%] h-[60%] bg-gradient-to-tr from-[var(--cta)]/8 to-transparent" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-[var(--accent)]/5 blur-[80px]" />
            </div>

            <div className="relative px-8 py-24 sm:px-16 text-center space-y-8">
              <span className="eyebrow">
                <Bell weight="light" className="w-3 h-3 text-[var(--accent)]" />
                RIT Co-Curricular Platform
              </span>

              <h2 className="max-w-2xl mx-auto">
                Ready to Represent
                <br />
                <span className="gradient-text">Your Engineering Branch?</span>
              </h2>

              <p className="text-[var(--foreground-secondary)] max-w-lg mx-auto text-sm sm:text-base">
                Log in to check live department circulars, retrieve your active digital event passes, and track points for your academic branch standings.
              </p>

              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Link
                  href="/login"
                  className="group relative inline-flex items-center gap-3 pl-8 pr-2.5 py-2.5 rounded-full bg-[var(--cta)] text-white font-semibold text-[15px] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_0_40px_rgba(255,87,34,0.25)] active:scale-[0.97]"
                >
                  <span>Access Portal Login</span>
                  <span className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-110 transition-all duration-300">
                    <ArrowRight weight="light" className="w-4 h-4" />
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
// FOOTER — Premium Minimal
// ============================================================

function Footer() {
  return (
    <footer className="border-t border-[var(--surface-border)] py-14 bg-transparent">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="bg-white dark:bg-white/95 px-2 py-1 rounded-lg border border-neutral-100 shadow-sm flex items-center justify-center shrink-0">
              <img src="/images/logo.png" alt="RIT Logo" className="h-6 w-auto object-contain" />
            </div>
            <span className="text-[var(--surface-border)] font-normal">|</span>
            <span className="font-display font-extrabold text-[13px] tracking-tight block leading-none text-[var(--foreground)]">Contest Alert</span>
          </div>

          <div className="text-center text-xs text-[var(--foreground-muted)] space-y-1.5">
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
