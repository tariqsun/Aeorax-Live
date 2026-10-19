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

    const nodes = dbNodes.map((n) => {
      let ver = n.bbbVersion;
      // Auto-migrate legacy 3.0.39 default to 4.0.0 for Ubuntu 24.04 nodes
      if (!ver || ver === "3.0.39") {
        ver = "4.0.0";
      }
      return {
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
        bbbVersion: ver,
        scaleliteRegistered: n.scaleliteRegistered,
        createdAt: n.createdAt,
      };
    });

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
 * PATCH /api/nodes
 * Update a node's bbbVersion, name, or status.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, fqdn, bbbVersion, status, name } = body;

    const updated = await prisma.node.update({
      where: id ? { id } : { fqdn },
      data: {
        ...(bbbVersion ? { bbbVersion } : {}),
        ...(status ? { status } : {}),
        ...(name ? { name } : {}),
      },
    });

    return NextResponse.json({ success: true, node: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update node" },
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
