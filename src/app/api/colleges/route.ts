import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

/**
 * GET /api/colleges
 * Fetch all registered college tenants from database.
 */
export async function GET() {
  try {
    const dbColleges = await prisma.college.findMany({
      include: {
        rooms: {
          select: {
            id: true,
            status: true,
            maxParticipants: true,
          },
        },
        sessions: {
          where: { status: "ACTIVE" },
          select: { id: true, peakParticipants: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const colleges = dbColleges.map((c) => {
      const activeRoomsCount = c.rooms.filter((r) => r.status === "RUNNING").length;
      const activeStudentsCount = c.sessions.reduce((acc, s) => acc + (s.peakParticipants || 0), 0);
      const storageLimitGb = Number(c.recordingStorageLimitBytes / BigInt(1024 * 1024 * 1024));

      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        contactEmail: c.contactEmail,
        contactPhone: c.contactPhone,
        plan: c.plan || "Standard College (8 Rooms)",
        status: c.status,
        activeRooms: activeRoomsCount,
        maxRooms: c.maxConcurrentRooms,
        activeStudents: activeStudentsCount,
        maxStudents: c.maxTotalParticipants,
        storageGb: 0,
        storageLimitGb,
        apiKey: c.apiKey,
        apiSecret: c.apiSecret,
        createdAt: c.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      colleges,
    });
  } catch (error: any) {
    console.error("Failed to fetch colleges:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load colleges" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/colleges
 * Register a new college client tenant in the database.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      slug,
      contactEmail,
      contactPhone,
      plan = "Standard College (8 Rooms)",
      maxConcurrentRooms = 8,
      maxParticipantsPerRoom = 100,
      maxTotalParticipants = 300,
      storageLimitGb = 100,
    } = body;

    if (!name || !slug || !contactEmail) {
      return NextResponse.json(
        { success: false, error: "Name, subdomain slug, and contact email are required." },
        { status: 400 }
      );
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

    const existing = await prisma.college.findUnique({
      where: { slug: cleanSlug },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `A client with slug "${cleanSlug}" already exists.` },
        { status: 409 }
      );
    }

    const apiKey = `key_${cleanSlug}_${crypto.randomBytes(6).toString("hex")}`;
    const apiSecret = `sec_${crypto.randomBytes(16).toString("hex")}`;
    const storageBytes = BigInt(storageLimitGb) * BigInt(1024 * 1024 * 1024);

    const college = await prisma.college.create({
      data: {
        name,
        slug: cleanSlug,
        contactEmail,
        contactPhone: contactPhone || null,
        plan,
        apiKey,
        apiSecret,
        maxConcurrentRooms: Number(maxConcurrentRooms),
        maxParticipantsPerRoom: Number(maxParticipantsPerRoom),
        maxTotalParticipants: Number(maxTotalParticipants),
        recordingStorageLimitBytes: storageBytes,
      },
    });

    return NextResponse.json({
      success: true,
      message: "College tenant created successfully",
      college,
    });
  } catch (error: any) {
    console.error("Create college error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create college" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/colleges
 * Update an existing college tenant (quota, plan, status).
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, slug, name, plan, status, maxConcurrentRooms, maxTotalParticipants, storageLimitGb } = body;

    if (!id && !slug) {
      return NextResponse.json({ success: false, error: "College ID or slug required." }, { status: 400 });
    }

    const data: any = {};
    if (name) data.name = name;
    if (plan) data.plan = plan;
    if (status) data.status = status;
    if (maxConcurrentRooms !== undefined) data.maxConcurrentRooms = Number(maxConcurrentRooms);
    if (maxTotalParticipants !== undefined) data.maxTotalParticipants = Number(maxTotalParticipants);
    if (storageLimitGb !== undefined) {
      data.recordingStorageLimitBytes = BigInt(storageLimitGb) * BigInt(1024 * 1024 * 1024);
    }

    const updated = await prisma.college.update({
      where: id ? { id } : { slug },
      data,
    });

    return NextResponse.json({ success: true, college: updated });
  } catch (error: any) {
    console.error("Update college error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update college" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/colleges?id=xxx
 * Delete a college client.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const slug = searchParams.get("slug");

    if (!id && !slug) {
      return NextResponse.json({ success: false, error: "College ID or slug is required" }, { status: 400 });
    }

    await prisma.college.delete({
      where: id ? { id } : { slug: slug! },
    });

    return NextResponse.json({ success: true, message: "College tenant deleted successfully" });
  } catch (error: any) {
    console.error("Delete college error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete college" },
      { status: 500 }
    );
  }
}
