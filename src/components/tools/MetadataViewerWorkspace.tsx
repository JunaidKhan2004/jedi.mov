"use client";

import React, { useState } from "react";
import { FileSearch, Upload } from "lucide-react";
import { formatBytes } from "@/lib/media/platforms";

interface LocalMetadata {
  name: string;
  size: string;
  type: string;
  lastModified: string;
  dimensions?: string;
  duration?: string;
}

export function MetadataViewerWorkspace() {
  const [meta, setMeta] = useState<LocalMetadata | null>(null);

  const inspectFile = (file: File | null) => {
    if (!file) return;
    const base: LocalMetadata = {
      name: file.name,
      size: `${formatBytes(file.size)} (${file.size.toLocaleString()} bytes)`,
      type: file.type || "Unknown MIME",
      lastModified: new Date(file.lastModified).toLocaleString(),
    };

    const objectUrl = URL.createObjectURL(file);

    if (file.type.startsWith("image/")) {
      const img = new window.Image();
      img.onload = () => {
        setMeta({ ...base, dimensions: `${img.width} × ${img.height} px` });
        URL.revokeObjectURL(objectUrl);
      };
      img.src = objectUrl;
    } else if (file.type.startsWith("video/") || file.type.startsWith("audio/")) {
      const el = document.createElement(file.type.startsWith("video/") ? "video" : "audio");
      el.preload = "metadata";
      el.onloadedmetadata = () => {
        const dur = Number.isFinite(el.duration)
          ? `${Math.floor(el.duration / 60)}m ${Math.round(el.duration % 60)}s`
          : "Unknown";
        const dims =
          el instanceof HTMLVideoElement && el.videoWidth
            ? `${el.videoWidth} × ${el.videoHeight} px`
            : undefined;
        setMeta({ ...base, duration: dur, dimensions: dims });
        URL.revokeObjectURL(objectUrl);
      };
      el.src = objectUrl;
    } else {
      setMeta(base);
      URL.revokeObjectURL(objectUrl);
    }
  };

  return (
    <div className="space-y-6">
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-secondary)]/60 p-8 text-center transition-colors hover:border-[var(--accent)]">
        <input
          type="file"
          accept="video/*,audio/*,image/*"
          onChange={(e) => inspectFile(e.target.files?.[0] || null)}
          className="sr-only"
        />
        <Upload className="h-8 w-8 text-[var(--accent)]" />
        <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">
          Drop any video, audio, or image file to inspect metadata
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Read locally in your browser — zero server uploads
        </p>
      </label>

      {meta && (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
          <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
            <FileSearch className="h-4 w-4 text-[var(--accent)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Extracted File Metadata
            </h3>
          </div>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-[var(--text-muted)]">File Name</dt>
              <dd className="mt-0.5 font-mono text-sm text-[var(--text-primary)]">{meta.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-muted)]">File Size</dt>
              <dd className="mt-0.5 font-mono text-sm text-[var(--text-primary)]">{meta.size}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-muted)]">MIME Type</dt>
              <dd className="mt-0.5 font-mono text-sm text-[var(--text-primary)]">{meta.type}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-muted)]">Last Modified</dt>
              <dd className="mt-0.5 font-mono text-sm text-[var(--text-primary)]">
                {meta.lastModified}
              </dd>
            </div>
            {meta.dimensions && (
              <div>
                <dt className="text-xs text-[var(--text-muted)]">Dimensions</dt>
                <dd className="mt-0.5 font-mono text-sm text-[var(--accent-secondary)]">
                  {meta.dimensions}
                </dd>
              </div>
            )}
            {meta.duration && (
              <div>
                <dt className="text-xs text-[var(--text-muted)]">Duration</dt>
                <dd className="mt-0.5 font-mono text-sm text-[var(--accent)]">{meta.duration}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
