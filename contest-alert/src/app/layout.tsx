import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Plus_Jakarta_Sans } from "next/font/google";
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
      className={`${geistSans.variable} ${geistMono.variable} ${jakarta.variable}`}
    >
      <body className="min-h-[100dvh] antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
