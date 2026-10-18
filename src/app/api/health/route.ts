import { NextResponse } from "next/server";

export async function GET() {
  const uptimeSeconds = process.uptime();
  return NextResponse.json(
    {
      status: "HEALTHY",
      service: "aeorax-live-control-plane",
      version: "0.1.0",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(uptimeSeconds),
      checks: {
        controlPlane: "UP",
        bbbVersionTarget: "3.0.39",
      },
    },
    { status: 200 }
  );
}
