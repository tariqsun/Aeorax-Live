import { NextRequest, NextResponse } from "next/server";
import { Client } from "ssh2";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/nodes/branding/deploy
 * Deploys custom branded landing HTML to /var/www/bigbluebutton-default/index.html on the VPS node.
 * Eliminates any manual SSH / terminal editing!
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      nodeId,
      nodeFqdn,
      ipAddress,
      sshPassword,
      sshUser = "root",
      sshPort = 22,
      brandName = "Aeorax Live",
      redirectUrl = "https://panel.nesthost.net",
    } = body;

    // Resolve node
    let targetIp = ipAddress;
    let targetFqdn = nodeFqdn;
    if (nodeId) {
      const dbNode = await prisma.node.findUnique({ where: { id: nodeId } });
      if (dbNode) {
        targetIp = targetIp || dbNode.ipAddress;
        targetFqdn = targetFqdn || dbNode.fqdn;
      }
    }

    if (!targetIp) {
      return NextResponse.json(
        { success: false, error: "Node IP Address is required to deploy landing page." },
        { status: 400 }
      );
    }

    if (!sshPassword) {
      return NextResponse.json(
        { success: false, error: "Root SSH Password is required to update server landing page." },
        { status: 400 }
      );
    }

    // Build the high-tech, responsive branded HTML page
    const customHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandName} — Dedicated Virtual Classroom Node</title>
  <meta http-equiv="refresh" content="4; url=${redirectUrl}">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body {
      background: #090d16;
      color: #f1f5f9;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      position: relative;
      overflow: hidden;
    }
    .ambient {
      position: absolute;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.1) 50%, transparent 70%);
      border-radius: 50%;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      filter: blur(60px);
      pointer-events: none;
    }
    .card {
      position: relative;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(148, 163, 184, 0.15);
      border-radius: 28px;
      padding: 48px 40px;
      max-width: 520px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 999px;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 24px;
    }
    .dot {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 8px #10b981;
    }
    h1 {
      font-size: 26px;
      font-weight: 900;
      color: #ffffff;
      margin-bottom: 12px;
      letter-spacing: -0.02em;
    }
    p {
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 28px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 14px 24px;
      border-radius: 16px;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: #ffffff;
      font-size: 13px;
      font-weight: 800;
      text-decoration: none;
      box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.4);
      transition: all 0.2s ease;
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 30px -5px rgba(79, 70, 229, 0.5);
    }
    .timer {
      font-size: 11px;
      color: #64748b;
      margin-top: 18px;
    }
  </style>
</head>
<body>
  <div class="ambient"></div>
  <div class="card">
    <div class="badge">
      <div class="dot"></div>
      Cluster Node Operational
    </div>
    <h1>${brandName}</h1>
    <p>This server is a high-availability dedicated WebRTC node powering <strong>${brandName}</strong> live interactive classrooms.</p>
    <a href="${redirectUrl}" class="btn">
      <span>Go to ${brandName} Dashboard</span>
      <span>&rarr;</span>
    </a>
    <div class="timer">Redirecting to management portal automatically in 4 seconds...</div>
  </div>
</body>
</html>`;

    // Connect via SSH2 and write file safely
    const sshResult = await new Promise<{ success: boolean; message: string }>((resolve) => {
      const conn = new Client();
      conn
        .on("ready", () => {
          // Write html safely using base64 decoding in bash
          const b64 = Buffer.from(customHtml, "utf-8").toString("base64");
          const cmd = `echo "${b64}" | base64 -d > /var/www/bigbluebutton-default/index.html && chown www-data:www-data /var/www/bigbluebutton-default/index.html && chmod 644 /var/www/bigbluebutton-default/index.html`;

          conn.exec(cmd, (err, stream) => {
            if (err) {
              conn.end();
              return resolve({ success: false, message: `SSH exec error: ${err.message}` });
            }
            stream.on("close", (code: number) => {
              conn.end();
              if (code === 0) {
                resolve({
                  success: true,
                  message: `Branded landing page deployed successfully to ${targetFqdn || targetIp}!`,
                });
              } else {
                resolve({
                  success: false,
                  message: `Command exited with non-zero code ${code}`,
                });
              }
            });
          });
        })
        .on("error", (err) => {
          resolve({ success: false, message: `SSH Connection error: ${err.message}` });
        })
        .connect({
          host: targetIp,
          port: Number(sshPort),
          username: sshUser,
          password: sshPassword,
          readyTimeout: 10000,
        });
    });

    if (sshResult.success) {
      return NextResponse.json({ success: true, message: sshResult.message });
    } else {
      return NextResponse.json({ success: false, error: sshResult.message }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to deploy branding to node." },
      { status: 500 }
    );
  }
}
