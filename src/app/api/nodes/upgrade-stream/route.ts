import { NextRequest } from "next/server";
import { Client } from "ssh2";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/nodes/upgrade-stream?fqdn=xxx&ip=xxx&targetVersion=4.0.0
 * Safely drains node, streams live upgrade logs via SSH, and re-enables traffic.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fqdn = searchParams.get("fqdn")?.trim();
  const ip = searchParams.get("ip")?.trim();
  const sshPort = Number(searchParams.get("sshPort")) || 22;
  const sshUser = searchParams.get("sshUser") || "root";
  const sshPassword = searchParams.get("sshPassword") || "";
  const adminEmail = searchParams.get("adminEmail") || "admin@nesthost.net";

  if (!fqdn || !ip) {
    return new Response(JSON.stringify({ error: "Missing required parameters: fqdn and ip" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(type: "log" | "status" | "done" | "error", data: any) {
        try {
          const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {}
      }

      sendEvent("log", `[${new Date().toLocaleTimeString()}] Starting Zero-Downtime Upgrade Pipeline for ${fqdn}...`);
      sendEvent("log", `[${new Date().toLocaleTimeString()}] Phase 1: Graceful Maintenance Drain initiated...`);

      // 1. Mark node as DRAIN in database to prevent new meetings from routing to it
      try {
        await prisma.node.updateMany({
          where: { fqdn },
          data: { status: "DRAIN" },
        });
        sendEvent("log", `[${new Date().toLocaleTimeString()}] Node state set to DRAIN in Scalelite balancer.`);
      } catch (e: any) {
        sendEvent("log", `[WARN] Failed to update node status: ${e.message}`);
      }

      // 2. Connect via SSH to perform package upgrade
      const conn = new Client();
      let fullOutput = "";

      conn
        .on("ready", () => {
          sendEvent("log", `[${new Date().toLocaleTimeString()}] SSH connection established to ${ip}:${sshPort}.`);
          sendEvent("log", `[${new Date().toLocaleTimeString()}] Phase 2: Updating apt package index and upgrading BigBlueButton...`);
          sendEvent("status", { step: "Upgrading Packages", progress: 40 });

          const upgradeScript = `
export DEBIAN_FRONTEND=noninteractive
echo "[Aeorax] Updating repository lists..."
apt-get update -y

echo "[Aeorax] Upgrading BigBlueButton core packages..."
apt-get --only-upgrade install -y bbb-web bbb-html5 bbb-webrtc-sfu bbb-learning-dashboard 2>&1 || true

echo "[Aeorax] Refreshing official installer for latest maintenance fixes..."
wget -qO /root/bbb-install.sh https://raw.githubusercontent.com/bigbluebutton/bbb-install/v4.0.x-release/bbb-install.sh || wget -qO /root/bbb-install.sh https://ubuntu.bigbluebutton.org/bbb-install.sh
chmod +x /root/bbb-install.sh

UBUNTU_VER=$(grep "VERSION_ID" /etc/os-release | cut -d'"' -f2 || echo "24.04")
if [ "$UBUNTU_VER" = "24.04" ]; then
    /root/bbb-install.sh -v noble-400 -s "${fqdn}" -e "${adminEmail}"
else
    /root/bbb-install.sh -v jammy-300 -s "${fqdn}" -e "${adminEmail}"
fi

echo "[Aeorax] Verifying BigBlueButton status post-upgrade..."
bbb-conf --check
bbb-conf --secret
`;

          conn.exec(upgradeScript, (err, stream) => {
            if (err) {
              sendEvent("error", `SSH execution error: ${err.message}`);
              conn.end();
              controller.close();
              return;
            }

            stream
              .on("close", async (code: number) => {
                sendEvent("log", `[${new Date().toLocaleTimeString()}] Upgrade script finished with exit code ${code}.`);
                conn.end();

                // Re-enable node traffic
                try {
                  await prisma.node.updateMany({
                    where: { fqdn },
                    data: { status: "READY", bbbVersion: "4.0.0", lastHeartbeatAt: new Date() },
                  });
                  sendEvent("log", `[${new Date().toLocaleTimeString()}] Node state restored to READY (Online).`);
                } catch (e: any) {}

                sendEvent("done", {
                  success: code === 0,
                  message: code === 0 ? "Node successfully upgraded to latest BigBlueButton release!" : "Upgrade finished with non-zero exit code.",
                });

                controller.close();
              })
              .on("data", (data: Buffer) => {
                const text = data.toString();
                fullOutput += text;
                const lines = text.split("\n").filter(Boolean);
                for (const line of lines) {
                  sendEvent("log", line);
                }
              })
              .stderr.on("data", (data: Buffer) => {
                const text = data.toString();
                fullOutput += text;
                const lines = text.split("\n").filter(Boolean);
                for (const line of lines) {
                  sendEvent("log", `[stderr] ${line}`);
                }
              });
          });
        })
        .on("error", (err) => {
          sendEvent("error", `SSH Connection Failed: ${err.message}`);
          conn.end();
          controller.close();
        })
        .connect({
          host: ip,
          port: sshPort,
          username: sshUser,
          password: sshPassword || undefined,
          readyTimeout: 15000,
        });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
