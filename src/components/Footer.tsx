import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="relative border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]/60">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/40 to-transparent"
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo size="md" />
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]">
              Your Media. Your Rules. A free, privacy-first universal media downloader and
              browser-native processing suite. No accounts, no tracking, no paywalls.
            </p>
          </div>

          <div>
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">
              Platform
            </h3>
            <ul className="mt-3 space-y-2.5 text-sm text-[var(--text-secondary)]">
              <li>
                <Link href="/#downloader" className="transition-colors hover:text-[var(--accent)]">
                  Media Downloader
                </Link>
              </li>
              <li>
                <Link href="/tools" className="transition-colors hover:text-[var(--accent)]">
                  All Media Tools
                </Link>
              </li>
              <li>
                <Link href="/#platforms" className="transition-colors hover:text-[var(--accent)]">
                  Supported Platforms
                </Link>
              </li>
              <li>
                <Link href="/#formats" className="transition-colors hover:text-[var(--accent)]">
                  Supported Formats
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">
              Trust &amp; Policy
            </h3>
            <ul className="mt-3 space-y-2.5 text-sm text-[var(--text-secondary)]">
              <li>
                <Link href="/#privacy" className="transition-colors hover:text-[var(--accent)]">
                  Privacy &amp; Security
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="transition-colors hover:text-[var(--accent)]">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/tools/url-validator" className="transition-colors hover:text-[var(--accent)]">
                  URL Validator
                </Link>
              </li>
              <li>
                <Link href="/tools/metadata-viewer" className="transition-colors hover:text-[var(--accent)]">
                  Metadata Viewer
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-[var(--border-subtle)] pt-6 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center">
          <p>&copy; {new Date().getFullYear()} jedi.mov — Free Universal Media Utilities.</p>
          <p>Permitted public media only. Respect creator rights and platform terms.</p>
        </div>
      </div>
    </footer>
  );
}
