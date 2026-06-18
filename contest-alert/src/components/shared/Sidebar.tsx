"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  House,
  CalendarBlank,
  Ticket,
  Trophy,
  Medal,
  Bell,
  Sun,
  Moon,
  SignOut,
  QrCode,
  ClipboardText,
  List,
  X,
} from "@phosphor-icons/react";
import { useTheme } from "@/components/shared/ThemeProvider";
import { createClient } from "@/lib/supabase/client";

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;

export function Sidebar() {
  const pathname = usePathname() || "";
  const { resolvedTheme, setTheme } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if we are in admin context
  const isAdmin = pathname.startsWith("/admin");

  // Load notifications unread count for students
  useEffect(() => {
    if (isAdmin) return;

    async function loadUnreadCount() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { count } = await supabase
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("is_read", false);
          setUnreadCount(count || 0);
        }
      } catch (err) {
        console.error("Sidebar notification fetch error:", err);
      }
    }

    loadUnreadCount();

    // Subscribe to notification updates
    const supabase = createClient();
    const channel = supabase
      .channel("sidebar-notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  async function handleSignOut() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.warn("Supabase signOut error", error);
    }
    window.location.href = "/";
  }

  // Sidebar navigation options
  const studentNavItems = [
    { label: "Dashboard", icon: House, href: "/dashboard" },
    { label: "Events", icon: CalendarBlank, href: "/events" },
    { label: "My Tickets", icon: Ticket, href: "/tickets" },
    { label: "Leaderboard", icon: Trophy, href: "/leaderboard" },
    { label: "Achievements", icon: Medal, href: "/achievements" },
    { label: "Notifications", icon: Bell, href: "/notifications" },
  ];

  const adminNavItems = [
    { label: "Admin Panel", icon: House, href: "/admin" },
    { label: "Manage Events", icon: CalendarCheckIcon, href: "/admin/events" },
    { label: "QR Scanner", icon: QrCode, href: "/admin/scanner" },
    { label: "Registrations", icon: ClipboardText, href: "/admin/registrations" },
    { label: "Winner Board", icon: Trophy, href: "/admin/winners" },
  ];

  // Helper workaround for CalendarCheck to avoid compile-time issues with missing icons
  function CalendarCheckIcon(props: any) {
    return <CalendarBlank {...props} />;
  }

  const navItems = isAdmin ? adminNavItems : studentNavItems;

  const isItemActive = (href: string) => {
    if (href === "/dashboard" || href === "/admin") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const currentThemeIcon = resolvedTheme === "dark" ? (
    <Sun weight="light" className="w-[18px] h-[18px]" />
  ) : (
    <Moon weight="light" className="w-[18px] h-[18px]" />
  );

  return (
    <>
      {/* ==========================================
          DESKTOP SIDEBAR (lg and above)
          ========================================== */}
      <aside className="fixed left-0 top-0 bottom-0 w-[var(--sidebar-width)] glass border-r border-[var(--surface-border)] flex flex-col z-30 hidden lg:flex">
        {/* Logo Section */}
        <div className="px-6 py-5 border-b border-[var(--surface-border)]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="bg-white px-2 py-1 rounded-lg border border-neutral-100 shadow-sm flex items-center justify-center shrink-0">
              <img src="/images/logo.png" alt="Logo" className="h-6 w-auto object-contain" />
            </div>
            <span className="text-[var(--surface-border)] font-normal">|</span>
            <span className="font-display font-extrabold text-[13px] tracking-tight block leading-none text-[var(--foreground)]">
              {isAdmin ? "Admin Portal" : "Contest Alert"}
            </span>
          </Link>
        </div>

        {/* Links Section */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isItemActive(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  active
                    ? "bg-[var(--accent-muted)] text-[var(--accent-text)]"
                    : "text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-subtle)]"
                }`}
              >
                <item.icon weight="light" className="w-[18px] h-[18px]" />
                <span className="flex-1">{item.label}</span>
                {item.label === "Notifications" && unreadCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[var(--cta)] text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="px-3 py-4 border-t border-[var(--surface-border)] space-y-1">
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-subtle)] transition-all duration-300"
          >
            {currentThemeIcon}
            <span>{resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium text-[var(--cta)] hover:bg-[var(--cta-muted)] transition-all duration-300"
          >
            <SignOut weight="light" className="w-[18px] h-[18px]" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ==========================================
          MOBILE FLOATING NAV ISLAND & EXPANDABLE DRAWER
          ========================================== */}
      <div className="lg:hidden">
        {/* Floating Hamburger Island */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full glass border border-[var(--surface-border)] flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all duration-300"
          aria-label="Open Navigation Menu"
        >
          <List weight="light" className="w-5 h-5 text-[var(--foreground)]" />
        </button>

        {/* Full-Screen Glass Backdrop & Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
              className="fixed inset-0 z-50 backdrop-blur-3xl bg-[color-mix(in srgb,var(--background)_80%,transparent)] flex flex-col p-6 overflow-y-auto"
            >
              {/* Header inside overlay */}
              <div className="flex items-center justify-between pb-6 border-b border-[var(--surface-border)]">
                <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <div className="bg-white px-2 py-1 rounded-lg border border-neutral-100 shadow-sm flex items-center justify-center shrink-0">
                    <img src="/images/logo.png" alt="Logo" className="h-6 w-auto object-contain" />
                  </div>
                  <span className="font-display font-extrabold text-sm tracking-tight text-[var(--foreground)]">
                    {isAdmin ? "Admin Portal" : "Contest Alert"}
                  </span>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-10 h-10 rounded-full border border-[var(--surface-border)] flex items-center justify-center text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-subtle)] transition-colors"
                >
                  <X weight="light" className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Navigation links with Staggered reveal */}
              <nav className="flex-1 py-8 flex flex-col justify-center space-y-4">
                {navItems.map((item, idx) => {
                  const active = isItemActive(item.href);
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.5, ease: EASE_OUT_EXPO }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-4 px-6 py-3.5 rounded-2xl text-[15px] font-semibold transition-all duration-300 ${
                          active
                            ? "bg-[var(--accent-muted)] text-[var(--accent-text)]"
                            : "text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-subtle)]"
                        }`}
                      >
                        <item.icon weight="light" className="w-5 h-5" />
                        <span className="flex-1">{item.label}</span>
                        {item.label === "Notifications" && unreadCount > 0 && (
                          <span className="w-6 h-6 rounded-full bg-[var(--cta)] text-white text-xs font-bold flex items-center justify-center">
                            {unreadCount}
                          </span>
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* Footer controls inside overlay */}
              <div className="pt-6 border-t border-[var(--surface-border)] space-y-3">
                <button
                  onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                  className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border border-[var(--surface-border)] text-sm font-semibold text-[var(--foreground-secondary)] hover:bg-[var(--surface-subtle)] transition-all"
                >
                  {currentThemeIcon}
                  <span>{resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-[var(--cta)] text-white text-sm font-semibold hover:bg-[var(--cta-hover)] transition-all"
                >
                  <SignOut weight="light" className="w-4.5 h-4.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
