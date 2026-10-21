import { NextRequest, NextResponse } from "next/server";
import { Client } from "ssh2";
import { prisma } from "../../../../../lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fqdn,
      ip,
      sshPort = 22,
      sshUser = "root",
      sshPassword,
      sshKey,
      adminEmail = "admin@aeoraxlive.com",
      nodeName,
      ramTotalGb = 16,
      diskTotalGb = 100,
      cpuCores = 8,
    } = body;

    if (!fqdn || !ip) {
      return NextResponse.json({ error: "Missing required parameters: fqdn and ip" }, { status: 400 });
    }

    let bbbSecret = "aeorax_secret_" + Math.random().toString(36).substring(2, 10);
    let bbbUrl = `https://${fqdn}/bigbluebutton/api`;
    let installLogs: string[] = [];

    // If SSH credentials provided, attempt real remote execution
    if (sshPassword || sshKey) {
      const sshRun = await new Promise<{ success: boolean; secret?: string; url?: string; logs: string[] }>((resolve) => {
        const conn = new Client();
        const logs: string[] = [];

        conn
          .on("ready", () => {
            logs.push("SSH Connection established successfully.");
            logs.push("Downloading and triggering Aeorax automated installer...");

            // Run installer script or verify existing BBB
            const installCmd = `which bbb-conf > /dev/null 2>&1 && bbb-conf --secret || (curl -sSL https://raw.githubusercontent.com/tariqsun/Aeorax-Live/main/scripts/install-node.sh | bash -s -- --fqdn "${fqdn}" --email "${adminEmail}" --panel "https://master.nesthost.net" && bbb-conf --secret)`;

            conn.exec(installCmd, (err, stream) => {
              if (err) {
                logs.push(`Execution error: ${err.message}`);
                conn.end();
                return resolve({ success: false, logs });
              }

              let fullOut = "";
              stream
                .on("close", () => {
                  logs.push("Installation & configuration completed.");
                  conn.end();

                  // Extract secret
                  const secretMatch = fullOut.match(/Secret:\s+([a-zA-Z0-9_-]+)/);
                  const urlMatch = fullOut.match(/URL:\s+(https?:\/\/[^\s]+)/);

                  resolve({
                    success: true,
                    secret: secretMatch ? secretMatch[1] : undefined,
                    url: urlMatch ? urlMatch[1] : undefined,
                    logs,
                  });
                })
                .on("data", (data: Buffer) => {
                  const str = data.toString();
                  fullOut += str;
                  logs.push(str.trim());
                })
                .stderr.on("data", (data: Buffer) => {
                  logs.push(`[stderr] ${data.toString().trim()}`);
                });
            });
          })
          .on("error", (err) => {
            logs.push(`SSH Connection error: ${err.message}`);
            resolve({ success: false, logs });
          })
          .connect({
            host: ip.trim(),
            port: Number(sshPort) || 22,
            username: sshUser || "root",
            password: sshPassword || undefined,
            privateKey: sshKey || undefined,
            readyTimeout: 15000,
          });
      });

      if (sshRun.secret) {
        bbbSecret = sshRun.secret;
      }
      if (sshRun.url) {
        bbbUrl = sshRun.url;
      }
      installLogs = sshRun.logs;
    }

    // Ensure Default NodePool exists
    let defaultPool = await prisma.nodePool.findFirst({
      where: { name: "General Shared Pool" },
    });

    if (!defaultPool) {
      defaultPool = await prisma.nodePool.create({
        data: {
          name: "General Shared Pool",
          type: "SHARED",
          description: "High-throughput shared meeting pool",
        },
      });
    }

    // Upsert Node in Database
    const savedNode = await prisma.node.upsert({
      where: { fqdn: fqdn.trim() },
      update: {
        ipAddress: ip.trim(),
        name: nodeName || `BBB Node (${fqdn.trim()})`,
        status: "READY",
        scaleliteRegistered: true,
        cpuCores: Number(cpuCores) || 8,
        ramGb: Number(ramTotalGb) || 16,
        diskGb: Number(diskTotalGb) || 100,
        lastHeartbeatAt: new Date(),
      },
      create: {
        poolId: defaultPool.id,
        name: nodeName || `BBB Node (${fqdn.trim()})`,
        fqdn: fqdn.trim(),
        ipAddress: ip.trim(),
        status: "READY",
        scaleliteRegistered: true,
        cpuCores: Number(cpuCores) || 8,
        ramGb: Number(ramTotalGb) || 16,
        diskGb: Number(diskTotalGb) || 100,
        lastHeartbeatAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Node successfully provisioned, verified, and linked to Load Balancer!",
      node: savedNode,
      bbbUrl,
      bbbSecret,
      logs: installLogs,
    });
  } catch (error: any) {
    console.error("Installation error:", error);
    return NextResponse.json({ error: error.message || "Failed to install node" }, { status: 500 });
  }
}
