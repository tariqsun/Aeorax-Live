import { NextRequest, NextResponse } from "next/server";
import { authenticateCredentials, signSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: "Please enter both identifier (email or college slug) and password." },
        { status: 400 }
      );
    }

    const authResult = await authenticateCredentials(identifier, password);

    if (!authResult.success || !authResult.session) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Invalid username or password" },
        { status: 401 }
      );
    }

    const token = signSession(authResult.session);

    const response = NextResponse.json({
      success: true,
      message: "Authentication successful",
      user: {
        id: authResult.session.userId,
        email: authResult.session.email,
        name: authResult.session.name,
        role: authResult.session.role,
        collegeId: authResult.session.collegeId,
        collegeSlug: authResult.session.collegeSlug,
        collegeName: authResult.session.collegeName,
      },
      token,
    });

    // Set secure HTTP-only cookie
    response.cookies.set("aeorax_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error during authentication" },
      { status: 500 }
    );
  }
}
