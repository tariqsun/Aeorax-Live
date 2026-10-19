import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fqdn, ip, cpu_pct, ram_pct, disk_pct, active_meetings, active_participants } = body;

    if (!fqdn) {
      return NextResponse.json({ error: "Missing FQDN" }, { status: 400 });
    }

    // Find node by FQDN
    const existingNode = await prisma.node.findUnique({
      where: { fqdn },
    });

    if (existingNode) {
      const ramTotal = existingNode.ramGb || 16;
      const diskTotal = existingNode.diskGb || 100;
      const ramPct = typeof ram_pct === "number" ? ram_pct : existingNode.ramUsagePercent;
      const diskPct = typeof disk_pct === "number" ? disk_pct : existingNode.diskUsagePercent;
      const ramUsed = Math.round((ramPct / 100) * ramTotal * 10) / 10;
      const diskUsed = Math.round((diskPct / 100) * diskTotal * 10) / 10;

      await prisma.node.update({
        where: { fqdn },
        data: {
          cpuUsagePercent: typeof cpu_pct === "number" ? cpu_pct : existingNode.cpuUsagePercent,
          ramUsagePercent: ramPct,
          diskUsagePercent: diskPct,
          ramUsedGb: ramUsed,
          diskUsedGb: diskUsed,
          activeMeetingsCount: typeof active_meetings === "number" ? active_meetings : existingNode.activeMeetingsCount,
          activeParticipantsCount: typeof active_participants === "number" ? active_participants : existingNode.activeParticipantsCount,
          lastHeartbeatAt: new Date(),
          status: existingNode.status === "OFFLINE" ? "READY" : existingNode.status,
          ...(ip ? { ipAddress: ip } : {}),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Heartbeat recorded successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Telemetry heartbeat error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
