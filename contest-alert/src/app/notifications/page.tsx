"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Bell,
  Ticket,
  Trophy,
  Trash,
  CheckCircle,
  EnvelopeOpen,
  Info,
  Circle,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/shared/Sidebar";

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT_EXPO } },
};

interface NotificationType {
  id: string;
  title: string;
  message: string;
  type: string;
  date: string;
  read: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (data) {
          setNotifications(
            data.map((n: any) => ({
              id: n.id,
              title: n.title,
              message: n.message,
              type: n.type,
              date: new Date(n.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              }),
              read: n.is_read,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    }
    loadNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id);

      if (!error) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markRead = async (id: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      if (!error) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (!error) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    return (
      {
        registration_success: <CheckCircle weight="light" className="w-5 h-5 text-[#4CAF50]" />,
        ticket_generated: <Ticket weight="light" className="w-5 h-5 text-[var(--accent)]" />,
        winner_declared: <Trophy weight="light" className="w-5 h-5 text-[var(--cta)]" />,
      } as Record<string, React.ReactNode>
    )[type] || <Info weight="light" className="w-5 h-5 text-slate-400" />;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-[100dvh] bg-transparent">
      <Sidebar />
      <main className="lg:ml-[var(--sidebar-width)] min-h-[100dvh] pb-16">
        {/* Header */}
        <header className="sticky top-0 z-20 glass border-b border-[var(--surface-border)] px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Notifications</h1>
            <p className="text-xs text-[var(--foreground-muted)]">
              Stay updated on registration deadlines, results, and ticket updates
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--surface-border)] hover:bg-[var(--surface-subtle)] text-xs font-semibold text-[var(--foreground-secondary)] transition-all"
            >
              <EnvelopeOpen weight="light" className="w-4.5 h-4.5" /> Mark all as read
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
                className={`card-bezel overflow-hidden transition-all duration-300 relative ${
                  !n.read ? "ring-1 ring-[var(--accent)]/20" : ""
                }`}
              >
                <div className="card-bezel-inner p-5 flex gap-4 bg-[var(--surface-subtle)] hover:bg-[var(--surface-subtle)]/80 transition-colors">
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
                      <h3
                        className={`text-sm font-semibold ${
                          !n.read ? "text-[var(--foreground)]" : "text-[var(--foreground-secondary)]"
                        }`}
                      >
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
                      <Trash weight="light" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 card-bezel">
              <div className="card-bezel-inner p-10 space-y-3">
                <Bell weight="light" className="w-12 h-12 text-[var(--foreground-muted)] mx-auto" />
                <h2 className="text-base font-bold">Inbox is empty</h2>
                <p className="text-xs text-[var(--foreground-muted)] max-w-sm mx-auto">
                  You are all caught up! When you register for events or winners are announced, details will show up
                  here.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
