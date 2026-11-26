"use client";

import React, { useState } from "react";
import { fetchFile } from "@ffmpeg/util";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileVideo,
  Loader2,
  Upload,
} from "lucide-react";
import { getFFmpeg } from "@/lib/ffmpeg-client";
import { formatBytes } from "@/lib/media/platforms";
import type { ToolSlug } from "@/lib/media/types";
import { MagneticButton } from "@/components/MagneticButton";

interface FFmpegToolWorkspaceProps {
  slug: Extract<
    ToolSlug,
    "mp3-extractor" | "video-converter" | "video-compressor" | "video-cropper"
  >;
}

export function FFmpegToolWorkspace({ slug }: FFmpegToolWorkspaceProps) {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [outputName, setOutputName] = useState<string>("");
  const [outputSize, setOutputSize] = useState<number>(0);

  // Tool-specific options
  const [targetFormat, setTargetFormat] = useState<"mp4" | "webm" | "mov" | "gif">("mp4");
  const [bitrate, setBitrate] = useState<"128k" | "192k" | "320k">("192k");
  const [crf, setCrf] = useState<"23" | "28" | "32">("28");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1" | "4:5">("1:1");

  const handleFileChange = (selected: File | null) => {
    if (!selected) return;
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    setFile(selected);
    setOutputUrl(null);
    setError(null);
    setProgress(0);
  };

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setProgress(0);
    setStatusText("Loading FFmpeg WebAssembly engine...");

    try {
      const ffmpeg = await getFFmpeg(undefined, (ratio) => {
        setProgress(Math.round(ratio * 100));
      });

      const inputExt = file.name.split(".").pop() || "mp4";
      const inputName = `input.${inputExt}`;
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      setStatusText("Processing media locally in your browser...");

      let outFile = "output.mp4";
      let mime = "video/mp4";
      let args: string[] = [];

      if (slug === "mp3-extractor") {
        outFile = "output.mp3";
        mime = "audio/mpeg";
        args = ["-i", inputName, "-vn", "-acodec", "libmp3lame", "-b:a", bitrate, outFile];
      } else if (slug === "video-converter") {
        outFile = `output.${targetFormat}`;
        mime =
          targetFormat === "webm"
            ? "video/webm"
            : targetFormat === "gif"
            ? "image/gif"
            : targetFormat === "mov"
            ? "video/quicktime"
            : "video/mp4";
        if (targetFormat === "gif") {
          args = ["-i", inputName, "-vf", "fps=12,scale=480:-1:flags=lanczos", outFile];
        } else {
          args = ["-i", inputName, outFile];
        }
      } else if (slug === "video-compressor") {
        outFile = "compressed.mp4";
        mime = "video/mp4";
        args = [
          "-i",
          inputName,
          "-vcodec",
          "libx264",
          "-crf",
          crf,
          "-preset",
          "veryfast",
          outFile,
        ];
      } else if (slug === "video-cropper") {
        outFile = "cropped.mp4";
        mime = "video/mp4";
        const cropExprMap: Record<string, string> = {
          "16:9": "crop=ih*16/9:ih",
          "9:16": "crop=ih*9/16:ih",
          "1:1": "crop=min(iw\\,ih):min(iw\\,ih)",
          "4:5": "crop=ih*4/5:ih",
        };
        args = ["-i", inputName, "-vf", cropExprMap[aspectRatio], outFile];
      }

      await ffmpeg.exec(args);
      const data = await ffmpeg.readFile(outFile);
      const uint8 = data instanceof Uint8Array ? data : new Uint8Array();
      const blob = new Blob([uint8 as BlobPart], { type: mime });
      const url = URL.createObjectURL(blob);

      const baseName = file.name.replace(/\.[^/.]+$/, "");
      const ext = outFile.split(".").pop() || "mp4";
      setOutputName(`${baseName}-${slug}.${ext}`);
      setOutputSize(blob.size);
      setOutputUrl(url);
      setProgress(100);
      setStatusText("Completed");

      await ffmpeg.deleteFile(inputName).catch(() => {});
      await ffmpeg.deleteFile(outFile).catch(() => {});
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "FFmpeg processing failed. Try a smaller file or standard MP4/WebM input."
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-secondary)]/60 p-8 text-center transition-colors hover:border-[var(--accent)]">
        <input
          type="file"
          accept={slug === "mp3-extractor" ? "video/*,audio/*" : "video/*"}
          onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          className="sr-only"
        />
        <Upload className="h-8 w-8 text-[var(--accent)]" />
        <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">
          {file ? file.name : "Select or drop a video file"}
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {file
            ? `${formatBytes(file.size)} • Processed 100% locally in your browser`
            : "MP4, WebM, MOV, MKV — never uploaded to any server"}
        </p>
      </label>

      {/* Controls */}
      {file && (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {slug === "mp3-extractor" && (
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-[var(--text-secondary)]">
                  Audio Bitrate
                </label>
                <select
                  value={bitrate}
                  onChange={(e) => setBitrate(e.target.value as "128k" | "192k" | "320k")}
                  className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 text-sm text-[var(--text-primary)]"
                >
                  <option value="128k">128 kbps (Standard)</option>
                  <option value="192k">192 kbps (High)</option>
                  <option value="320k">320 kbps (Studio)</option>
                </select>
              </div>
            )}

            {slug === "video-converter" && (
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-[var(--text-secondary)]">
                  Target Format
                </label>
                <select
                  value={targetFormat}
                  onChange={(e) =>
                    setTargetFormat(e.target.value as "mp4" | "webm" | "mov" | "gif")
                  }
                  className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 text-sm text-[var(--text-primary)]"
                >
                  <option value="mp4">MP4 (H.264)</option>
                  <option value="webm">WebM</option>
                  <option value="mov">MOV</option>
                  <option value="gif">Animated GIF</option>
                </select>
              </div>
            )}

            {slug === "video-compressor" && (
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-[var(--text-secondary)]">
                  Compression Level
                </label>
                <select
                  value={crf}
                  onChange={(e) => setCrf(e.target.value as "23" | "28" | "32")}
                  className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 text-sm text-[var(--text-primary)]"
                >
                  <option value="23">Balanced (CRF 23)</option>
                  <option value="28">Strong (CRF 28)</option>
                  <option value="32">Maximum Shrink (CRF 32)</option>
                </select>
              </div>
            )}

            {slug === "video-cropper" && (
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-[var(--text-secondary)]">
                  Target Aspect Ratio
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) =>
                    setAspectRatio(e.target.value as "16:9" | "9:16" | "1:1" | "4:5")
                  }
                  className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 text-sm text-[var(--text-primary)]"
                >
                  <option value="1:1">1:1 (Square)</option>
                  <option value="9:16">9:16 (Vertical / Shorts)</option>
                  <option value="4:5">4:5 (Portrait Feed)</option>
                  <option value="16:9">16:9 (Widescreen)</option>
                </select>
              </div>
            )}

            <MagneticButton
              type="button"
              onClick={handleProcess}
              disabled={processing}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-60"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing {progress}%</span>
                </>
              ) : (
                <>
                  <FileVideo className="h-4 w-4" />
                  <span>Start Processing</span>
                </>
              )}
            </MagneticButton>
          </div>

          {processing && (
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                <span>{statusText}</span>
                <span className="font-mono">{progress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-secondary)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {outputUrl && (
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{outputName}</p>
              <p className="text-xs text-[var(--text-secondary)]">
                Output size: {formatBytes(outputSize)}
                {file ? ` (from ${formatBytes(file.size)})` : ""}
              </p>
            </div>
          </div>

          <a
            href={outputUrl}
            download={outputName}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            <Download className="h-4 w-4" />
            <span>Download File</span>
          </a>
        </div>
      )}
    </div>
  );
}
