import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json(
        { success: false, authenticated: false, user: null },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
        role: session.role,
        collegeId: session.collegeId,
        collegeSlug: session.collegeSlug,
        collegeName: session.collegeName,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, authenticated: false, error: error?.message || "Session check failed" },
      { status: 500 }
    );
  }
}
