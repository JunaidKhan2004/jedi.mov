import { NextRequest, NextResponse } from "next/server";
import { Ytdl } from "@distube/ytdl-core";
import type { VideoFormat } from "@distube/ytdl-core";
import {
  extractYouTubeId,
  formatBytes,
  PLATFORM_LABELS,
  validateMediaUrl,
} from "@/lib/media/platforms";
import type { MediaFormatOption, MediaInspectionResult } from "@/lib/media/types";

// Singleton Ytdl instance reused across requests
const ytdl = new Ytdl();

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "media-file";
}

function formatDuration(secondsStr: string | number | undefined): string | undefined {
  const total = Number(secondsStr);
  if (!Number.isFinite(total) || total <= 0) return undefined;
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function getExtensionFromMime(mime: string | null): string {
  if (!mime) return "bin";
  const clean = mime.split(";")[0].trim().toLowerCase();
  const map: Record<string, string> = {
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/mp4": "m4a",
    "audio/ogg": "ogg",
    "audio/flac": "flac",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[clean] || "bin";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { url?: string };
    const rawUrl = body?.url ?? "";
    const validation = validateMediaUrl(rawUrl);

    if (!validation.validSyntax || validation.isRestrictedDomain || !validation.normalizedUrl) {
      return NextResponse.json(
        {
          error: validation.restrictionReason || "Invalid or unsupported URL.",
          validation,
        },
        { status: 400 }
      );
    }

    const url = validation.normalizedUrl;
    const platform = validation.platform;

    // 1. YouTube: Extract real video + audio streams via @distube/ytdl-core
    if (platform === "youtube") {
      const videoId = extractYouTubeId(url);
      if (!videoId) {
        return NextResponse.json(
          { error: "Could not extract a valid YouTube video ID from this URL." },
          { status: 400 }
        );
      }

      try {
        const info = await ytdl.getInfo(url);
        const details = info.videoDetails;
        const safeTitle = sanitizeFilename(details.title || `youtube-${videoId}`);
        const formats: MediaFormatOption[] = [];

        // Find best audio-only streams (prefer M4A/MP4 for lossless MP4 muxing)
        const audioStreams = info.formats
          .filter((f: VideoFormat) => f.hasAudio && !f.hasVideo && f.url)
          .sort((a: VideoFormat, b: VideoFormat) => (b.audioBitrate || 0) - (a.audioBitrate || 0));

        const bestM4aAudio =
          audioStreams.find((f: VideoFormat) => f.container === "mp4") || audioStreams[0];
        const bestAnyAudio = audioStreams[0];

        // High-res video-only formats paired with best audio (e.g. 1080p, 720p, 1440p, 4K)
        const videoOnly = info.formats
          .filter((f: VideoFormat) => f.hasVideo && !f.hasAudio && f.container === "mp4" && f.url)
          .sort((a: VideoFormat, b: VideoFormat) => (b.height || 0) - (a.height || 0))
          .slice(0, 4);

        for (const f of videoOnly) {
          const videoBytes = f.contentLength ?? null;
          const audioBytes = bestM4aAudio?.contentLength ?? null;
          const sizeBytes =
            videoBytes != null && audioBytes != null ? videoBytes + audioBytes : videoBytes;
          const res = f.qualityLabel || (f.height ? `${f.height}p` : "HD");
          if (formats.some((existing) => existing.resolution === res && existing.kind === "video")) {
            continue;
          }
          const audioParam = bestM4aAudio ? `&audioItag=${bestM4aAudio.itag}` : "";
          formats.push({
            id: `yt-itag-${f.itag}`,
            label: bestM4aAudio
              ? `${res} MP4 (Video + Audio)`
              : `${res} MP4 (Video Only)`,
            format: "MP4",
            resolution: res,
            fileSizeBytes: sizeBytes,
            fileSizeLabel: formatBytes(sizeBytes),
            downloadUrl: `/api/download?provider=youtube&itag=${f.itag}${audioParam}&url=${encodeURIComponent(
              url
            )}&filename=${encodeURIComponent(`${safeTitle}-${res}.mp4`)}`,
            filename: `${safeTitle}-${res}.mp4`,
            kind: "video",
            isDirectStream: false,
          });
        }

        // Combined video+audio formats (MP4 with native audio, e.g. 360p)
        const combined = info.formats
          .filter((f: VideoFormat) => f.hasVideo && f.hasAudio && f.url)
          .sort((a: VideoFormat, b: VideoFormat) => (b.height || 0) - (a.height || 0));

        for (const f of combined) {
          const sizeBytes = f.contentLength ?? null;
          const container = (f.container || "mp4").toUpperCase();
          const res = f.qualityLabel || (f.height ? `${f.height}p` : "HD");
          if (formats.some((existing) => existing.resolution === res && existing.kind === "video")) {
            continue;
          }
          formats.push({
            id: `yt-itag-${f.itag}`,
            label: `${res} ${container} (Video + Audio)`,
            format: container,
            resolution: res,
            fileSizeBytes: sizeBytes,
            fileSizeLabel: formatBytes(sizeBytes),
            downloadUrl: `/api/download?provider=youtube&itag=${f.itag}&url=${encodeURIComponent(
              url
            )}&filename=${encodeURIComponent(`${safeTitle}-${res}.${f.container || "mp4"}`)}`,
            filename: `${safeTitle}-${res}.${f.container || "mp4"}`,
            kind: "video",
            isDirectStream: false,
          });
        }

        // Audio-only formats with embedded thumbnail cover art (MP3 & M4A)
        if (bestAnyAudio) {
          const kbps = bestAnyAudio.audioBitrate ? `${bestAnyAudio.audioBitrate}kbps` : "192kbps";
          formats.push({
            id: `yt-audio-mp3-${bestAnyAudio.itag}`,
            label: `Audio MP3 (${kbps}) + Cover Art`,
            format: "MP3",
            resolution: kbps,
            fileSizeBytes: bestAnyAudio.contentLength ?? null,
            fileSizeLabel: formatBytes(bestAnyAudio.contentLength ?? null),
            downloadUrl: `/api/download?provider=youtube&itag=${bestAnyAudio.itag}&embedThumb=1&outFormat=mp3&url=${encodeURIComponent(
              url
            )}&filename=${encodeURIComponent(`${safeTitle}.mp3`)}`,
            filename: `${safeTitle}.mp3`,
            kind: "audio",
            isDirectStream: false,
          });
        }

        if (bestM4aAudio && bestM4aAudio.container === "mp4") {
          const kbps = bestM4aAudio.audioBitrate ? `${bestM4aAudio.audioBitrate}kbps` : "Audio";
          formats.push({
            id: `yt-audio-m4a-${bestM4aAudio.itag}`,
            label: `Audio M4A (${kbps}) + Cover Art`,
            format: "M4A",
            resolution: kbps,
            fileSizeBytes: bestM4aAudio.contentLength ?? null,
            fileSizeLabel: formatBytes(bestM4aAudio.contentLength ?? null),
            downloadUrl: `/api/download?provider=youtube&itag=${bestM4aAudio.itag}&embedThumb=1&outFormat=m4a&url=${encodeURIComponent(
              url
            )}&filename=${encodeURIComponent(`${safeTitle}.m4a`)}`,
            filename: `${safeTitle}.m4a`,
            kind: "audio",
            isDirectStream: false,
          });
        }

        // Thumbnail option
        formats.push({
          id: "yt-thumb-max",
          label: "Thumbnail — Max Resolution (1280×720)",
          format: "JPG",
          resolution: "1280×720",
          fileSizeBytes: null,
          fileSizeLabel: "HD Image",
          downloadUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          filename: `${safeTitle}-maxres.jpg`,
          kind: "image",
          isDirectStream: true,
        });

        const bestThumb =
          details.thumbnails[details.thumbnails.length - 1]?.url ||
          `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

        const result: MediaInspectionResult = {
          url,
          platform,
          platformName: PLATFORM_LABELS[platform],
          title: details.title || `YouTube Video (${videoId})`,
          author: details.author.name,
          duration: formatDuration(details.lengthSeconds),
          thumbnailUrl: bestThumb,
          contentType: "video/mp4",
          fileSizeBytes: formats[0]?.fileSizeBytes ?? null,
          fileSizeLabel: formats[0]?.fileSizeLabel || "Multiple formats",
          formats,
          permitted: true,
        };

        return NextResponse.json(result);
      } catch (ytdlErr) {
        // Fallback to oEmbed if YouTube blocks stream extraction for this specific video
        const ytdlMessage = ytdlErr instanceof Error ? ytdlErr.message : String(ytdlErr);
        console.warn("[inspect] ytdl.getInfo failed, trying oEmbed fallback:", ytdlMessage);
        let oembedRes: Response;
        try {
          oembedRes = await fetch(
            `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
            { signal: AbortSignal.timeout(8000) }
          );
        } catch (networkErr) {
          const msg = networkErr instanceof Error ? networkErr.message : "Network error";
          return NextResponse.json(
            { error: `Could not reach YouTube (${msg}). Check your server's internet access.` },
            { status: 502 }
          );
        }
        if (!oembedRes.ok) {
          return NextResponse.json(
            { error: "Unable to inspect this YouTube video. It may be private or restricted." },
            { status: 404 }
          );
        }
        const data = (await oembedRes.json()) as {
          title?: string;
          author_name?: string;
        };
        const safeTitle = sanitizeFilename(data.title || `youtube-${videoId}`);
        return NextResponse.json({
          url,
          platform,
          platformName: PLATFORM_LABELS[platform],
          title: data.title || `YouTube Video (${videoId})`,
          author: data.author_name,
          thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          fileSizeBytes: null,
          fileSizeLabel: "Thumbnails only",
          formats: [
            {
              id: "yt-thumb-max",
              label: "Thumbnail — Max Resolution (1280×720)",
              format: "JPG",
              resolution: "1280×720",
              fileSizeBytes: null,
              fileSizeLabel: "HD Image",
              downloadUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
              filename: `${safeTitle}-maxres.jpg`,
              kind: "image",
              isDirectStream: true,
            },
          ],
          permitted: true,
          notice:
            "Video stream extraction was restricted by the remote host for this clip; verified metadata and HD thumbnail are available.",
        } satisfies MediaInspectionResult);
      }
    }

    // 2. Vimeo public oEmbed
    if (platform === "vimeo") {
      const oembedRes = await fetch(
        `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (oembedRes.ok) {
        const data = (await oembedRes.json()) as {
          title?: string;
          author_name?: string;
          duration?: number;
          thumbnail_url?: string;
          width?: number;
          height?: number;
        };
        const safeTitle = sanitizeFilename(data.title || "vimeo-media");
        const formats: MediaFormatOption[] = data.thumbnail_url
          ? [
              {
                id: "vimeo-thumb",
                label: `Cover Thumbnail (${data.width || 1280}×${data.height || 720})`,
                format: "JPG",
                resolution: `${data.width || 1280}×${data.height || 720}`,
                fileSizeBytes: null,
                fileSizeLabel: "Image",
                downloadUrl: data.thumbnail_url,
                filename: `${safeTitle}-thumbnail.jpg`,
                kind: "image",
                isDirectStream: true,
              },
            ]
          : [];

        return NextResponse.json({
          url,
          platform,
          platformName: PLATFORM_LABELS[platform],
          title: data.title || "Vimeo Video",
          author: data.author_name,
          duration: formatDuration(data.duration),
          thumbnailUrl: data.thumbnail_url,
          fileSizeBytes: null,
          fileSizeLabel: "Metadata & Thumbnail",
          formats,
          permitted: true,
        } satisfies MediaInspectionResult);
      }
    }

    // 3. SoundCloud public oEmbed
    if (platform === "soundcloud") {
      const oembedRes = await fetch(
        `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (oembedRes.ok) {
        const data = (await oembedRes.json()) as {
          title?: string;
          author_name?: string;
          thumbnail_url?: string;
        };
        const safeTitle = sanitizeFilename(data.title || "soundcloud-track");
        return NextResponse.json({
          url,
          platform,
          platformName: PLATFORM_LABELS[platform],
          title: data.title || "SoundCloud Track",
          author: data.author_name,
          thumbnailUrl: data.thumbnail_url,
          fileSizeBytes: null,
          fileSizeLabel: "Metadata & Artwork",
          formats: data.thumbnail_url
            ? [
                {
                  id: "sc-artwork",
                  label: "Track Artwork",
                  format: "JPG",
                  resolution: "500×500",
                  fileSizeBytes: null,
                  fileSizeLabel: "Artwork",
                  downloadUrl: data.thumbnail_url,
                  filename: `${safeTitle}-artwork.jpg`,
                  kind: "image",
                  isDirectStream: true,
                },
              ]
            : [],
          permitted: true,
        } satisfies MediaInspectionResult);
      }
    }

    // 4. Direct Media URL or Public HTML Page with <meta property="og:video"> / <video>
    const headRes = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    }).catch(() => null);

    const contentType = headRes?.headers.get("content-type") || "";
    const contentLengthRaw = headRes?.headers.get("content-length");
    const fileSizeBytes = contentLengthRaw ? Number(contentLengthRaw) : null;
    const isMediaMime =
      contentType.startsWith("video/") ||
      contentType.startsWith("audio/") ||
      contentType.startsWith("image/");

    if (platform === "direct" || isMediaMime) {
      const parsed = new URL(url);
      const rawName = parsed.pathname.split("/").filter(Boolean).pop() || "media-download";
      const ext = getExtensionFromMime(contentType) || rawName.split(".").pop() || "mp4";
      const filename = rawName.includes(".")
        ? sanitizeFilename(rawName)
        : `${sanitizeFilename(rawName)}.${ext}`;
      const kind: "video" | "audio" | "image" = contentType.startsWith("audio/")
        ? "audio"
        : contentType.startsWith("image/")
        ? "image"
        : "video";

      return NextResponse.json({
        url,
        platform: "direct",
        platformName: PLATFORM_LABELS.direct,
        title: decodeURIComponent(rawName),
        author: parsed.hostname,
        thumbnailUrl: kind === "image" ? url : undefined,
        contentType: contentType || `${kind}/${ext}`,
        fileSizeBytes,
        fileSizeLabel: formatBytes(fileSizeBytes),
        permitted: true,
        formats: [
          {
            id: "direct-source",
            label: `Original ${ext.toUpperCase()} Stream`,
            format: ext.toUpperCase(),
            resolution: kind === "audio" ? "Original Bitrate" : "Source Quality",
            fileSizeBytes,
            fileSizeLabel: formatBytes(fileSizeBytes),
            downloadUrl: url,
            filename,
            kind,
            isDirectStream: true,
          },
        ],
      } satisfies MediaInspectionResult);
    }

    // Try extracting public OpenGraph og:video from HTML page
    if (contentType.includes("text/html") || !headRes) {
      const htmlRes = await fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(8000),
      }).catch(() => null);
      if (htmlRes && htmlRes.ok) {
        const html = await htmlRes.text();
        const ogVideoMatch = html.match(
          /<meta[^>]+property=["']og:video(?::url|:secure_url)?["'][^>]+content=["']([^"']+)["']/i
        );
        const ogTitleMatch = html.match(
          /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i
        );
        const ogImageMatch = html.match(
          /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
        );
        if (ogVideoMatch?.[1]) {
          const videoUrl = ogVideoMatch[1];
          const title = ogTitleMatch?.[1] || "Public Video";
          const safeTitle = sanitizeFilename(title);
          return NextResponse.json({
            url,
            platform,
            platformName: PLATFORM_LABELS[platform],
            title,
            thumbnailUrl: ogImageMatch?.[1],
            fileSizeBytes: null,
            fileSizeLabel: "Direct Stream",
            permitted: true,
            formats: [
              {
                id: "og-video-stream",
                label: "Extracted MP4 Stream",
                format: "MP4",
                resolution: "Source",
                fileSizeBytes: null,
                fileSizeLabel: "Stream",
                downloadUrl: videoUrl,
                filename: `${safeTitle}.mp4`,
                kind: "video",
                isDirectStream: true,
              },
            ],
          } satisfies MediaInspectionResult);
        }
      }
    }

    return NextResponse.json(
      {
        error:
          "No direct downloadable media stream was found at this URL. Paste a YouTube link or a direct .mp4, .webm, .mp3, .wav, or image URL.",
      },
      { status: 422 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to inspect URL.";
    console.error("[inspect] Unhandled error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
