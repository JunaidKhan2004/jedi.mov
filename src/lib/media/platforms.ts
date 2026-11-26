import type { PlatformId, UrlValidationReport } from "./types";

const RESTRICTED_DOMAINS = [
  "netflix.com",
  "disneyplus.com",
  "hulu.com",
  "primevideo.com",
  "hbomax.com",
  "max.com",
  "tv.apple.com",
  "music.apple.com",
  "open.spotify.com",
  "spotify.com",
  "peacocktv.com",
  "paramountplus.com",
  "crunchyroll.com",
  "onlyfans.com",
  "patreon.com",
];

const DIRECT_MEDIA_EXTENSIONS = [
  ".mp4",
  ".webm",
  ".mov",
  ".m4v",
  ".mp3",
  ".wav",
  ".m4a",
  ".ogg",
  ".flac",
  ".aac",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".avif",
];

export const PLATFORM_LABELS: Record<PlatformId, string> = {
  direct: "Direct Media URL",
  youtube: "YouTube",
  vimeo: "Vimeo",
  soundcloud: "SoundCloud",
  tiktok: "TikTok",
  instagram: "Instagram",
  x: "X (Twitter)",
  twitch: "Twitch",
  unsupported: "Public Web URL",
};

export function isPrivateOrUnsafeHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host === "[::1]" ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return true;
  }

  // Block private IPv4 ranges
  const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (
      a === 10 ||
      a === 127 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) ||
      a === 0
    ) {
      return true;
    }
  }

  return false;
}

export function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const v = parsed.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      const parts = parsed.pathname.split("/").filter(Boolean);
      if ((parts[0] === "shorts" || parts[0] === "embed" || parts[0] === "live") && parts[1]) {
        return /^[a-zA-Z0-9_-]{11}$/.test(parts[1]) ? parts[1] : null;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function detectPlatform(url: string): PlatformId {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const pathname = parsed.pathname.toLowerCase();

    if (DIRECT_MEDIA_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
      return "direct";
    }
    if (host === "youtube.com" || host === "youtu.be" || host === "m.youtube.com" || host === "music.youtube.com") {
      return "youtube";
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      return "vimeo";
    }
    if (host === "soundcloud.com" || host === "on.soundcloud.com") {
      return "soundcloud";
    }
    if (host === "tiktok.com" || host === "vm.tiktok.com") {
      return "tiktok";
    }
    if (host === "instagram.com") {
      return "instagram";
    }
    if (host === "twitter.com" || host === "x.com") {
      return "x";
    }
    if (host === "twitch.tv" || host === "clips.twitch.tv") {
      return "twitch";
    }
    return "unsupported";
  } catch {
    return "unsupported";
  }
}

/**
 * Best-effort scheme normalizer: if the user typed a URL without a scheme
 * (e.g. "youtube.com/watch?v=abc" or "//youtube.com/..."), prepend "https://".
 * Returns the original string when it already has a valid scheme.
 */
export function normalizeScheme(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  // Already has a scheme (e.g. "https://", "http://", "ftp://")
  if (/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//.test(t)) return t;
  // Protocol-relative "//example.com/..."
  if (t.startsWith("//")) return `https:${t}`;
  // Bare host/path like "youtube.com/watch?v=..."
  return `https://${t}`;
}

export function validateMediaUrl(rawUrl: string): UrlValidationReport {
  const normalized = normalizeScheme(rawUrl);
  if (!normalized) {
    return {
      validSyntax: false,
      protocol: null,
      hostname: null,
      platform: "unsupported",
      platformName: "Unknown",
      isRestrictedDomain: false,
      restrictionReason: "Please enter a media URL.",
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return {
      validSyntax: false,
      protocol: null,
      hostname: null,
      platform: "unsupported",
      platformName: "Unknown",
      isRestrictedDomain: false,
      restrictionReason: "Invalid URL format. Include https:// or http://.",
    };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      validSyntax: false,
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      platform: "unsupported",
      platformName: "Unknown",
      isRestrictedDomain: true,
      restrictionReason: "Only HTTP and HTTPS URLs are supported.",
    };
  }

  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

  if (isPrivateOrUnsafeHost(host)) {
    return {
      validSyntax: true,
      protocol: parsed.protocol,
      hostname: host,
      platform: "unsupported",
      platformName: "Restricted Network",
      isRestrictedDomain: true,
      restrictionReason: "Local and private network addresses are blocked for security.",
    };
  }

  const isDrmDomain = RESTRICTED_DOMAINS.some(
    (domain) => host === domain || host.endsWith(`.${domain}`)
  );

  if (isDrmDomain) {
    return {
      validSyntax: true,
      protocol: parsed.protocol,
      hostname: host,
      platform: "unsupported",
      platformName: host,
      isRestrictedDomain: true,
      restrictionReason:
        "DRM-protected and subscription-gated platforms are not supported. jedi.mov only processes permitted public media.",
    };
  }

  const platform = detectPlatform(normalized);
  return {
    validSyntax: true,
    protocol: parsed.protocol,
    hostname: host,
    platform,
    platformName: PLATFORM_LABELS[platform],
    isRestrictedDomain: false,
    normalizedUrl: parsed.toString(),
  };
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0 || !Number.isFinite(bytes)) return "Unknown size";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx++;
  }
  return `${value.toFixed(value >= 100 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}
