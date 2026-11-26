import { HeroSection } from "@/components/HeroSection";
import { BentoToolsGrid } from "@/components/BentoToolsGrid";
import { HomeSections } from "@/components/HomeSections";
import { AdBanner } from "@/components/AdBanner";

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is jedi.mov completely free to use?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. All 9 media tools and the universal URL inspector/downloader are 100% free with no subscriptions, watermarks, or account requirements."
      }
    },
    {
      "@type": "Question",
      "name": "Are my uploaded videos or images stored on your servers?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. Tools like MP3 Extractor, Video Converter, Video Compressor, Video Cropper, Image Converter, and Metadata Viewer run locally inside your browser using WebAssembly and HTML5 Canvas."
      }
    },
    {
      "@type": "Question",
      "name": "Which URLs can I download with jedi.mov?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You can download direct public media URLs (.mp4, .webm, .mp3, .wav, images) and extract verified metadata and full-resolution thumbnails from public YouTube, Vimeo, and SoundCloud links. DRM-protected or private streams are never bypassed."
      }
    },
    {
      "@type": "Question",
      "name": "Why does FFmpeg take a few seconds on first use?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The first time you run a local video or audio tool, your browser downloads and caches the lightweight FFmpeg WebAssembly core (~30 MB) so subsequent conversions run offline-fast."
      }
    }
  ]
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <HeroSection />

      {/* Primary Leaderboard Ad below Hero */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <AdBanner slot="home-top-leaderboard" format="leaderboard" />
      </div>

      <BentoToolsGrid />

      {/* Mid-page Responsive Ad Banner */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <AdBanner slot="home-mid-banner" format="horizontal" />
      </div>

      <HomeSections />
    </>
  );
}
