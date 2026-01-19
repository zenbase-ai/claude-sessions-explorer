/**
 * Root Layout for Claude Sessions Explorer
 *
 * This is the top-level layout that wraps all pages in the application.
 * It provides:
 * - Dark mode by default (className="dark" on <html>)
 * - Custom fonts (Geist Sans and Geist Mono from Google Fonts)
 * - Global CSS styles including Tailwind
 * - HTML metadata (title, description)
 *
 * Architecture Notes:
 * - Uses Next.js App Router (src/app directory structure)
 * - All pages inherit this layout automatically
 * - Dark mode is always enabled (no theme toggle currently)
 */

import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

// Load Geist Sans font for body text
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

// Load Geist Mono font for code blocks and tool output
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

// Page metadata for SEO and browser tabs
export const metadata: Metadata = {
  title: "Claude Sessions Explorer",
  description: "Browse your Claude Code session history",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // Dark mode enabled by default via className
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
