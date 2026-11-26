"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Clapperboard, Menu, Moon, Sun, X } from "lucide-react";
import { Logo } from "./Logo";
import { useTheme } from "./ThemeProvider";

const NAV_LINKS = [
  { label: "Downloader", href: "/#downloader" },
  { label: "Tools", href: "/tools" },
  { label: "Platforms", href: "/#platforms" },
  { label: "Formats", href: "/#formats" },
  { label: "FAQ", href: "/#faq" },
];

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-main)]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo size="md" />

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/60 p-1 md:flex"
        >
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              theme === "dark"
                ? "Switch to light theme"
                : theme === "light"
                ? "Switch to retro theme"
                : "Switch to dark theme"
            }
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-all hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : theme === "light" ? (
              <Clapperboard className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          <Link
            href="/tools"
            className="hidden items-center gap-1.5 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3.5 py-2 text-xs font-semibold text-[var(--accent)] transition-all hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-white sm:inline-flex"
          >
            <span>9 Free Tools</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] md:hidden"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-main)] px-4 py-3 md:hidden">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-2">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
