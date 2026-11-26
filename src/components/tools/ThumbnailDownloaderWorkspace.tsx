"use client";

import React, { useState } from "react";
import { AlertCircle, Download, Image as ImageIcon, Loader2 } from "lucide-react";
import type { MediaInspectionResult } from "@/lib/media/types";
import { MagneticButton } from "@/components/MagneticButton";

export function ThumbnailDownloaderWorkspace() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MediaInspectionResult | null>(null);

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to fetch thumbnails for this URL.");
        return;
      }
      setResult(data as MediaInspectionResult);
    } catch {
      setError("Network error while fetching thumbnails.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleFetch}
        className="flex flex-col gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-2 sm:flex-row"
      >
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a YouTube, Vimeo, or SoundCloud URL..."
          className="h-11 flex-1 rounded-xl bg-transparent px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
        />
        <MagneticButton
          type="submit"
          disabled={loading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
          <span>Fetch Thumbnails</span>
        </MagneticButton>
      </form>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="grid gap-4 sm:grid-cols-2">
          {result.formats
            .filter((f) => f.kind === "image")
            .map((fmt) => (
              <div
                key={fmt.id}
                className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]"
              >
                <div className="aspect-video bg-[var(--bg-secondary)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fmt.downloadUrl}
                    alt={fmt.label}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{fmt.resolution}</p>
                    <p className="text-xs text-[var(--text-muted)]">{fmt.format}</p>
                  </div>
                  <a
                    href={`/api/download?url=${encodeURIComponent(
                      fmt.downloadUrl
                    )}&filename=${encodeURIComponent(fmt.filename)}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 text-xs font-semibold text-white hover:bg-[var(--accent-hover)]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
