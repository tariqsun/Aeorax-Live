import { NextRequest, NextResponse } from "next/server";
import {
  getGlobalBranding,
  saveGlobalBranding,
  getCollegesBranding,
  saveCollegeBranding,
  BrandConfig,
} from "../../../lib/branding";

export async function GET() {
  try {
    const global = await getGlobalBranding();
    const colleges = await getCollegesBranding();

    return NextResponse.json({
      success: true,
      data: {
        global,
        colleges,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch branding settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target, config } = body as { target: string; config: Partial<BrandConfig> };

    if (!target) {
      return NextResponse.json(
        { success: false, error: "Missing 'target' field ('global' or college slug)" },
        { status: 400 }
      );
    }

    if (target === "global") {
      const updatedGlobal = await saveGlobalBranding(config);
      const colleges = await getCollegesBranding();
      return NextResponse.json({
        success: true,
        message: "Global platform brand updated successfully",
        data: {
          global: updatedGlobal,
          colleges,
        },
      });
    } else {
      const updatedColleges = await saveCollegeBranding(target, config);
      const global = await getGlobalBranding();
      return NextResponse.json({
        success: true,
        message: `Branding for college '${target}' updated successfully`,
        data: {
          global,
          colleges: updatedColleges,
        },
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update branding settings" },
      { status: 500 }
    );
  }
}
