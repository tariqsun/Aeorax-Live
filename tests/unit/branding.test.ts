import { describe, it, expect } from "vitest";
import {
  DEFAULT_GLOBAL_BRAND,
  generateBBBThemeCss,
  BrandConfig,
} from "../../src/lib/branding";

describe("Branding & White-Label Theming Engine", () => {
  it("provides valid platform default branding", () => {
    expect(DEFAULT_GLOBAL_BRAND.brandName).toBe("Aeorax Live");
    expect(DEFAULT_GLOBAL_BRAND.primaryColor).toBe("#6366f1");
    expect(DEFAULT_GLOBAL_BRAND.whiteLabelEnabled).toBe(false);
  });

  it("generates BBB 3.0 CSS with injected primary color and root variables", () => {
    const config: BrandConfig = {
      brandName: "Custom Academy",
      whiteLabelEnabled: true,
      primaryColor: "#0284c7",
      bannerText: "Welcome Academy",
      customCss: ".custom-class { color: red; }",
    };

    const css = generateBBBThemeCss(config, "custom-academy");

    expect(css).toContain("Target Tenant: custom-academy (Custom Academy)");
    expect(css).toContain("Mode: Custom White-Label");
    expect(css).toContain("--color-primary: #0284c7 !important;");
    expect(css).toContain("--btn-primary-bg: #0284c7 !important;");
    expect(css).toContain(".custom-class { color: red; }");
  });

  it("generates BBB 3.0 CSS with Global Master Brand fallback when white-label is disabled", () => {
    const config: BrandConfig = {
      brandName: "Aeorax Live",
      whiteLabelEnabled: false,
      primaryColor: "#6366f1",
      bannerText: "Welcome to Aeorax Live Virtual Classroom",
    };

    const css = generateBBBThemeCss(config, "default");

    expect(css).toContain("Mode: Global Master Brand");
    expect(css).toContain("--color-primary: #6366f1 !important;");
    expect(css).toContain("button[class*=\"joinAudio\"]");
  });
});
