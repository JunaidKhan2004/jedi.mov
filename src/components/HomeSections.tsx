"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Check,
  ChevronDown,
  Cpu,
  Globe,
  HardDrive,
  Layers,
  Lock,
  Shield,
  Zap,
} from "lucide-react";

const PLATFORMS = [
  { name: "Direct Media", detail: "MP4, WebM, MOV, MP3, WAV, PNG, WebP" },
  { name: "YouTube", detail: "Public metadata & 4K/HD thumbnails" },
  { name: "Vimeo", detail: "Public oEmbed metadata & cover art" },
  { name: "SoundCloud", detail: "Track metadata & high-res artwork" },
  { name: "Local Files", detail: "FFmpeg.wasm & Canvas processing" },
  { name: "Public CDNs", detail: "Direct HTTP/HTTPS stream inspection" },
];

const STEPS = [
  {
    step: "01",
    title: "Paste or Drop Media",
    desc: "Drop a local file into any tool or paste a permitted public media URL into the downloader.",
  },
  {
    step: "02",
    title: "Inspect & Configure",
    desc: "jedi.mov verifies headers, resolutions, file sizes, and formats transparently before processing.",
  },
  {
    step: "03",
    title: "Process or Download",
    desc: "Stream direct media with live progress or transcode locally in your browser with zero uploads.",
  },
];

const WHY_ITEMS = [
  {
    icon: Zap,
    title: "Zero Friction, Zero Accounts",
    desc: "Open the site and start working immediately. No sign-ups, no email gates, and no artificial daily limits.",
  },
  {
    icon: Cpu,
    title: "Browser-Native FFmpeg",
    desc: "Audio extraction, video compression, cropping, and image conversion execute locally on your machine.",
  },
  {
    icon: Shield,
    title: "Permitted & Transparent",
    desc: "We never bypass DRM, authentication walls, or platform protections. Clean, compliant media utilities.",
  },
  {
    icon: Layers,
    title: "Precision Interface",
    desc: "Designed like a modern studio tool — restrained surfaces, crisp typography, and clear feedback.",
  },
];

const FORMAT_GROUPS = [
  {
    category: "Video Containers",
    formats: ["MP4 (H.264)", "WebM (VP9)", "MOV", "M4V", "Animated GIF"],
  },
  {
    category: "Audio Formats",
    formats: ["MP3", "WAV", "M4A", "OGG", "FLAC", "AAC"],
  },
  {
    category: "Image Formats",
    formats: ["PNG", "JPEG", "WebP", "BMP", "GIF"],
  },
];

const FAQS = [
  {
    q: "Is jedi.mov completely free to use?",
    a: "Yes. All 9 media tools and the universal URL inspector/downloader are 100% free with no subscriptions, watermarks, or account requirements.",
  },
  {
    q: "Are my uploaded videos or images stored on your servers?",
    a: "No. Tools like MP3 Extractor, Video Converter, Video Compressor, Video Cropper, Image Converter, and Metadata Viewer run locally inside your browser using WebAssembly and HTML5 Canvas.",
  },
  {
    q: "Which URLs can I download with jedi.mov?",
    a: "You can download direct public media URLs (.mp4, .webm, .mp3, .wav, images) and extract verified metadata and full-resolution thumbnails from public YouTube, Vimeo, and SoundCloud links. DRM-protected or private streams are never bypassed.",
  },
  {
    q: "Why does FFmpeg take a few seconds on first use?",
    a: "The first time you run a local video or audio tool, your browser downloads and caches the lightweight FFmpeg WebAssembly core (~30 MB) so subsequent conversions run offline-fast.",
  },
];

export function HomeSections() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const prefersReducedMotion = useReducedMotion();

  const revealProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 18 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-60px" },
        transition: { duration: 0.45, ease: "easeOut" as const },
      };

  return (
    <div className="divide-y divide-[var(--border-subtle)] border-t border-[var(--border-subtle)]">
      {/* Supported Platforms */}
      <motion.section id="platforms" {...revealProps} className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent-secondary)]">
              Compatibility
            </span>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              Supported Platforms &amp; Sources
            </h2>
          </div>
          <p className="max-w-md text-sm text-[var(--text-secondary)]">
            Built for open web media, direct CDN streams, and local studio files.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORMS.map((p) => (
            <div
              key={p.name}
              className="flex items-start gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4"
            >
              <Globe className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">{p.name}</h3>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{p.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* How It Works */}
      <motion.section id="how-it-works" {...revealProps} className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">
          Workflow
        </span>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          How It Works
        </h2>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((item) => (
            <div
              key={item.step}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/60 p-6"
            >
              <span className="font-mono text-xs font-semibold text-[var(--accent)]">
                STEP {item.step}
              </span>
              <h3 className="mt-3 text-base font-semibold text-[var(--text-primary)]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Why jedi.mov */}
      <motion.section id="why" {...revealProps} className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent-secondary)]">
          Architecture
        </span>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          Why jedi.mov
        </h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {WHY_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5"
              >
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--accent)]">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* Supported Formats */}
      <motion.section id="formats" {...revealProps} className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">
          Codecs &amp; Containers
        </span>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          Supported Formats
        </h2>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {FORMAT_GROUPS.map((group) => (
            <div
              key={group.category}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5"
            >
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                {group.category}
              </h3>
              <ul className="mt-4 space-y-2">
                {group.formats.map((fmt) => (
                  <li
                    key={fmt}
                    className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"
                  >
                    <Check className="h-3.5 w-3.5 text-[var(--accent-secondary)]" />
                    <span className="font-mono text-xs">{fmt}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </motion.section>

      {/* FAQ */}
      <motion.section id="faq" {...revealProps} className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent-secondary)]">
          Questions
        </span>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          Frequently Asked Questions
        </h2>

        <div className="mt-8 space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={faq.q}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-[var(--text-primary)] sm:text-base"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-[var(--accent)]" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-[var(--border-subtle)] px-5 py-4 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* Privacy & Security */}
      <motion.section id="privacy" {...revealProps} className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="glass-surface rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--accent-secondary)]">
                <Lock className="h-3.5 w-3.5" />
                <span>Privacy &amp; Security</span>
              </div>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                Your files never leave your browser when using local tools.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                jedi.mov enforces strict SSRF protection, blocks private network probing,
                never stores download history, and respects DRM and platform access
                controls.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-3 text-xs text-[var(--text-secondary)]">
              <HardDrive className="h-5 w-5 text-[var(--accent)]" />
              <div>
                <p className="font-semibold text-[var(--text-primary)]">Zero File Retention</p>
                <p className="text-[var(--text-muted)]">Stateless stream proxy</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
