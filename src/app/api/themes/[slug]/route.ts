import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  let primaryColor = "#6366f1";
  let brandName = "Aeorax Live";
  let customCss = "";

  try {
    if (slug && slug !== "default") {
      const college = await prisma.college.findUnique({
        where: { slug },
      });

      if (college && (college as any).whiteLabelEnabled) {
        primaryColor = (college as any).brandPrimaryColor || primaryColor;
        brandName = college.name;
        customCss = (college as any).brandCustomCss || "";
      }
    }
  } catch (_) {
    // fallback to defaults safely
  }

  // Generate BigBlueButton HTML5 Client CSS
  const css = `
/* ==========================================================================
   Aeorax Live — BigBlueButton 3.0 Dynamic Tenant Theme
   Target Tenant: ${slug} (${brandName})
   Generated: ${new Date().toISOString()}
   ========================================================================== */

:root {
  --color-primary: ${primaryColor} !important;
  --color-primary-dark: ${primaryColor}dd !important;
  --color-primary-light: ${primaryColor}22 !important;
  --btn-primary-bg: ${primaryColor} !important;
  --btn-primary-border: ${primaryColor} !important;
  --brand-color: ${primaryColor} !important;
}

/* BBB Top Navbar Styling */
header#navbar, .navbar, nav[class*="navbar"] {
  border-bottom: 2px solid ${primaryColor}40 !important;
}

/* Primary Action Buttons */
button[class*="button"][class*="primary"],
button[class*="joinAudio"],
button[class*="btn-primary"],
.btn-primary,
button[aria-label*="Send message"],
button[class*="sendBtn"] {
  background-color: ${primaryColor} !important;
  border-color: ${primaryColor} !important;
  color: #ffffff !important;
  box-shadow: 0 4px 12px ${primaryColor}40 !important;
}

/* Active User List and Status Pills */
span[class*="unreadCounter"],
div[class*="unreadMessages"],
div[class*="userAvatar"][class*="moderator"],
i[class*="moderator"] {
  background-color: ${primaryColor} !important;
  color: #ffffff !important;
}

/* Active Audio/Webcam Toggle Highlights */
button[class*="active"][class*="audio"],
button[class*="active"][class*="video"] {
  background-color: ${primaryColor} !important;
}

/* Whiteboard Active Tool Indicator */
button[class*="toolbarButton"][aria-pressed="true"],
button[class*="activeTool"] {
  border-color: ${primaryColor} !important;
  color: ${primaryColor} !important;
}

/* Custom Overrides */
${customCss}
`;

  return new NextResponse(css, {
    status: 200,
    headers: {
      "Content-Type": "text/css; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
