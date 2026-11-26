export type PlatformId =
  | "direct"
  | "youtube"
  | "vimeo"
  | "soundcloud"
  | "tiktok"
  | "instagram"
  | "x"
  | "twitch"
  | "unsupported";

export interface MediaFormatOption {
  id: string;
  label: string;
  format: string;
  resolution: string;
  fileSizeBytes: number | null;
  fileSizeLabel: string;
  downloadUrl: string;
  filename: string;
  kind: "video" | "audio" | "image";
  isDirectStream: boolean;
}

export interface MediaInspectionResult {
  url: string;
  platform: PlatformId;
  platformName: string;
  title: string;
  author?: string;
  duration?: string;
  thumbnailUrl?: string;
  contentType?: string;
  fileSizeBytes: number | null;
  fileSizeLabel: string;
  formats: MediaFormatOption[];
  notice?: string;
  permitted: boolean;
}

export interface UrlValidationReport {
  validSyntax: boolean;
  protocol: string | null;
  hostname: string | null;
  platform: PlatformId;
  platformName: string;
  isRestrictedDomain: boolean;
  restrictionReason?: string;
  normalizedUrl?: string;
}

export type ToolSlug =
  | "video-downloader"
  | "mp3-extractor"
  | "thumbnail-downloader"
  | "video-converter"
  | "video-compressor"
  | "video-cropper"
  | "image-converter"
  | "metadata-viewer"
  | "url-validator";

export interface ToolDefinition {
  slug: ToolSlug;
  name: string;
  shortDesc: string;
  actionLabel: string;
  category: "Download" | "Convert" | "Edit" | "Inspect";
  badge: string;
  bentoSpan: "wide" | "tall" | "standard";
  acceptedTypes?: string;
}
