import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jedimov.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "jedi.mov — Everything Media. One Simple Place.",
    template: "%s | jedi.mov",
  },
  description:
    "Free, privacy-first universal media suite. Download public videos, extract MP3 audio, convert, compress, crop, and inspect video, audio, and image files directly in your browser.",
  applicationName: "jedi.mov",
  keywords: [
    "media downloader",
    "video downloader",
    "mp3 extractor",
    "video converter",
    "video compressor",
    "video cropper",
    "image converter",
    "thumbnail downloader",
    "ffmpeg wasm",
    "online video tools",
    "free media converter",
    "aspect ratio cropper",
    "jedi.mov",
  ],
  authors: [{ name: "jedi.mov team", url: BASE_URL }],
  creator: "jedi.mov",
  publisher: "jedi.mov",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "jedi.mov — Everything Media. One Simple Place.",
    description:
      "Download, convert, compress, crop, and inspect media with powerful free online tools. 100% private, zero uploads required.",
    url: BASE_URL,
    siteName: "jedi.mov",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "jedi.mov — Everything Media. One Simple Place.",
    description:
      "Free browser-native media studio: download, convert, compress, crop, and inspect video/audio/images without server uploads.",
    creator: "@jedimov",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  other: {
    "google-adsense-account": "ca-pub-8940261966988383",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${BASE_URL}/#webapp`,
      "name": "jedi.mov",
      "url": BASE_URL,
      "description":
        "A privacy-first, free universal media manipulation suite running WebAssembly and HTML5 in the browser. Download, convert, compress, crop, and inspect video, audio, and images.",
      "applicationCategory": "MultimediaApplication",
      "operatingSystem": "All",
      "browserRequirements": "Requires JavaScript and a modern browser with WebAssembly support",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
      },
      "featureList": [
        "Universal Video Downloader",
        "Client-Side MP3 Extractor",
        "Full-Resolution Thumbnail Grabber",
        "WebAssembly Video Converter",
        "CRF Video Compressor",
        "Aspect Ratio Video Cropper",
        "HTML5 Canvas Image Converter",
        "Media Metadata Inspector",
        "URL Security & Protocol Validator",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      "url": BASE_URL,
      "name": "jedi.mov",
      "description": "Everything Media. One Simple Place.",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)]">
        {/* Schema.org Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Google AdSense Script - loaded afterInteractive to prevent hydration mismatch */}
        <Script
          id="google-adsense"
          async
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8940261966988383"
          crossOrigin="anonymous"
        />
        <ThemeProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
