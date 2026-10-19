import { NextRequest, NextResponse } from "next/server";
import {
  testR2Connection,
  createPresignedUploadUrl,
  createPresignedDownloadUrl,
  listR2Objects,
  uploadObjectToR2,
  deleteObjectFromR2,
} from "@/lib/r2";

export const dynamic = "force-dynamic";

/**
 * GET /api/storage/r2
 * Check R2 health / connection status and list objects (with optional ?prefix=)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const prefix = searchParams.get("prefix") || "";

    if (action === "test") {
      const result = await testR2Connection();
      return NextResponse.json(result, { status: result.success ? 200 : 500 });
    }

    // Default: return status + recent objects list
    const connection = await testR2Connection();
    if (!connection.success) {
      return NextResponse.json(connection, { status: 500 });
    }

    const objects = await listR2Objects(prefix, 50);

    return NextResponse.json({
      success: true,
      connection,
      objects,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to query R2 storage" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/storage/r2
 * Actions:
 * - presign-upload: returns a pre-signed PUT url for direct browser upload
 * - upload-direct: uploads a base64 / text file directly
 * - delete: deletes an object by key
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "presign-upload") {
      const { key, contentType, expiresInSeconds } = body;
      if (!key) {
        return NextResponse.json({ success: false, error: "Object key is required" }, { status: 400 });
      }

      const presigned = await createPresignedUploadUrl(
        key,
        contentType || "application/octet-stream",
        expiresInSeconds ? Number(expiresInSeconds) : 900
      );

      return NextResponse.json({
        success: true,
        ...presigned,
      });
    }

    if (action === "presign-download") {
      const { key, expiresInSeconds } = body;
      if (!key) {
        return NextResponse.json({ success: false, error: "Object key is required" }, { status: 400 });
      }

      const presigned = await createPresignedDownloadUrl(
        key,
        expiresInSeconds ? Number(expiresInSeconds) : 3600
      );

      return NextResponse.json({
        success: true,
        ...presigned,
      });
    }

    if (action === "upload-direct") {
      const { key, content, contentType, isBase64, metadata } = body;
      if (!key || !content) {
        return NextResponse.json({ success: false, error: "Key and content are required" }, { status: 400 });
      }

      const buffer = isBase64 ? Buffer.from(content, "base64") : Buffer.from(content, "utf-8");
      const result = await uploadObjectToR2(key, buffer, contentType || "application/octet-stream", metadata);

      return NextResponse.json({
        ...result,
      });
    }

    if (action === "delete") {
      const { key } = body;
      if (!key) {
        return NextResponse.json({ success: false, error: "Key is required to delete" }, { status: 400 });
      }

      await deleteObjectFromR2(key);
      return NextResponse.json({ success: true, key, message: "Object deleted successfully" });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "R2 storage operation failed" },
      { status: 500 }
    );
  }
}
