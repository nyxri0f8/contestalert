import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Plus_Jakarta_Sans, Outfit, DM_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Contest Alert — College Event Management Platform",
    template: "%s | Contest Alert",
  },
  description:
    "Centralized event, hackathon, internship, symposium, workshop, and competition management platform for engineering colleges. Discover events, register instantly, track achievements.",
  keywords: [
    "college events",
    "hackathon",
    "contest management",
    "campus activities",
    "event registration",
    "department leaderboard",
  ],
  authors: [{ name: "Contest Alert" }],
  openGraph: {
    title: "Contest Alert — College Event Management Platform",
    description:
      "Discover, register, and compete across campus events. Track your achievements and climb the department leaderboard.",
    type: "website",
    locale: "en_IN",
    siteName: "Contest Alert",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F9FA" },
    { media: "(prefers-color-scheme: dark)", color: "#050505" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${jakarta.variable} ${outfit.variable} ${dmSans.variable}`}
    >
      <body className="min-h-[100dvh] antialiased relative bg-[var(--background)] text-[var(--foreground)] transition-colors duration-500">
        <ThemeProvider>
          <div className="relative min-h-[100dvh] z-10">
            {/* Ambient Background Gradient Glow Orbs (Liquid Glass Design) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
              <div 
                className="absolute top-[-10%] left-[-15%] w-[60vw] h-[60vw] max-w-[650px] rounded-full bg-[var(--accent)]/8 dark:bg-[var(--accent)]/12 blur-[130px] animate-pulse" 
                style={{ animationDuration: '8s' }} 
              />
              <div 
                className="absolute bottom-[10%] right-[-15%] w-[50vw] h-[50vw] max-w-[550px] rounded-full bg-[var(--cta)]/5 dark:bg-[var(--cta)]/8 blur-[130px]" 
              />
              <div 
                className="absolute top-[35%] left-[25%] w-[40vw] h-[40vw] max-w-[450px] rounded-full bg-[var(--accent)]/5 dark:bg-[var(--accent)]/8 blur-[110px] animate-float" 
              />
            </div>
            <div className="relative z-10 min-h-[100dvh]">
              {children}
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
