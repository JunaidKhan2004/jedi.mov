"use client";

import React, { useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ClipboardPaste,
  Download,
  FileAudio,
  FileImage,
  FileVideo,
  Film,
  Image as ImageIcon,
  Info,
  Link2,
  Loader2,
  Music,
  X,
  XCircle,
} from "lucide-react";
import { formatBytes, normalizeScheme } from "@/lib/media/platforms";
import type { MediaFormatOption, MediaInspectionResult } from "@/lib/media/types";
import { MagneticButton } from "./MagneticButton";

const SAMPLE_URLS = [
  {
    label: "Sample MP4",
    url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  },
  {
    label: "Sample WebM",
    url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm",
  },
  {
    label: "YouTube Link",
    url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
  },
];

const PLATFORM_PILLS = [
  "Direct MP4 / WebM",
  "MP3 / WAV / M4A",
  "YouTube",
  "Vimeo",
  "SoundCloud",
];

export function DownloaderPanel({
  onMediaDetected,
}: {
  onMediaDetected?: (media: MediaInspectionResult | null) => void;
}) {
  const [url, setUrl] = useState("");
  const [inspecting, setInspecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [media, setMedia] = useState<MediaInspectionResult | null>(null);
  const [activeKind, setActiveKind] = useState<"video" | "audio" | "image">("video");
  const [selectedFormatId, setSelectedFormatId] = useState<string>("");

  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [downloadedBytes, setDownloadedBytes] = useState<number>(0);
  const [totalBytes, setTotalBytes] = useState<number | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        setError(null);
      }
    } catch {
      setError("Clipboard access was denied. Please paste the URL manually (Ctrl+V / Cmd+V).");
    }
  };

  const handleClear = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setUrl("");
    setError(null);
    setMedia(null);
    setSelectedFormatId("");
    setDownloading(false);
    setProgress(0);
    setDownloadSuccess(null);
    onMediaDetected?.(null);
  };

  const handleInspect = async (targetUrl?: string) => {
    // Normalize scheme before sending — handles bare "youtube.com/..." inputs
    const queryUrl = normalizeScheme((targetUrl ?? url).trim());
    if (!queryUrl) {
      setError("Paste a supported media URL to inspect.");
      return;
    }

    // Reflect the normalized URL back into the input field
    setUrl(queryUrl);

    setInspecting(true);
    setError(null);
    setDownloadSuccess(null);
    setMedia(null);
    onMediaDetected?.(null);

    try {
      const res = await fetch("/api/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: queryUrl }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to inspect this URL.");
        return;
      }

      const result = data as MediaInspectionResult;
      setMedia(result);
      const firstFmt = result.formats[0];
      setActiveKind(firstFmt?.kind || "video");
      setSelectedFormatId(firstFmt?.id || "");
      onMediaDetected?.(result);
    } catch {
      setError("Network error while inspecting URL. Please check your connection.");
    } finally {
      setInspecting(false);
    }
  };

  const handleDownload = async () => {
    if (!media) return;
    const format: MediaFormatOption | undefined =
      media.formats.find((f) => f.id === selectedFormatId) || media.formats[0];

    if (!format) {
      setError("No downloadable format is available for this item.");
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setDownloading(true);
    setProgress(0);
    setDownloadedBytes(0);
    setTotalBytes(format.fileSizeBytes);
    setError(null);
    setDownloadSuccess(null);

    try {
      // For YouTube/API-routed formats, downloadUrl is already the correct
      // /api/download?provider=youtube&itag=… endpoint — use it directly.
      // For direct external streams (isDirectStream=true), route through the
      // proxy so we can attach the right filename and avoid CORS.
      const fetchUrl = format.isDirectStream
        ? `/api/download?url=${encodeURIComponent(format.downloadUrl)}&filename=${encodeURIComponent(format.filename)}`
        : format.downloadUrl;

      const res = await fetch(fetchUrl, { signal: controller.signal });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Download failed (${res.status}).`);
      }

      const contentLengthHeader = res.headers.get("content-length");
      const total = contentLengthHeader ? Number(contentLengthHeader) : format.fileSizeBytes;
      setTotalBytes(total);

      if (!res.body) {
        throw new Error("Empty response stream.");
      }

      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.length;
          setDownloadedBytes(received);
          if (total && total > 0) {
            setProgress(Math.min(100, Math.round((received / total) * 100)));
          }
        }
      }

      const blob = new Blob(chunks as BlobPart[], {
        type: res.headers.get("content-type") || "application/octet-stream",
      });
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = format.filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);

      setProgress(100);
      setDownloadSuccess(`Saved ${format.filename} (${formatBytes(received)})`);
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        setError("Download canceled.");
      } else {
        setError(err instanceof Error ? err.message : "Download failed.");
      }
    } finally {
      setDownloading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelDownload = () => {
    abortControllerRef.current?.abort();
  };

  const selectedFormat =
    media?.formats.find((f) => f.id === selectedFormatId) || media?.formats[0];

  return (
    <div id="downloader" className="w-full">
      {/* Main URL Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleInspect();
        }}
        className="glass-surface-elevated rounded-2xl p-2 transition-colors focus-within:border-[var(--accent)]"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex flex-1 items-center">
            <Link2 className="pointer-events-none absolute left-4 h-5 w-5 text-[var(--text-muted)]" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste a video, audio, or direct media URL"
              aria-label="Media URL input"
              className="h-12 w-full rounded-xl bg-transparent pl-12 pr-20 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none sm:text-base"
            />
            <div className="absolute right-2 flex items-center gap-1">
              {url && (
                <button
                  type="button"
                  onClick={handleClear}
                  aria-label="Clear URL input"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={handlePaste}
                aria-label="Paste URL from clipboard"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-2.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
              >
                <ClipboardPaste className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Paste</span>
              </button>
            </div>
          </div>

          <MagneticButton
            type="submit"
            disabled={inspecting}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-60"
          >
            {inspecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Detecting...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Inspect &amp; Download</span>
              </>
            )}
          </MagneticButton>
        </div>
      </form>

      {/* Supported platform pills + quick samples */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-[var(--text-muted)]">
        <div className="flex flex-wrap items-center gap-1.5">
          <span>Supported:</span>
          {PLATFORM_PILLS.map((p) => (
            <span
              key={p}
              className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)]"
            >
              {p}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span>Try:</span>
          {SAMPLE_URLS.map((sample) => (
            <button
              key={sample.label}
              type="button"
              onClick={() => {
                setUrl(sample.url);
                void handleInspect(sample.url);
              }}
              className="rounded-md border border-[var(--border-subtle)] px-2 py-0.5 text-[11px] text-[var(--accent)] transition-colors hover:border-[var(--accent)]"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div
          role="alert"
          style={{
            backgroundColor: "var(--status-error-bg)",
            borderColor: "var(--status-error-border)",
            color: "var(--status-error-text)",
          }}
          className="mt-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="min-w-0 break-words">{error}</p>
        </div>
      )}

      {/* Media Information Panel */}
      {media && (() => {
        const availableKinds = (["video", "audio", "image"] as const).filter((k) =>
          media.formats.some((f) => f.kind === k)
        );
        const filteredFormats =
          availableKinds.length > 1
            ? media.formats.filter((f) => f.kind === activeKind)
            : media.formats;
        const displayedFormats = filteredFormats.length > 0 ? filteredFormats : media.formats;

        const kindMeta: Record<
          "video" | "audio" | "image",
          { label: string; icon: React.ReactNode }
        > = {
          video: { label: "Video", icon: <Film className="h-3.5 w-3.5" /> },
          audio: { label: "Audio", icon: <Music className="h-3.5 w-3.5" /> },
          image: { label: "Thumbnail", icon: <ImageIcon className="h-3.5 w-3.5" /> },
        };

        return (
          <div className="glass-surface mt-5 overflow-hidden rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-stretch">
              {/* Thumbnail / Media Type Visual */}
              <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] sm:w-52 md:w-56">
                {media.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={media.thumbnailUrl}
                    alt={media.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
                    {selectedFormat?.kind === "audio" ? (
                      <FileAudio className="h-9 w-9 text-[var(--accent-secondary)]" />
                    ) : selectedFormat?.kind === "image" ? (
                      <FileImage className="h-9 w-9 text-[var(--accent)]" />
                    ) : (
                      <FileVideo className="h-9 w-9 text-[var(--accent)]" />
                    )}
                    <span className="font-mono text-xs uppercase">
                      {selectedFormat?.format || "MEDIA"}
                    </span>
                  </div>
                )}
                <span className="absolute left-2 top-2 rounded-md bg-black/75 px-2 py-0.5 font-mono text-[10px] font-medium text-white backdrop-blur-sm">
                  {media.platformName}
                </span>
                {media.duration && (
                  <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-2 py-0.5 font-mono text-[10px] text-white backdrop-blur-sm">
                    {media.duration}
                  </span>
                )}
              </div>

              {/* Metadata & Format Selector */}
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-3.5">
                <div className="min-w-0">
                  <h3 className="line-clamp-2 text-base font-semibold leading-snug text-[var(--text-primary)]">
                    {media.title}
                  </h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-secondary)]">
                    {media.author && (
                      <span className="truncate font-medium text-[var(--text-primary)]/80">
                        {media.author}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-md bg-[var(--bg-secondary)] px-2 py-0.5 font-mono text-[11px]">
                      {selectedFormat?.fileSizeLabel || media.fileSizeLabel}
                    </span>
                    {selectedFormat?.format && (
                      <span className="inline-flex items-center rounded-md bg-[var(--accent)]/12 px-2 py-0.5 font-mono text-[11px] font-medium text-[var(--accent)]">
                        {selectedFormat.format}
                      </span>
                    )}
                  </div>

                  {media.notice && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-secondary)]" />
                      <span>{media.notice}</span>
                    </div>
                  )}
                </div>

                {/* Format Category Tabs (Video / Audio / Thumbnail) */}
                {availableKinds.length > 1 && (
                  <div className="inline-flex w-fit flex-wrap items-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-1">
                    {availableKinds.map((kind) => {
                      const isActive = activeKind === kind;
                      return (
                        <button
                          key={kind}
                          type="button"
                          disabled={downloading}
                          onClick={() => {
                            setActiveKind(kind);
                            const firstMatch = media.formats.find((f) => f.kind === kind);
                            if (firstMatch) setSelectedFormatId(firstMatch.id);
                          }}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${isActive
                              ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm"
                              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            }`}
                        >
                          {kindMeta[kind].icon}
                          <span>{kindMeta[kind].label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Format & Resolution Picker + Download Action */}
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                  <div className="relative min-w-0 flex-1">
                    <select
                      aria-label="Select format and resolution"
                      value={selectedFormatId}
                      onChange={(e) => setSelectedFormatId(e.target.value)}
                      disabled={downloading}
                      className="h-11 w-full appearance-none truncate rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] pl-3.5 pr-9 text-sm font-medium text-[var(--text-primary)] transition-colors focus:border-[var(--accent)] focus:outline-none disabled:opacity-60"
                    >
                      {displayedFormats.map((fmt) => {
                        const hasFormatInLabel = fmt.label
                          .toLowerCase()
                          .includes(fmt.format.toLowerCase());
                        const displayLabel = hasFormatInLabel
                          ? `${fmt.label} (${fmt.fileSizeLabel})`
                          : `${fmt.label} — ${fmt.format} (${fmt.fileSizeLabel})`;
                        return (
                          <option key={fmt.id} value={fmt.id}>
                            {displayLabel}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                  </div>

                  {!downloading ? (
                    <MagneticButton
                      type="button"
                      onClick={handleDownload}
                      className="inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--accent-hover)]"
                    >
                      <Download className="h-4 w-4 shrink-0" />
                      <span>Download {selectedFormat?.format}</span>
                    </MagneticButton>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCancelDownload}
                      style={{
                        backgroundColor: "var(--status-error-bg)",
                        borderColor: "var(--status-error-border)",
                        color: "var(--status-error-text)",
                      }}
                      className="inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-5 text-sm font-medium transition-opacity hover:opacity-85"
                    >
                      <XCircle className="h-4 w-4 shrink-0" />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>

                {/* Progress Indicator */}
                {downloading && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs text-[var(--text-secondary)]">
                      <span className="truncate font-medium">
                        {downloadedBytes === 0
                          ? selectedFormat?.kind === "audio" && !selectedFormat?.isDirectStream
                            ? "Embedding cover art & metadata..."
                            : selectedFormat?.kind === "video" && !selectedFormat?.isDirectStream
                              ? "Preparing & merging HD video + audio..."
                              : "Connecting to stream..."
                          : "Downloading media..."}
                      </span>
                      <span className="shrink-0 font-mono">
                        {downloadedBytes > 0 ? (
                          <>
                            {formatBytes(downloadedBytes)}
                            {totalBytes ? ` / ${formatBytes(totalBytes)} (${progress}%)` : ""}
                          </>
                        ) : (
                          "Please wait"
                        )}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-secondary)]">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] transition-all duration-200 ${downloadedBytes === 0 ? "animate-pulse" : ""
                          }`}
                        style={{
                          width: `${downloadedBytes === 0 ? 100 : totalBytes ? progress : 60
                            }%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Success State */}
                {downloadSuccess && (
                  <div
                    style={{
                      backgroundColor: "var(--status-success-bg)",
                      borderColor: "var(--status-success-border)",
                      color: "var(--status-success-text)",
                    }}
                    className="flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-medium"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 truncate">{downloadSuccess}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
