import { prisma } from "./prisma";

export interface BrandConfig {
  brandName: string;
  whiteLabelEnabled?: boolean;
  primaryColor: string;
  logoUrl?: string;
  bannerText?: string;
  welcomePdfUrl?: string;
  customCss?: string;
}

export const DEFAULT_GLOBAL_BRAND: BrandConfig = {
  brandName: "Aeorax Live",
  whiteLabelEnabled: false,
  primaryColor: "#6366f1", // Royal Indigo
  logoUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&auto=format&fit=crop&q=80",
  bannerText: "Welcome to Aeorax Live Virtual Classroom",
  welcomePdfUrl: "",
  customCss: "",
};

export const DEFAULT_COLLEGES_BRANDING: Record<string, BrandConfig> = {
  "oxford-intl": {
    whiteLabelEnabled: true,
    brandName: "Oxford International",
    primaryColor: "#0284c7", // Sky Blue
    logoUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=120&auto=format&fit=crop&q=80",
    bannerText: "Oxford International — Live Lecture Hall",
    welcomePdfUrl: "",
    customCss: "",
  },
  "stanford-demo": {
    whiteLabelEnabled: false, // Default: Inherits Aeorax Live brand
    brandName: "Stanford Demo",
    primaryColor: "#e11d48", // Crimson Rose
    logoUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=120&auto=format&fit=crop&q=80",
    bannerText: "Stanford Executive Seminar Room",
    welcomePdfUrl: "",
    customCss: "",
  },
  "cambridge-biz": {
    whiteLabelEnabled: true,
    brandName: "Cambridge Biz",
    primaryColor: "#059669", // Emerald Green
    logoUrl: "https://images.unsplash.com/photo-1592280771190-4e29c047534d?w=120&auto=format&fit=crop&q=80",
    bannerText: "Cambridge Business School — Virtual Amphitheater",
    welcomePdfUrl: "",
    customCss: "",
  },
  "mit-online": {
    whiteLabelEnabled: false, // Default: Inherits Aeorax Live brand
    brandName: "MIT Academy",
    primaryColor: "#d97706", // Amber Gold
    logoUrl: "https://images.unsplash.com/photo-1562774053-701939374585?w=120&auto=format&fit=crop&q=80",
    bannerText: "MIT Academy Online Learning Environment",
    welcomePdfUrl: "",
    customCss: "",
  },
};

/**
 * Retrieves the global platform default branding from DB (SystemSetting)
 */
export async function getGlobalBranding(): Promise<BrandConfig> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "BRANDING_GLOBAL" },
    });
    if (setting?.value) {
      return { ...DEFAULT_GLOBAL_BRAND, ...JSON.parse(setting.value) };
    }
  } catch (err) {
    // fallback gracefully if DB is offline or migrating
  }
  return DEFAULT_GLOBAL_BRAND;
}

/**
 * Saves the global platform default branding
 */
export async function saveGlobalBranding(config: Partial<BrandConfig>): Promise<BrandConfig> {
  const current = await getGlobalBranding();
  const updated: BrandConfig = { ...current, ...config, whiteLabelEnabled: false };

  try {
    await prisma.systemSetting.upsert({
      where: { key: "BRANDING_GLOBAL" },
      update: { value: JSON.stringify(updated) },
      create: {
        key: "BRANDING_GLOBAL",
        value: JSON.stringify(updated),
        description: "Global Platform Default Brand and Theme Configuration",
      },
    });
  } catch (err) {
    console.error("Failed to save global branding to DB:", err);
  }

  return updated;
}

/**
 * Retrieves all college branding configurations
 */
export async function getCollegesBranding(): Promise<Record<string, BrandConfig>> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "BRANDING_COLLEGES" },
    });
    if (setting?.value) {
      return { ...DEFAULT_COLLEGES_BRANDING, ...JSON.parse(setting.value) };
    }
  } catch (err) {
    // fallback gracefully
  }
  return DEFAULT_COLLEGES_BRANDING;
}

/**
 * Saves branding for a specific college
 */
export async function saveCollegeBranding(slug: string, config: Partial<BrandConfig>): Promise<Record<string, BrandConfig>> {
  const all = await getCollegesBranding();
  const existing = all[slug] || {
    brandName: slug,
    whiteLabelEnabled: false,
    primaryColor: "#6366f1",
  };

  all[slug] = { ...existing, ...config };

  try {
    await prisma.systemSetting.upsert({
      where: { key: "BRANDING_COLLEGES" },
      update: { value: JSON.stringify(all) },
      create: {
        key: "BRANDING_COLLEGES",
        value: JSON.stringify(all),
        description: "Per-College White-Label Theme Configurations",
      },
    });
  } catch (err) {
    console.error(`Failed to save branding for college ${slug}:`, err);
  }

  return all;
}

/**
 * Resolves effective branding for a tenant.
 * If slug is "default" or tenant has whiteLabelEnabled === false, returns the Global Default Brand!
 */
export async function getEffectiveBranding(slug: string): Promise<BrandConfig> {
  const globalBrand = await getGlobalBranding();
  if (!slug || slug === "default") {
    return globalBrand;
  }

  const colleges = await getCollegesBranding();
  const collegeConfig = colleges[slug];

  if (collegeConfig && collegeConfig.whiteLabelEnabled) {
    return {
      brandName: collegeConfig.brandName || slug,
      whiteLabelEnabled: true,
      primaryColor: collegeConfig.primaryColor || globalBrand.primaryColor,
      logoUrl: collegeConfig.logoUrl || globalBrand.logoUrl,
      bannerText: collegeConfig.bannerText || globalBrand.bannerText,
      welcomePdfUrl: collegeConfig.welcomePdfUrl || globalBrand.welcomePdfUrl,
      customCss: collegeConfig.customCss || "",
    };
  }

  // Not whitelabeled: Return global platform brand
  return {
    ...globalBrand,
    whiteLabelEnabled: false,
  };
}

/**
 * Generates official BigBlueButton 3.0 HTML5 client custom CSS
 */
export function generateBBBThemeCss(config: BrandConfig, targetSlug: string = "default"): string {
  const primaryColor = config.primaryColor || "#6366f1";
  const brandName = config.brandName || "Aeorax Live";
  const customCss = config.customCss || "";

  return `/* ==========================================================================
   Aeorax Live — BigBlueButton 3.0 Dynamic Tenant Theme
   Target Tenant: ${targetSlug} (${brandName})
   Mode: ${config.whiteLabelEnabled ? "Custom White-Label" : "Global Master Brand"}
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

/* BBB Top Navbar Accent */
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
}
