"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell, CalendarBlank, Ticket, Trophy, Medal, Lightning,
  House, Sun, Moon, SignOut, Trash, CheckCircle, EnvelopeOpen,
  Info, Sparkle, Circle
} from "@phosphor-icons/react";
import { useTheme } from "@/components/shared/ThemeProvider";

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT_EXPO } }
};

interface NotificationType {
  id: string;
  title: string;
  message: string;
  type: string;
  date: string;
  read: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationType[] = [
  {
    id: "note-1",
    title: "Registration Success",
    message: "Your registration for CodeStorm Hackathon 2026 is confirmed! Find your entry pass in My Tickets.",
    type: "registration_success",
    date: "2 hours ago",
    read: false
  },
  {
    id: "note-2",
    title: "Ticket Generated",
    message: "Ticket EVT-2026-104928 is ready. Download it from the My Tickets tab.",
    type: "ticket_generated",
    date: "1 day ago",
    read: false
  },
  {
    id: "note-3",
    title: "Leaderboard Update",
    message: "CSE department has taken the lead after securing 1st position in the National WebDev Competition!",
    type: "winner_declared",
    date: "2 days ago",
    read: true
  }
];

const NAV_ITEMS: { label: string; icon: any; href: string; active?: boolean; badge?: number }[] = [
  { label: "Dashboard", icon: House, href: "/dashboard" },
  { label: "Events", icon: CalendarBlank, href: "/events" },
  { label: "My Tickets", icon: Ticket, href: "/tickets" },
  { label: "Leaderboard", icon: Trophy, href: "/leaderboard" },
  { label: "Achievements", icon: Medal, href: "/achievements" },
  { label: "Notifications", icon: Bell, href: "/notifications", active: true },
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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("rit_notifications");
    if (stored) {
      setNotifications(JSON.parse(stored));
    } else {
      setNotifications(DEFAULT_NOTIFICATIONS);
      localStorage.setItem("rit_notifications", JSON.stringify(DEFAULT_NOTIFICATIONS));
    }
  }, []);

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem("rit_notifications", JSON.stringify(updated));
  };

  const markRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    localStorage.setItem("rit_notifications", JSON.stringify(updated));
  };

  const deleteNote = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    localStorage.setItem("rit_notifications", JSON.stringify(updated));
  };

  const getIcon = (type: string) => {
    return {
      registration_success: <CheckCircle weight="duotone" className="w-5 h-5 text-[#4CAF50]" />,
      ticket_generated: <Ticket weight="duotone" className="w-5 h-5 text-[var(--accent)]" />,
      winner_declared: <Trophy weight="duotone" className="w-5 h-5 text-[var(--cta)]" />,
    }[type] || <Info weight="duotone" className="w-5 h-5 text-slate-400" />;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-[100dvh] bg-[var(--background)]">
      <Sidebar />
      <main className="lg:ml-[var(--sidebar-width)] min-h-[100dvh] pb-16">
        
        {/* Header */}
        <header className="sticky top-0 z-20 glass border-b border-[var(--surface-border)] px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Notifications</h1>
            <p className="text-xs text-[var(--foreground-muted)]">Stay updated on registration deadlines, results, and ticket updates</p>
          </div>
          {unreadCount > 0 && (
            <button 
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--surface-border)] hover:bg-[var(--surface-subtle)] text-xs font-semibold text-[var(--foreground-secondary)] transition-all"
            >
              <EnvelopeOpen weight="bold" className="w-3.5 h-3.5" /> Mark all as read
            </button>
          )}
        </header>

        {/* Notifications Grid */}
        <div className="px-6 lg:px-8 py-8 max-w-3xl mx-auto space-y-4">
          
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <motion.div 
                key={n.id}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className={`card-bezel overflow-hidden transition-all duration-300 relative ${!n.read ? 'ring-1 ring-[var(--accent)]/20' : ''}`}
              >
                <div className={`card-bezel-inner p-5 flex gap-4 bg-[var(--surface-subtle)] hover:bg-[var(--surface-subtle)]/80 transition-colors`}>
                  
                  {/* Status Indicator dot */}
                  {!n.read && (
                    <div className="absolute right-4 top-4">
                      <Circle weight="fill" className="w-2.5 h-2.5 text-[var(--accent)]" />
                    </div>
                  )}

                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-[var(--background)] flex items-center justify-center shrink-0 border border-[var(--surface-border)]">
                    {getIcon(n.type)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 space-y-1 cursor-pointer" onClick={() => !n.read && markRead(n.id)}>
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className={`text-sm font-semibold ${!n.read ? 'text-[var(--foreground)]' : 'text-[var(--foreground-secondary)]'}`}>
                        {n.title}
                      </h3>
                      <span className="text-[10px] text-[var(--foreground-muted)] pr-6 font-medium">{n.date}</span>
                    </div>
                    <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed max-w-xl">
                      {n.message}
                    </p>
                  </div>

                  {/* Delete Button */}
                  <div className="flex items-center justify-center shrink-0">
                    <button 
                      onClick={() => deleteNote(n.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-[var(--cta)] hover:bg-[var(--cta-muted)] transition-colors"
                      title="Delete notification"
                    >
                      <Trash weight="bold" className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 card-bezel">
              <div className="card-bezel-inner p-10 space-y-3">
                <Bell weight="duotone" className="w-12 h-12 text-[var(--foreground-muted)] mx-auto" />
                <h2 className="text-base font-bold">Inbox is empty</h2>
                <p className="text-xs text-[var(--foreground-muted)] max-w-sm mx-auto">
                  You are all caught up! When you register for events or winners are announced, details will show up here.
                </p>
              </div>
            </div>
          )}

        </div>

      </main>
    </div>
  );
}
