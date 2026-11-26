import type { Metadata } from "next";
import { BentoToolsGrid } from "@/components/BentoToolsGrid";
import { AdBanner } from "@/components/AdBanner";

export const metadata: Metadata = {
  title: "All Media Tools — jedi.mov",
  description:
    "Explore all 9 free online media tools on jedi.mov: Video Downloader, MP3 Extractor, Thumbnail Downloader, Video Converter, Compressor, Cropper, Image Converter, Metadata Viewer, and URL Validator.",
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
