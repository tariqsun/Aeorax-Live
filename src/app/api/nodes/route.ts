import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/nodes
 * Fetch all real nodes from database.
 */
export async function GET() {
  try {
    const dbNodes = await prisma.node.findMany({
      orderBy: { createdAt: "desc" },
    });

    const nodes = dbNodes.map((n) => ({
      id: n.id,
      name: n.name,
      fqdn: n.fqdn,
      ip: n.ipAddress,
      status: n.status,
      cpu: n.cpuUsagePercent || 0,
      steal: 0,
      ramPercent: 0,
      ramUsedGb: 0,
      ramTotalGb: n.ramGb || 16,
      diskPercent: 0,
      diskUsedGb: 0,
      diskTotalGb: n.diskGb || 100,
      meetings: n.activeMeetingsCount || 0,
      participants: n.activeParticipantsCount || 0,
      webcams: 0,
      bbbVersion: n.bbbVersion || "4.0.0",
      scaleliteRegistered: n.scaleliteRegistered,
      createdAt: n.createdAt,
    }));

    return NextResponse.json({
      success: true,
      nodes,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load nodes" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/nodes?id=xxx
 * Delete a node from the database.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const fqdn = searchParams.get("fqdn");

    if (!id && !fqdn) {
      return NextResponse.json({ success: false, error: "Node ID or FQDN required" }, { status: 400 });
    }

    if (id) {
      await prisma.node.delete({ where: { id } });
    } else if (fqdn) {
      await prisma.node.delete({ where: { fqdn } });
    }

    return NextResponse.json({ success: true, message: "Node deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete node" },
      { status: 500 }
    );
  }
}
