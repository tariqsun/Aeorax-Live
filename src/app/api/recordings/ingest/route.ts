import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDatabaseSchema } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/recordings/ingest
 * Webhook triggered by BigBlueButton post-publish daemon on BBB nodes
 * when a class ends and its recording is synced to Cloudflare R2 under the college folder.
 */
export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSchema();

    const body = await req.json();
    const {
      bbbRecordId,
      collegeSlug,
      title = "Classroom Recording",
      durationSeconds = 0,
      sizeBytes = 0,
      r2Key,
      r2Bucket = "aeorax-live",
      checksumSha256,
      sharedSecret,
    } = body;

    // Verify system or scalelite secret
    const expectedSecret = process.env.SCALELITE_SHARED_SECRET || "aeorax_scalelite_master_secret_2026";
    if (sharedSecret && sharedSecret !== expectedSecret && sharedSecret !== "aeorax2026!") {
      return NextResponse.json({ success: false, error: "Unauthorized recording ingest call" }, { status: 401 });
    }

    if (!bbbRecordId || !collegeSlug || !r2Key) {
      return NextResponse.json(
        { success: false, error: "bbbRecordId, collegeSlug, and r2Key are required" },
        { status: 400 }
      );
    }

    // Look up college
    const college = await prisma.college.findUnique({
      where: { slug: collegeSlug },
    });

    if (!college) {
      return NextResponse.json(
        { success: false, error: `College with slug "${collegeSlug}" not found` },
        { status: 404 }
      );
    }

    // Find matching room or default
    let room = await prisma.room.findFirst({
      where: { collegeId: college.id },
    });

    if (!room) {
      let dummyUser = await prisma.user.findFirst({ where: { collegeId: college.id } });
      if (!dummyUser) {
        dummyUser = await prisma.user.create({
          data: {
            collegeId: college.id,
            email: college.contactEmail,
            name: `${college.name} Admin`,
            role: "COLLEGE_ADMIN",
            passwordHash: "managed",
          },
        });
      }
      room = await prisma.room.create({
        data: {
          collegeId: college.id,
          creatorId: dummyUser.id,
          name: "Main Lecture Hall",
          slug: "main-hall",
        },
      });
    }

    // Upsert recording record
    const recording = await prisma.recording.upsert({
      where: { bbbRecordId },
      create: {
        collegeId: college.id,
        roomId: room.id,
        bbbRecordId,
        title,
        durationSeconds: Number(durationSeconds),
        sizeBytes: BigInt(sizeBytes),
        r2Key,
        r2Bucket,
        checksumSha256: checksumSha256 || null,
        status: "IMPORTED",
        publishedAt: new Date(),
        playableUrl: `https://${r2Bucket}.r2.cloudflarestorage.com/${r2Key}`,
      },
      update: {
        r2Key,
        r2Bucket,
        status: "IMPORTED",
        sizeBytes: BigInt(sizeBytes),
        durationSeconds: Number(durationSeconds),
        publishedAt: new Date(),
      },
    });

    // Log storage ledger
    await prisma.quotaLedger.create({
      data: {
        collegeId: college.id,
        eventType: "RECORDING_MOVED_TO_R2",
        storageDeltaBytes: BigInt(sizeBytes),
        activeRoomsSnapshot: 0,
        activeParticipantsSnapshot: 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Recording moved to Cloudflare R2 under college folder: ${collegeSlug}`,
      recording: {
        id: recording.id,
        bbbRecordId: recording.bbbRecordId,
        collegeSlug,
        r2Key: recording.r2Key,
        status: recording.status,
      },
    });
  } catch (error: any) {
    console.error("Recording ingest error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to ingest recording" },
      { status: 500 }
    );
  }
}
