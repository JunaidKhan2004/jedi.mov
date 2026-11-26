"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  Crop,
  Download,
  FileImage,
  FileSearch,
  Image as ImageIcon,
  Minimize2,
  Music,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { MEDIA_TOOLS } from "@/lib/tools";
import type { ToolDefinition, ToolSlug } from "@/lib/media/types";
import { SpotlightCard } from "./SpotlightCard";

const CATEGORIES: Array<"All" | ToolDefinition["category"]> = [
  "All",
  "Download",
  "Convert",
  "Edit",
  "Inspect",
];

const TOOL_ICONS: Record<ToolSlug, React.ComponentType<{ className?: string }>> = {
  "video-downloader": Download,
  "mp3-extractor": Music,
  "thumbnail-downloader": ImageIcon,
  "video-converter": RefreshCw,
  "video-compressor": Minimize2,
  "video-cropper": Crop,
  "image-converter": FileImage,
  "metadata-viewer": FileSearch,
  "url-validator": ShieldCheck,
};

export function BentoToolsGrid() {
  const [selectedCategory, setSelectedCategory] = useState<"All" | ToolDefinition["category"]>("All");
  const visibleTools =
    selectedCategory === "All"
      ? MEDIA_TOOLS
      : MEDIA_TOOLS.filter((t) => t.category === selectedCategory);

  return (
    <section id="tools" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">
            Media Suite
          </span>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
            All Media Tools
          </h2>
          <p className="mt-2 max-w-xl text-sm text-[var(--text-secondary)] sm:text-base">
            Nine focused utilities engineered for speed. Most conversions run directly in
            your browser via WebAssembly — your files stay on your device.
          </p>
        </div>

        <Link
          href="/tools"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3.5 py-2 text-xs font-semibold text-[var(--accent)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-hover)]"
        >
          <span>Open tools directory</span>
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Category Filter Pills */}
      <div className="mt-7 flex flex-wrap items-center gap-1.5">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                isActive
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white shadow-sm"
                  : "border-[var(--border-subtle)] bg-[var(--bg-secondary)]/70 text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {visibleTools.map((tool) => {
          const Icon = TOOL_ICONS[tool.slug];
          const spanClass =
            selectedCategory === "All"
              ? tool.bentoSpan === "wide"
                ? "sm:col-span-2"
                : tool.bentoSpan === "tall"
                ? "lg:row-span-2"
                : ""
              : "";

          return (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className={`group block ${spanClass}`}
            >
              <SpotlightCard
                enableTilt
                className="flex h-full flex-col justify-between p-5 transition-all duration-200 group-hover:border-[var(--accent)]/50"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--accent)] transition-all duration-200 group-hover:scale-105 group-hover:border-[var(--accent)]/40 group-hover:bg-[var(--accent)]/10 group-hover:text-[var(--accent-secondary)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                      {tool.badge}
                    </span>
                  </div>

                  <h3 className="mt-5 text-base font-semibold text-[var(--text-primary)]">
                    {tool.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {tool.shortDesc}
                  </p>

                  {selectedCategory === "All" && tool.bentoSpan === "tall" && (
                    <div className="mt-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/70 p-3 font-mono text-[11px] text-[var(--text-muted)]">
                      <div className="flex items-center justify-between">
                        <span>MP4 &rarr; WebM</span>
                        <span className="text-[var(--accent-secondary)]">H.264 / VP9</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span>MOV &rarr; MP4</span>
                        <span className="text-[var(--accent)]">Client WASM</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span>Video &rarr; GIF</span>
                        <span>Custom FPS</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3 text-xs font-medium text-[var(--text-primary)]">
                  <span>{tool.actionLabel}</span>
                  <ArrowUpRight className="h-4 w-4 text-[var(--text-muted)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--accent)]" />
                </div>
              </SpotlightCard>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
