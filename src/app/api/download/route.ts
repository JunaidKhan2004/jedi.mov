import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import type { Readable } from "node:stream";
import ffmpegStatic from "ffmpeg-static";
import { Ytdl } from "@distube/ytdl-core";
import type { VideoFormat } from "@distube/ytdl-core";
import { extractYouTubeId, validateMediaUrl } from "@/lib/media/platforms";

// Singleton Ytdl instance reused across requests
const ytdl = new Ytdl();

function getFfmpegPath(): string {
  if (ffmpegStatic && fs.existsSync(ffmpegStatic)) {
    return ffmpegStatic;
  }
  const fallback = path.join(
    process.cwd(),
    "node_modules",
    "ffmpeg-static",
    process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"
  );
  if (fs.existsSync(fallback)) {
    return fallback;
  }
  throw new Error("FFmpeg binary not found on server.");
}

function runFfmpeg(args: string[], signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const bin = getFfmpegPath();
    const proc = spawn(bin, args, { windowsHide: true });
    let stderr = "";

    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
      if (stderr.length > 4000) {
        stderr = stderr.slice(-4000);
      }
    });

    const onAbort = () => {
      proc.kill("SIGKILL");
      reject(new Error("Download aborted by client."));
    };
    signal.addEventListener("abort", onAbort, { once: true });

    proc.on("error", (err) => {
      signal.removeEventListener("abort", onAbort);
      reject(err);
    });

    proc.on("close", (code) => {
      signal.removeEventListener("abort", onAbort);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-500)}`));
      }
    });
  });
}

async function saveNodeStreamToFile(
  nodeStream: Readable,
  destPath: string,
  signal: AbortSignal
): Promise<void> {
  const writeStream = fs.createWriteStream(destPath);
  await pipeline(nodeStream, writeStream, { signal });
}

async function fetchYouTubeThumbnail(
  videoId: string,
  destPath: string,
  fallbackUrl: string | undefined,
  signal: AbortSignal
): Promise<boolean> {
  const candidates = [
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    ...(fallbackUrl ? [fallbackUrl] : []),
  ];

  for (const thumbUrl of candidates) {
    try {
      const res = await fetch(thumbUrl, { signal });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 1000) {
          await fsp.writeFile(destPath, buf);
          return true;
        }
      }
    } catch {
      if (signal.aborted) throw new Error("Aborted");
    }
  }
  return false;
}

async function createFileResponse(
  filePath: string,
  contentType: string,
  safeName: string,
  tempDir: string,
  signal: AbortSignal
): Promise<NextResponse> {
  const stat = await fsp.stat(filePath);
  const readStream = fs.createReadStream(filePath);
  let cleaned = false;

  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    fsp.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  };

  const webStream = new ReadableStream({
    start(controller) {
      readStream.on("data", (chunk: Buffer | string) => {
        const buf = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
        controller.enqueue(new Uint8Array(buf));
      });
      readStream.on("end", () => {
        controller.close();
        cleanup();
      });
      readStream.on("error", (err: Error) => {
        controller.error(err);
        cleanup();
      });
      signal.addEventListener("abort", () => {
        readStream.destroy();
        cleanup();
      });
    },
    cancel() {
      readStream.destroy();
      cleanup();
    },
  });

  const headers = new Headers();
  headers.set("Content-Type", contentType);
  headers.set("Content-Length", String(stat.size));
  headers.set("Content-Disposition", `attachment; filename="${safeName}"`);
  headers.set("Cache-Control", "no-store");

  return new NextResponse(webStream, { status: 200, headers });
}

export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get("provider");
  const targetUrl = req.nextUrl.searchParams.get("url") || "";
  const itagParam = req.nextUrl.searchParams.get("itag");
  const audioItagParam = req.nextUrl.searchParams.get("audioItag");
  const embedThumb = req.nextUrl.searchParams.get("embedThumb") === "1";
  const outFormat = req.nextUrl.searchParams.get("outFormat");
  const filename = req.nextUrl.searchParams.get("filename") || "jedi-mov-download";

  const validation = validateMediaUrl(targetUrl);
  if (!validation.validSyntax || validation.isRestrictedDomain || !validation.normalizedUrl) {
    return NextResponse.json(
      { error: validation.restrictionReason || "Invalid download URL." },
      { status: 400 }
    );
  }

  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");

  // 1. YouTube stream via @distube/ytdl-core
  if (provider === "youtube" && itagParam) {
    let tempDir: string | null = null;
    try {
      const itag = Number(itagParam);
      const info = await ytdl.getInfo(validation.normalizedUrl);
      const format = info.formats.find((f: VideoFormat) => f.itag === itag);
      if (!format) {
        return NextResponse.json({ error: "Requested format not found." }, { status: 404 });
      }

      // 1A. Mux Video + Audio into MP4 when audioItag is provided
      if (audioItagParam) {
        const audioItag = Number(audioItagParam);
        const audioFormat = info.formats.find((f: VideoFormat) => f.itag === audioItag);
        if (!audioFormat) {
          return NextResponse.json({ error: "Requested audio format not found." }, { status: 404 });
        }

        tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), "jedi-mux-"));
        const videoPath = path.join(tempDir, `video.${format.container || "mp4"}`);
        const audioPath = path.join(tempDir, `audio.${audioFormat.container || "m4a"}`);
        const outputPath = path.join(tempDir, "output.mp4");

        await Promise.all([
          saveNodeStreamToFile(ytdl.download(info, { format }), videoPath, req.signal),
          saveNodeStreamToFile(ytdl.download(info, { format: audioFormat }), audioPath, req.signal),
        ]);

        const audioCodecArgs = audioFormat.container === "mp4" ? ["-c:a", "copy"] : ["-c:a", "aac", "-b:a", "192k"];
        await runFfmpeg(
          [
            "-y",
            "-i",
            videoPath,
            "-i",
            audioPath,
            "-c:v",
            "copy",
            ...audioCodecArgs,
            "-movflags",
            "+faststart",
            outputPath,
          ],
          req.signal
        );

        const dirToClean = tempDir;
        tempDir = null; // Ownership transferred to createFileResponse
        return await createFileResponse(outputPath, "video/mp4", safeName, dirToClean, req.signal);
      }

      // 1B. Audio with embedded thumbnail cover art + metadata
      if (embedThumb) {
        tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), "jedi-audio-"));
        const rawAudioPath = path.join(tempDir, `raw.${format.container || "webm"}`);
        const thumbPath = path.join(tempDir, "cover.jpg");
        const targetExt = outFormat === "m4a" && format.container === "mp4" ? "m4a" : "mp3";
        const outputPath = path.join(tempDir, `output.${targetExt}`);

        const videoId = extractYouTubeId(validation.normalizedUrl) || info.videoDetails.id;
        const fallbackThumb = info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1]?.url;

        const [, hasThumb] = await Promise.all([
          saveNodeStreamToFile(ytdl.download(info, { format }), rawAudioPath, req.signal),
          fetchYouTubeThumbnail(videoId, thumbPath, fallbackThumb, req.signal),
        ]);

        const title = info.videoDetails.title || "Audio";
        const artist = info.videoDetails.author.name || "Unknown Artist";

        const ffArgs = ["-y", "-i", rawAudioPath];
        if (hasThumb) {
          ffArgs.push("-i", thumbPath, "-map", "0:a", "-map", "1:v");
        } else {
          ffArgs.push("-map", "0:a");
        }

        if (targetExt === "mp3") {
          ffArgs.push("-c:a", "libmp3lame", "-b:a", "192k", "-id3v2_version", "3");
        } else {
          ffArgs.push("-c:a", "copy");
          if (hasThumb) {
            ffArgs.push("-c:v", "mjpeg");
          }
        }

        if (hasThumb) {
          ffArgs.push(
            "-metadata:s:v",
            "title=Album cover",
            "-metadata:s:v",
            "comment=Cover (front)",
            "-disposition:v",
            "attached_pic"
          );
        }

        ffArgs.push("-metadata", `title=${title}`, "-metadata", `artist=${artist}`, outputPath);
        await runFfmpeg(ffArgs, req.signal);

        const mime = targetExt === "mp3" ? "audio/mpeg" : "audio/mp4";
        const dirToClean = tempDir;
        tempDir = null;
        return await createFileResponse(outputPath, mime, safeName, dirToClean, req.signal);
      }

      // 1C. Single stream pass-through (e.g. native combined 360p MP4)
      const nodeStream = ytdl.download(info, { format });
      const webStream = new ReadableStream({
        start(controller) {
          nodeStream.on("data", (chunk: Buffer) => {
            controller.enqueue(new Uint8Array(chunk));
          });
          nodeStream.on("end", () => {
            controller.close();
          });
          nodeStream.on("error", (err: Error) => {
            controller.error(err);
          });
          req.signal.addEventListener("abort", () => {
            nodeStream.destroy();
          });
        },
        cancel() {
          nodeStream.destroy();
        },
      });

      const headers = new Headers();
      headers.set("Content-Type", format.mimeType.split(";")[0] || "video/mp4");
      if (format.contentLength != null) {
        headers.set("Content-Length", String(format.contentLength));
      }
      headers.set("Content-Disposition", `attachment; filename="${safeName}"`);
      headers.set("Cache-Control", "no-store");

      return new NextResponse(webStream, { status: 200, headers });
    } catch (err: unknown) {
      if (tempDir) {
        fsp.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      }
      if (req.signal.aborted) {
        return new NextResponse(null, { status: 499 });
      }
      const message = err instanceof Error ? err.message : "YouTube stream failed.";
      console.error("[download] YouTube error:", err);
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  // 2. Direct remote media stream
  try {
    const upstream = await fetch(validation.normalizedUrl, {
      redirect: "follow",
      signal: req.signal,
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: `Upstream server returned status ${upstream.status}.` },
        { status: 502 }
      );
    }

    const headers = new Headers();
    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    const contentLength = upstream.headers.get("content-length");

    headers.set("Content-Type", contentType);
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }
    headers.set("Content-Disposition", `attachment; filename="${safeName}"`);
    headers.set("Cache-Control", "no-store");

    return new NextResponse(upstream.body, {
      status: 200,
      headers,
    });
  } catch (err) {
    if (req.signal.aborted) {
      return new NextResponse(null, { status: 499 });
    }
    const message = err instanceof Error ? err.message : "Download stream failed.";
    console.error("[download] Unhandled error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
