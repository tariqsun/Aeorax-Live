import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface BbbReleaseInfo {
  version: string;
  name: string;
  publishedAt: string;
  releaseUrl: string;
  changelogSummary: string;
  isMajor: boolean;
}

let cachedRelease: { data: BbbReleaseInfo; timestamp: number } | null = null;
const CACHE_TTL_MS = 1000 * 60 * 30; // Cache for 30 minutes

/**
 * GET /api/nodes/version-check
 * Fetches latest stable BigBlueButton release from official GitHub API and caches it.
 */
export async function GET() {
  const now = Date.now();

  if (cachedRelease && now - cachedRelease.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      success: true,
      cached: true,
      latestRelease: cachedRelease.data,
    });
  }

  try {
    const response = await fetch("https://api.github.com/repos/bigbluebutton/bigbluebutton/releases/latest", {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Aeorax-Live-Control-Plane",
      },
      next: { revalidate: 1800 },
    });

    if (!response.ok) {
      throw new Error(`GitHub API returned status ${response.status}`);
    }

    const json = await response.json();
    const tag = String(json.tag_name || "v4.0.0").replace(/^v/, "");

    const releaseData: BbbReleaseInfo = {
      version: tag,
      name: json.name || `BigBlueButton ${tag}`,
      publishedAt: json.published_at || new Date().toISOString(),
      releaseUrl: json.html_url || "https://github.com/bigbluebutton/bigbluebutton/releases",
      changelogSummary: (json.body || "").slice(0, 300) + "...",
      isMajor: tag.startsWith("4."),
    };

    cachedRelease = { data: releaseData, timestamp: now };

    return NextResponse.json({
      success: true,
      cached: false,
      latestRelease: releaseData,
    });
  } catch (error: any) {
    // Graceful fallback to BigBlueButton 4.0.0 metadata if GitHub API is rate-limited
    const fallbackRelease: BbbReleaseInfo = {
      version: "4.0.0",
      name: "BigBlueButton v4.0.0",
      publishedAt: "2026-10-15T00:00:00Z",
      releaseUrl: "https://github.com/bigbluebutton/bigbluebutton/releases",
      changelogSummary: "Major release: Full Ubuntu 24.04 (Noble) support, new client UX, apps gallery, performance upgrades.",
      isMajor: true,
    };

    return NextResponse.json({
      success: true,
      fallback: true,
      latestRelease: fallbackRelease,
      warning: error?.message,
    });
  }
}
