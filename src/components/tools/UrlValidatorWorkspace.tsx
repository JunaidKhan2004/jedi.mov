"use client";

import React, { useState } from "react";
import { CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";
import { validateMediaUrl } from "@/lib/media/platforms";
import type { UrlValidationReport } from "@/lib/media/types";
import { MagneticButton } from "@/components/MagneticButton";

export function UrlValidatorWorkspace() {
  const [url, setUrl] = useState("");
  const [report, setReport] = useState<UrlValidationReport | null>(null);

  const handleValidate = (e: React.FormEvent) => {
    e.preventDefault();
    setReport(validateMediaUrl(url));
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleValidate}
        className="flex flex-col gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-2 sm:flex-row"
      >
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter any URL to validate syntax, platform, and safety..."
          className="h-11 flex-1 rounded-xl bg-transparent px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
        />
        <MagneticButton
          type="submit"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Validate URL</span>
        </MagneticButton>
      </form>

      {report && (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
          <div className="flex items-center gap-2">
            {report.validSyntax && !report.isRestrictedDomain ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-red-400" />
            )}
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {report.validSyntax && !report.isRestrictedDomain
                ? "URL is Valid & Permitted"
                : "URL Rejected or Restricted"}
            </h3>
          </div>

          {report.restrictionReason && (
            <p className="mt-2 text-sm text-red-400">{report.restrictionReason}</p>
          )}

          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-[var(--text-muted)]">Syntax</dt>
              <dd className="mt-0.5 font-mono text-sm text-[var(--text-primary)]">
                {report.validSyntax ? "Valid" : "Invalid"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-muted)]">Detected Platform</dt>
              <dd className="mt-0.5 font-mono text-sm text-[var(--accent)]">
                {report.platformName}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-muted)]">Hostname</dt>
              <dd className="mt-0.5 font-mono text-sm text-[var(--text-primary)]">
                {report.hostname || "—"}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
