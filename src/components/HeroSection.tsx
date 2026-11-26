"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Film, ShieldCheck, Sparkles, Zap } from "lucide-react";
import type { MediaInspectionResult } from "@/lib/media/types";
import { DownloaderPanel } from "./DownloaderPanel";

const HeroCanvas = dynamic(
  () => import("./HeroCanvas").then((mod) => mod.HeroCanvas),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="foldwork-perspective-grid absolute inset-x-0 top-1/2 h-[420px] opacity-50" />
      </div>
    ),
  }
);

export function HeroSection() {
  const [detectedMedia, setDetectedMedia] = useState<MediaInspectionResult | null>(null);
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-b border-[var(--border-subtle)] bg-[var(--bg-main)] pb-16 pt-12 sm:pb-24 sm:pt-20">
      {/* Lazy-loaded ThreeUI 3D Hero Canvas */}
      <HeroCanvas />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-start gap-10 lg:grid-cols-12">
          {/* Left / Main Column: Editorial Typography + Focal Downloader */}
          <div className="lg:col-span-8">
            {/* <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/85 px-3 py-1 text-xs font-medium text-[var(--text-secondary)] backdrop-blur-md"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-secondary)]" />
              <span>Your Media. Your Rules. — 100% Free &amp; Private</span>
            </motion.div> */}

            <motion.h1
              initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05, ease: "easeOut" }}
              className="mt-5 text-4xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-6xl lg:text-[4rem] lg:leading-[1.06]"
            >
              Everything Media.
              <br />
              <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] bg-clip-text text-transparent">
                One Simple Place.
              </span>
            </motion.h1>

            <motion.p
              initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12, ease: "easeOut" }}
              className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg"
            >
              Download, convert and manage your media with powerful free online tools.
            </motion.p>

            {/* Primary Focal Point: URL Downloader */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.18, ease: "easeOut" }}
              className="mt-8"
            >
              <DownloaderPanel onMediaDetected={setDetectedMedia} />
            </motion.div>
          </div>

          {/* Right Column: DreamCut Perspective Floating Media Preview Card */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22, ease: "easeOut" }}
            className="hidden lg:col-span-4 lg:block"
          >
            <div
              style={{
                transform: prefersReducedMotion
                  ? undefined
                  : "perspective(1100px) rotateY(-8deg) rotateX(4deg)",
              }}
              className="glass-surface rounded-2xl p-4 transition-transform duration-500 hover:transform-none"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <div className="flex items-center gap-2">
                  <Film className="h-4 w-4 text-[var(--accent)]" />
                  <span className="font-mono text-xs font-medium text-[var(--text-primary)]">
                    MEDIA INSPECTOR
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent)]/15 px-2 py-0.5 font-mono text-[10px] font-medium text-[var(--accent)]">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${detectedMedia ? "bg-[var(--accent-secondary)] animate-pulse" : "bg-[var(--accent)]"
                      }`}
                  />
                  {detectedMedia ? "DETECTED" : "READY"}
                </span>
              </div>

              <div className="relative mt-4 aspect-video overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                {detectedMedia?.thumbnailUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={detectedMedia.thumbnailUrl}
                      alt={detectedMedia.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-3">
                      <p className="line-clamp-1 text-xs font-semibold text-white">
                        {detectedMedia.title}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-white/75">
                        {detectedMedia.platformName} · {detectedMedia.formats.length} formats ready
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="foldwork-grid flex h-full w-full flex-col items-center justify-center p-4 text-center">
                    <Sparkles className="h-7 w-7 text-[var(--accent)] opacity-80" />
                    <p className="mt-2 line-clamp-2 text-xs font-medium text-[var(--text-primary)]">
                      {detectedMedia ? detectedMedia.title : "Live Stream Preview"}
                    </p>
                    <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                      {detectedMedia
                        ? `${detectedMedia.platformName} • ${detectedMedia.fileSizeLabel}`
                        : "Paste any permitted URL to inspect formats"}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-2.5">
                  <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                    <Zap className="h-3.5 w-3.5 text-[var(--accent-secondary)]" />
                    <span>Processing</span>
                  </div>
                  <p className="mt-1 font-mono font-medium text-[var(--text-primary)]">
                    Local WASM
                  </p>
                </div>
                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-2.5">
                  <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                    <ShieldCheck className="h-3.5 w-3.5 text-[var(--accent)]" />
                    <span>Privacy</span>
                  </div>
                  <p className="mt-1 font-mono font-medium text-[var(--text-primary)]">
                    Zero Tracking
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
