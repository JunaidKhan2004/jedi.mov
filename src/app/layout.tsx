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

export const metadata: Metadata = {
  title: "jedi.mov — Everything Media. One Simple Place.",
  description:
    "Download, convert, compress, crop, and inspect media with powerful free online tools. Your Media. Your Rules.",
  keywords: [
    "media downloader",
    "video converter",
    "mp3 extractor",
    "video compressor",
    "thumbnail downloader",
    "jedi.mov",
  ],
  openGraph: {
    title: "jedi.mov — Everything Media. One Simple Place.",
    description:
      "Download, convert and manage your media with powerful free online tools.",
    type: "website",
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
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8940261966988383"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)]">
        <ThemeProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
