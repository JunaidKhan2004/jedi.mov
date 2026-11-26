"use client";

import React, { useState } from "react";
import { CheckCircle2, Download, Image as ImageIcon, Upload } from "lucide-react";
import { formatBytes } from "@/lib/media/platforms";
import { MagneticButton } from "@/components/MagneticButton";

export function ImageConverterWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [format, setFormat] = useState<"image/png" | "image/jpeg" | "image/webp">("image/webp");
  const [quality, setQuality] = useState(0.9);
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [convertedSize, setConvertedSize] = useState<number>(0);

  const handleFile = (selected: File | null) => {
    if (!selected) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (convertedUrl) URL.revokeObjectURL(convertedUrl);
    const url = URL.createObjectURL(selected);
    setFile(selected);
    setPreviewUrl(url);
    setConvertedUrl(null);

    const img = new window.Image();
    img.onload = () => setDimensions({ w: img.width, h: img.height });
    img.src = url;
  };

  const handleConvert = () => {
    if (!previewUrl || !file) return;
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      if (format === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          if (convertedUrl) URL.revokeObjectURL(convertedUrl);
          setConvertedUrl(URL.createObjectURL(blob));
          setConvertedSize(blob.size);
        },
        format,
        quality
      );
    };
    img.src = previewUrl;
  };

  const ext = format.split("/")[1];
  const outputName = file
    ? `${file.name.replace(/\.[^/.]+$/, "")}.${ext === "jpeg" ? "jpg" : ext}`
    : `converted.${ext}`;

  return (
    <div className="space-y-6">
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-secondary)]/60 p-8 text-center transition-colors hover:border-[var(--accent)]">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
          className="sr-only"
        />
        <Upload className="h-8 w-8 text-[var(--accent)]" />
        <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">
          {file ? file.name : "Select or drop an image file"}
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {file && dimensions
            ? `${dimensions.w}×${dimensions.h} • ${formatBytes(file.size)}`
            : "PNG, JPEG, WebP, GIF, BMP — instant local Canvas conversion"}
        </p>
      </label>

      {file && (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-[var(--text-secondary)]">
                  Output Format
                </label>
                <select
                  value={format}
                  onChange={(e) =>
                    setFormat(e.target.value as "image/png" | "image/jpeg" | "image/webp")
                  }
                  className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 text-sm text-[var(--text-primary)]"
                >
                  <option value="image/webp">WebP</option>
                  <option value="image/png">PNG</option>
                  <option value="image/jpeg">JPEG</option>
                </select>
              </div>

              {format !== "image/png" && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">
                    Quality ({Math.round(quality * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0.2"
                    max="1"
                    step="0.05"
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="accent-[var(--accent)]"
                  />
                </div>
              )}
            </div>

            <MagneticButton
              type="button"
              onClick={handleConvert}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
            >
              <ImageIcon className="h-4 w-4" />
              <span>Convert Image</span>
            </MagneticButton>
          </div>
        </div>
      )}

      {convertedUrl && (
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{outputName}</p>
              <p className="text-xs text-[var(--text-secondary)]">
                Converted size: {formatBytes(convertedSize)}
              </p>
            </div>
          </div>

          <a
            href={convertedUrl}
            download={outputName}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            <Download className="h-4 w-4" />
            <span>Download {ext.toUpperCase()}</span>
          </a>
        </div>
      )}
    </div>
  );
}
