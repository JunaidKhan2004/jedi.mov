"use client";

import React, { useEffect } from "react";

export type AdSlotFormat = "leaderboard" | "rectangle" | "horizontal" | "responsive";

interface AdBannerProps {
  slot?: string;
  format?: AdSlotFormat;
  className?: string;
  label?: string;
}

/**
 * Standard AdBanner component ready for Google AdSense or any ad network.
 * If AdSense script / client ID is loaded, it renders the <ins> tag.
 * Otherwise, it shows an elegant placeholder matching the active theme (Dark, Light, Retro).
 */
export function AdBanner({
  slot = "1234567890",
  format = "responsive",
  className = "",
  label = "ADVERTISEMENT",
}: AdBannerProps) {
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        // @ts-expect-error - adsbygoogle is added by external ad scripts like Google AdSense
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch {
      // Ignore if AdSense script is not loaded
    }
  }, []);

  // Standard sizes mapping
  const formatStyles: Record<AdSlotFormat, string> = {
    leaderboard: "min-h-[90px] max-w-[728px]",
    rectangle: "min-h-[250px] max-w-[300px]",
    horizontal: "min-h-[100px] max-w-[970px]",
    responsive: "min-h-[90px] w-full",
  };

  const adsenseClientId =
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "ca-pub-8940261966988383";

  return (
    <div
      className={`mx-auto my-6 flex flex-col items-center justify-center overflow-hidden text-center ${className}`}
    >
      {label && (
        <span className="mb-1.5 font-mono text-[10px] tracking-widest uppercase text-[var(--text-muted)] opacity-70">
          {label}
        </span>
      )}

      <div
        className={`relative flex w-full items-center justify-center rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-secondary)]/50 p-2 transition-colors hover:border-[var(--accent)]/40 ${formatStyles[format]}`}
      >
        {adsenseClientId ? (
          <ins
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client={adsenseClientId}
            data-ad-slot={slot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        ) : (
          <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent)] opacity-80 animate-pulse" />
              <p className="font-mono text-xs font-medium text-[var(--text-secondary)]">
                Ad Space Available
              </p>
            </div>
            <p className="mt-1 font-mono text-[11px] text-[var(--text-muted)]">
              Slot ID: {slot} &bull; Format: {format}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
