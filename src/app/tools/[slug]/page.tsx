import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getToolBySlug, MEDIA_TOOLS } from "@/lib/tools";
import { DownloaderPanel } from "@/components/DownloaderPanel";
import { FFmpegToolWorkspace } from "@/components/tools/FFmpegToolWorkspace";
import { ImageConverterWorkspace } from "@/components/tools/ImageConverterWorkspace";
import { ThumbnailDownloaderWorkspace } from "@/components/tools/ThumbnailDownloaderWorkspace";
import { MetadataViewerWorkspace } from "@/components/tools/MetadataViewerWorkspace";
import { UrlValidatorWorkspace } from "@/components/tools/UrlValidatorWorkspace";
import { AdBanner } from "@/components/AdBanner";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jedimov.vercel.app";

export function generateStaticParams() {
  return MEDIA_TOOLS.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) {
    return { title: "Tool Not Found — jedi.mov" };
  }

  const title = `${tool.name} — Free Online Tool`;
  const description = `${tool.shortDesc} 100% free, private, and running locally in your browser with zero upload limits.`;
  const toolUrl = `${BASE_URL}/tools/${tool.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: toolUrl,
    },
    openGraph: {
      title: `${tool.name} | jedi.mov`,
      description,
      url: toolUrl,
      siteName: "jedi.mov",
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${tool.name} | jedi.mov`,
      description,
      creator: "@jedimov",
    },
  };
}

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  const toolUrl = `${BASE_URL}/tools/${tool.slug}`;

  const toolJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": BASE_URL,
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Tools",
            "item": `${BASE_URL}/tools`,
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": tool.name,
            "item": toolUrl,
          },
        ],
      },
      {
        "@type": "WebApplication",
        "@id": `${toolUrl}#software`,
        "name": `${tool.name} — jedi.mov`,
        "url": toolUrl,
        "description": tool.shortDesc,
        "applicationCategory": "MultimediaApplication",
        "operatingSystem": "All",
        "browserRequirements": "Requires JavaScript and modern browser",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD",
        },
      },
    ],
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolJsonLd) }}
      />
      <Link
        href="/tools"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>All Media Tools</span>
      </Link>

      <div className="mt-6">
        <span className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-[var(--accent)]">
          {tool.category} • {tool.badge}
        </span>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
          {tool.name}
        </h1>
        <p className="mt-2 text-base text-[var(--text-secondary)]">{tool.shortDesc}</p>
      </div>

      <div className="mt-8">
        {tool.slug === "video-downloader" && <DownloaderPanel />}
        {(tool.slug === "mp3-extractor" ||
          tool.slug === "video-converter" ||
          tool.slug === "video-compressor" ||
          tool.slug === "video-cropper") && <FFmpegToolWorkspace slug={tool.slug} />}
        {tool.slug === "image-converter" && <ImageConverterWorkspace />}
        {tool.slug === "thumbnail-downloader" && <ThumbnailDownloaderWorkspace />}
        {tool.slug === "metadata-viewer" && <MetadataViewerWorkspace />}
        {tool.slug === "url-validator" && <UrlValidatorWorkspace />}
      </div>

      {/* Post-Tool Workspace Ad Slot */}
      <div className="mt-10">
        <AdBanner slot={`tool-${tool.slug}-bottom`} format="horizontal" />
      </div>
    </div>
  );
}
