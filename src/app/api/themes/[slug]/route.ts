import { NextRequest, NextResponse } from "next/server";
import { getEffectiveBranding, generateBBBThemeCss } from "../../../../lib/branding";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  // Resolves effective branding: if slug === "default" or tenant has whiteLabelEnabled === false,
  // it automatically falls back to Global Platform Brand!
  const branding = await getEffectiveBranding(slug);
  const css = generateBBBThemeCss(branding, slug);

  return new NextResponse(css, {
    status: 200,
    headers: {
      "Content-Type": "text/css; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=60",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
