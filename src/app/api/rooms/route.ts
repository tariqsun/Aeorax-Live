import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/rooms?collegeSlug=xxx
 * Fetch real virtual classrooms for a specific college tenant.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const collegeSlug = searchParams.get("collegeSlug");

    const where: any = {};
    if (collegeSlug) {
      where.college = { slug: collegeSlug };
    }

    const dbRooms = await prisma.room.findMany({
      where,
      include: {
        college: { select: { id: true, name: true, slug: true } },
        sessions: {
          where: { status: "ACTIVE" },
          orderBy: { startedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const rooms = dbRooms.map((r) => {
      const activeSession = r.sessions[0];
      const durationMinutes = activeSession
        ? Math.max(1, Math.round((Date.now() - new Date(activeSession.startedAt).getTime()) / 60000))
        : 0;

      return {
        id: r.id,
        collegeId: r.collegeId,
        collegeSlug: r.college?.slug,
        name: r.name,
        slug: r.slug,
        teacher: "Instructor",
        status: r.status,
        studentsCount: activeSession ? activeSession.peakParticipants : 0,
        recordEnabled: r.recordEnabled,
        durationMinutes,
        maxParticipants: r.maxParticipants,
        attendeePw: r.attendeePw,
        moderatorPw: r.moderatorPw,
        createdAt: r.createdAt,
      };
    });

    return NextResponse.json({ success: true, rooms });
  } catch (error: any) {
    console.error("Fetch rooms error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load rooms" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rooms
 * Create a new virtual classroom for a college tenant.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      collegeSlug,
      name,
      slug,
      teacher = "Instructor",
      maxParticipants = 100,
      recordEnabled = true,
      moderatorPw = "mp",
      attendeePw = "ap",
    } = body;

    if (!collegeSlug || !name || !slug) {
      return NextResponse.json(
        { success: false, error: "College, classroom name, and room slug are required." },
        { status: 400 }
      );
    }

    const college = await prisma.college.findUnique({
      where: { slug: collegeSlug },
      include: { rooms: true },
    });
    if (!college) {
      return NextResponse.json({ success: false, error: "College not found" }, { status: 404 });
    }

    // Check college room quota
    if (college.rooms.length >= college.maxConcurrentRooms) {
      return NextResponse.json(
        {
          success: false,
          error: `Room limit reached (${college.rooms.length}/${college.maxConcurrentRooms}). Upgrade client plan to add more classrooms.`,
        },
        { status: 403 }
      );
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

    // Check room slug uniqueness within college
    const existingRoom = await prisma.room.findFirst({
      where: { collegeId: college.id, slug: cleanSlug },
    });
    if (existingRoom) {
      return NextResponse.json(
        { success: false, error: `A classroom with slug "${cleanSlug}" already exists for this client.` },
        { status: 409 }
      );
    }

    // Ensure dummy user creator or default user exists
    let creator = await prisma.user.findFirst({
      where: { collegeId: college.id },
    });
    if (!creator) {
      creator = await prisma.user.create({
        data: {
          collegeId: college.id,
          name: teacher || "Head Moderator",
          email: `${cleanSlug}-mod@${college.slug}.aeoraxlive.com`,
          passwordHash: "managed-hash",
          role: "COLLEGE_ADMIN",
        },
      });
    }

    const room = await prisma.room.create({
      data: {
        collegeId: college.id,
        creatorId: creator.id,
        name,
        slug: cleanSlug,
        maxParticipants: Number(maxParticipants),
        recordEnabled: Boolean(recordEnabled),
        moderatorPw,
        attendeePw,
        status: "IDLE",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Virtual classroom created successfully",
      room,
    });
  } catch (error: any) {
    console.error("Create room error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create room" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/rooms?id=xxx
 * Delete a virtual classroom.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Room ID is required" }, { status: 400 });
    }

    await prisma.room.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Classroom deleted successfully" });
  } catch (error: any) {
    console.error("Delete room error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete room" },
      { status: 500 }
    );
  }
}
