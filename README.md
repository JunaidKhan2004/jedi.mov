# jedi.mov

**Everything Media. One Simple Place.**

A full-stack media processing platform built with Next.js 16, React 19, and TypeScript. It provides a suite of nine browser-based and server-side tools for downloading, converting, compressing, cropping, and inspecting video, audio, and image files — with no account required and no files stored on any server.

---

## Table of Contents

- [Overview](#overview)
- [Tools](#tools)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Security and Privacy Model](#security-and-privacy-model)
- [Getting Started](#getting-started)
- [Environment Notes](#environment-notes)
- [Scripts](#scripts)

---

## Overview

jedi.mov operates on a dual-processing model:

- **Server-side tools** (Video Downloader, Thumbnail Downloader, URL Validator) use Next.js API Routes to inspect URLs, fetch metadata via platform oEmbed APIs, and stream files directly to the browser through a secure proxy. No files are written to permanent storage.
- **Client-side tools** (MP3 Extractor, Video Converter, Video Compressor, Video Cropper, Image Converter, Metadata Viewer) run entirely in the browser using FFmpeg.wasm and the HTML5 Canvas API. Files are never uploaded to any server.

---

## Tools

### Download Category

| Tool | Slug | Description |
|---|---|---|
| Video Downloader | `video-downloader` | Inspects YouTube URLs and direct MP4/WebM/audio streams. Fetches available formats via `@distube/ytdl-core`, merges separate video and audio tracks using server-side FFmpeg-static, and streams the result directly to the client. |
| Thumbnail Downloader | `thumbnail-downloader` | Retrieves full-resolution cover thumbnails (up to 1280x720 maxresdefault) from YouTube and Vimeo URLs using their public oEmbed endpoints. |

### Convert Category

| Tool | Slug | Description |
|---|---|---|
| MP3 Extractor | `mp3-extractor` | Strips the audio track from a local video file using FFmpeg.wasm. Supports bitrate selection: 128 kbps (Standard), 192 kbps (High), 320 kbps (Studio). |
| Video Converter | `video-converter` | Transcodes local video files to MP4 (H.264), WebM, MOV, or animated GIF using FFmpeg.wasm. GIF output applies Lanczos-scaled 12 fps conversion for smaller file sizes. |
| Image Converter | `image-converter` | Converts PNG, JPG, WebP, and BMP images to other formats using the HTML5 Canvas API with adjustable quality. No FFmpeg dependency required. |

### Edit Category

| Tool | Slug | Description |
|---|---|---|
| Video Compressor | `video-compressor` | Re-encodes local video with H.264 and CRF-based compression. Three presets: Balanced (CRF 23), Strong (CRF 28), Maximum Shrink (CRF 32) with `veryfast` preset for speed. |
| Video Cropper | `video-cropper` | Crops local video to a target aspect ratio using FFmpeg.wasm filter expressions. Supported ratios: 16:9 (Widescreen), 9:16 (Vertical/Shorts), 1:1 (Square), 4:5 (Portrait Feed). |

### Inspect Category

| Tool | Slug | Description |
|---|---|---|
| Metadata Viewer | `metadata-viewer` | Reads file name, size, MIME type, last-modified timestamp, pixel dimensions (images and video), and duration (video and audio) locally using the browser's media element API. No upload required. |
| URL Validator | `url-validator` | Runs client-side URL validation: checks syntax, normalizes bare URLs (e.g. `youtube.com/watch?v=...`), detects platform, blocks private/loopback IP ranges, and flags DRM-protected or subscription-gated domains. |

---

## Architecture

```
src/
  app/
    page.tsx                  # Home page — renders HeroSection, BentoToolsGrid, HomeSections
    layout.tsx                # Root layout — Geist font, ThemeProvider, Navbar, Footer
    api/
      inspect/route.ts        # POST /api/inspect — URL inspection and media metadata extraction
      download/route.ts       # GET  /api/download — Secure streaming proxy and YouTube muxer
    tools/
      page.tsx                # /tools listing page
      [slug]/page.tsx         # Dynamic tool page — routes slug to the correct workspace component
  components/
    DownloaderPanel.tsx       # Main URL inspector + format picker + download progress UI
    BentoToolsGrid.tsx        # CSS bento grid layout for the tools index
    HeroSection.tsx           # Hero with Three.js canvas and Framer Motion animations
    HeroCanvas.tsx            # Three.js WebGL background
    HomeSections.tsx          # Feature/marketing sections below the fold
    Navbar.tsx                # Top navigation
    Footer.tsx                # Footer
    ThemeProvider.tsx         # CSS variable-based dark/light theme management
    MagneticButton.tsx        # Framer Motion magnetic hover button
    SpotlightCard.tsx         # CSS spotlight hover card effect
    Logo.tsx                  # Brand logo component
    tools/
      FFmpegToolWorkspace.tsx         # Shared workspace for all FFmpeg.wasm tools (MP3, Converter, Compressor, Cropper)
      ImageConverterWorkspace.tsx     # Canvas-based image conversion
      MetadataViewerWorkspace.tsx     # Local file metadata inspection
      ThumbnailDownloaderWorkspace.tsx # YouTube/Vimeo thumbnail fetcher
      UrlValidatorWorkspace.tsx       # Client-side URL validation report UI
  lib/
    ffmpeg-client.ts          # Singleton FFmpeg.wasm loader with SharedArrayBuffer support
    tools.ts                  # MEDIA_TOOLS registry — slugs, metadata, bento layout config
    media/
      types.ts                # TypeScript interfaces: MediaFormatOption, MediaInspectionResult, ToolDefinition, etc.
      platforms.ts            # URL normalization, platform detection, DRM domain blocklist, oEmbed helpers
```

### Data Flow — Video Download (YouTube)

```
Client: paste URL -> POST /api/inspect
  Server: ytdl.getInfo() -> enumerate video-only + audio-only + combined formats
  Server: return MediaInspectionResult with signed /api/download?... URLs

Client: select format -> GET /api/download?provider=youtube&itag=...&audioItag=...
  Server: download video stream + audio stream in parallel to OS temp dir
  Server: FFmpeg mux: -c:v copy + -c:a aac -b:a 192k + -movflags +faststart
  Server: stream output.mp4 to client via ReadableStream, cleanup temp dir on close
```

### Data Flow — Browser FFmpeg Tools

```
User: select local file (never leaves device)
  Browser: load /ffmpeg/ffmpeg.js (same-origin UMD bundle)
  Browser: fetch FFmpeg.wasm core from unpkg CDN via toBlobURL
  Browser: writeFile(input) -> exec(ffmpeg args) -> readFile(output)
  Browser: create Blob -> Object URL -> trigger <a download>
```

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.4.6 |
| Language | TypeScript | ^5 |
| UI Library | React | 19.3.0 |
| Styling | Tailwind CSS | 4.3.3 |
| Animations | Framer Motion | ^14 |
| 3D / WebGL | Three.js | ^0.187.0 |
| Icons | Lucide React | ^1.80.0 |
| Font | Geist / Geist Mono (Google Fonts) | — |
| YouTube Extraction | @distube/ytdl-core | ^5.2.1 |
| Server FFmpeg | ffmpeg-static | ^5.3.0 |
| Browser FFmpeg | @ffmpeg/ffmpeg + @ffmpeg/util | ^0.12 |
| Build Tooling | Turbopack | — |

---

## Project Structure

```
Free Universal Media Downloader/
  src/
    app/            # Next.js App Router pages and API routes
    components/     # React components (UI and tool workspaces)
    lib/            # Shared utilities, type definitions, platform logic
  public/
    ffmpeg/         # Same-origin FFmpeg.wasm UMD bundle (814.ffmpeg.js, ffmpeg.js)
  next.config.ts    # Next.js config — COOP/COEP headers, Turbopack, ffmpeg-static externals
  tsconfig.json     # TypeScript project config
  package.json      # Dependencies and scripts
```

---

## API Reference

### `POST /api/inspect`

Inspects a media URL and returns available formats.

**Request body:**
```json
{ "url": "https://www.youtube.com/watch?v=..." }
```

**Response — `MediaInspectionResult`:**
```typescript
{
  url: string;
  platform: "youtube" | "vimeo" | "soundcloud" | "direct" | "unsupported" | ...;
  platformName: string;
  title: string;
  author?: string;
  duration?: string;           // e.g. "3:45"
  thumbnailUrl?: string;
  contentType?: string;
  fileSizeBytes: number | null;
  fileSizeLabel: string;
  formats: MediaFormatOption[];
  notice?: string;
  permitted: boolean;
}
```

**Supported platforms:**
- **YouTube** — Full format matrix via `@distube/ytdl-core`: video-only (up to 4K), combined (360p), audio-only MP3 with embedded cover art, audio-only M4A, and HD thumbnail.
- **Vimeo** — Metadata and thumbnail via public oEmbed API.
- **SoundCloud** — Metadata and artwork via public oEmbed API.
- **Direct media URLs** — MP4, WebM, MOV, M4V, MP3, WAV, M4A, OGG, FLAC, AAC, JPG, PNG, WebP, GIF, AVIF.
- **Public HTML pages** — Attempts `og:video` OpenGraph tag extraction as a fallback.

**Error responses:** `400` (invalid/restricted URL), `404` (private/unavailable), `422` (no downloadable stream found), `502` (upstream unreachable).

---

### `GET /api/download`

Streams a media file to the client. Acts as both a YouTube muxing pipeline and a general CORS-safe proxy for direct media URLs.

**Query parameters:**

| Parameter | Required | Description |
|---|---|---|
| `url` | Yes | The validated media URL to download. |
| `provider` | No | Set to `youtube` to activate ytdl-core stream extraction. |
| `itag` | No | YouTube format itag for the video track. |
| `audioItag` | No | YouTube format itag for the audio track. When provided alongside `itag`, video and audio are muxed server-side into a single MP4. |
| `embedThumb` | No | Set to `1` to trigger audio extraction with embedded cover art and ID3/MP4 metadata tags. |
| `outFormat` | No | `mp3` or `m4a` — controls the output container for audio-only downloads. |
| `filename` | No | Desired download filename. Sanitized to `[a-zA-Z0-9._-]`. |

**Response:** Streamed binary with `Content-Disposition: attachment`, `Content-Type`, `Content-Length` (when known), and `Cache-Control: no-store`.

---

## Security and Privacy Model

- **No persistent storage.** All server-side operations (YouTube muxing, thumbnail fetching) write to OS temp directories and delete files immediately after streaming completes or on request abort.
- **DRM domain blocklist.** The server-side URL validator blocks requests to Netflix, Disney+, Hulu, Prime Video, HBO Max, Apple TV+, Spotify, Peacock, Paramount+, Crunchyroll, and similar DRM-protected services. Only public, permitted media is processed.
- **Private network blocking.** Requests to `localhost`, `127.x.x.x`, `10.x.x.x`, `172.16-31.x.x`, `192.168.x.x`, `169.254.x.x`, `.local`, and `.internal` hostnames are blocked server-side to prevent SSRF.
- **HTTPS/HTTP only.** Non-HTTP schemes are rejected before any network request is made.
- **Client-side tools are fully local.** FFmpeg.wasm tools process files entirely in the browser. No file data is transmitted to the server.
- **SharedArrayBuffer headers.** `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: credentialless` are set globally (required by FFmpeg.wasm for `SharedArrayBuffer` support in modern browsers).
- **Abort signal propagation.** Both API routes propagate the request's `AbortSignal` to all downstream fetch calls, Node.js streams, and spawned FFmpeg processes, ensuring resources are released immediately on client disconnect or cancellation.

---

## Getting Started

### Prerequisites

- Node.js 20 or later
- npm, yarn, pnpm, or bun

### Installation

```bash
git clone <repository-url>
cd "Free Universal Media Downloader"
npm install
```

### Development

```bash
npm run dev
```

The application starts on [http://localhost:3000](http://localhost:3000) using the Turbopack bundler.

### Production Build

```bash
npm run build
npm run start
```

---

## Environment Notes

**FFmpeg.wasm (browser tools):** The `/public/ffmpeg/ffmpeg.js` bundle is served same-origin to satisfy the browser's Same-Origin Policy for Web Worker scripts. The core WASM binary (`ffmpeg-core.wasm`) is fetched at runtime from `unpkg.com/@ffmpeg/core@0.12.6` and converted to a Blob URL. An internet connection is required the first time a browser FFmpeg tool is used; subsequent runs within the same session reuse the cached singleton instance.

**Server FFmpeg (YouTube muxing):** The `ffmpeg-static` package provides a pre-built FFmpeg binary bundled with the application. No system FFmpeg installation is required. The binary path resolves automatically on Windows (`.exe`) and Unix systems. The `ffmpeg-static` package is declared as a `serverExternalPackage` in `next.config.ts` to prevent Webpack from attempting to bundle the native binary.

**YouTube extraction:** `@distube/ytdl-core` is initialized as a module-level singleton (`new Ytdl()`) reused across API requests. YouTube's bot-detection measures may occasionally restrict stream extraction for specific videos; in those cases, the inspect endpoint falls back to the YouTube oEmbed API and returns verified metadata with the HD thumbnail.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server with Turbopack hot reload. |
| `npm run build` | Compile TypeScript and build the production Next.js application. |
| `npm run start` | Start the production server (requires a prior build). |
| `npm run lint` | Run ESLint across the project. |
