import type { Metadata } from "next";
import { BentoToolsGrid } from "@/components/BentoToolsGrid";
import { AdBanner } from "@/components/AdBanner";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jedimov.vercel.app";

export const metadata: Metadata = {
  title: "All Media Tools — Free Online Video, Audio & Image Suite",
  description:
    "Explore all 9 free online media tools on jedi.mov: Video Downloader, MP3 Extractor, Thumbnail Downloader, Video Converter, Compressor, Cropper, Image Converter, Metadata Viewer, and URL Validator.",
  alternates: {
    canonical: `${BASE_URL}/tools`,
  },
  openGraph: {
    title: "All Media Tools — jedi.mov",
    description:
      "Full suite of free browser-native tools to download, convert, compress, crop, and inspect video, audio, and images.",
    url: `${BASE_URL}/tools`,
    siteName: "jedi.mov",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "All Media Tools | jedi.mov",
    description:
      "Explore 9 free, privacy-first media utilities for videos, audio, and images.",
    creator: "@jedimov",
  },
};

export default function ToolsDirectoryPage() {
  return (
    <div className="bg-[var(--bg-main)] py-6">
      <BentoToolsGrid />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <AdBanner slot="tools-directory-bottom" format="horizontal" />
      </div>
    </div>
  );
}
