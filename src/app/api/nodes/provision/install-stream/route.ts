import { NextRequest } from "next/server";
import { Client } from "ssh2";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/nodes/provision/install-stream?fqdn=xxx&ip=xxx&...
 * Streams real-time SSH installation logs to the browser via Server-Sent Events (SSE).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fqdn = searchParams.get("fqdn")?.trim();
  const ip = searchParams.get("ip")?.trim();
  const sshPort = Number(searchParams.get("sshPort")) || 22;
  const sshUser = searchParams.get("sshUser") || "root";
  const sshPassword = searchParams.get("sshPassword") || "";
  const adminEmail = searchParams.get("adminEmail") || "admin@nesthost.net";
  const nodeName = searchParams.get("nodeName") || `BBB Node (${fqdn})`;

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

      sendEvent("log", `[${new Date().toLocaleTimeString()}] Initializing connection to ${ip}:${sshPort} as ${sshUser}...`);

      const conn = new Client();
      let fullOutput = "";

      conn
        .on("ready", () => {
          sendEvent("log", `[${new Date().toLocaleTimeString()}] SSH connection established successfully.`);
          sendEvent("log", `[${new Date().toLocaleTimeString()}] Starting system update and BigBlueButton 3.0 installation...`);
          sendEvent("status", { step: "Installing", progress: 20 });

          // Non-interactive automated execution script
          const remoteScript = `
export DEBIAN_FRONTEND=noninteractive
echo "[Aeorax] Updating apt package lists..."
apt-get update -y
echo "[Aeorax] Installing prerequisites..."
apt-get install -y locales curl wget ufw jq python3 python3-pip dnsutils
locale-gen en_US.UTF-8
update-locale LANG=en_US.UTF-8

echo "[Aeorax] Configuring UFW firewall for WebRTC media..."
ufw --force reset > /dev/null 2>&1 || true
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 16384:32768/udp
ufw --force enable

echo "[Aeorax] Detecting Ubuntu OS version for BigBlueButton compatibility..."
UBUNTU_VER=$(grep "VERSION_ID" /etc/os-release | cut -d'"' -f2 || echo "24.04")
echo "[Aeorax] Detected Ubuntu Version: $UBUNTU_VER"

if which bbb-conf > /dev/null 2>&1; then
    echo "[Aeorax] BigBlueButton is already installed. Checking configuration:"
    bbb-conf --check
else
    if [ "$UBUNTU_VER" = "24.04" ]; then
        echo "[Aeorax] Target: BigBlueButton 4.0 for Ubuntu 24.04 (noble-400)..."
        wget -qO /root/bbb-install.sh https://raw.githubusercontent.com/bigbluebutton/bbb-install/v4.0.x-release/bbb-install.sh || wget -qO /root/bbb-install.sh https://ubuntu.bigbluebutton.org/bbb-install.sh
        chmod +x /root/bbb-install.sh
        echo "[Aeorax] Running BigBlueButton 4.0 installer (-v noble-400)..."
        /root/bbb-install.sh -v noble-400 -s "${fqdn}" -e "${adminEmail}"
    else
        echo "[Aeorax] Target: BigBlueButton 3.0 for Ubuntu 22.04 (jammy-300)..."
        wget -qO /root/bbb-install.sh https://ubuntu.bigbluebutton.org/bbb-install-2.7.sh
        chmod +x /root/bbb-install.sh
        echo "[Aeorax] Running BigBlueButton 3.0 installer (-v jammy-300)..."
        /root/bbb-install.sh -v jammy-300 -s "${fqdn}" -e "${adminEmail}"
    fi
fi

echo "[Aeorax] Extracting BBB credentials..."
bbb-conf --secret
`;

          conn.exec(remoteScript, (err, stream) => {
            if (err) {
              sendEvent("error", `Execution error: ${err.message}`);
              conn.end();
              controller.close();
              return;
            }

            stream
              .on("close", async (code: number) => {
                sendEvent("log", `[${new Date().toLocaleTimeString()}] Remote command finished with exit code ${code}.`);
                conn.end();

                // Extract Secret & URL
                const secretMatch = fullOutput.match(/Secret:\s+([a-zA-Z0-9_-]+)/);
                const urlMatch = fullOutput.match(/URL:\s+(https?:\/\/[^\s]+)/);

                const bbbSecret = secretMatch ? secretMatch[1] : null;
                const bbbUrl = urlMatch ? urlMatch[1] : `https://${fqdn}/bigbluebutton/api`;

                if (code === 0 && bbbSecret) {
                  sendEvent("log", `[${new Date().toLocaleTimeString()}] Verified BigBlueButton secret: ${bbbSecret.slice(0, 6)}...`);

                  try {
                    // Ensure pool exists
                    let defaultPool = await prisma.nodePool.findFirst({
                      where: { name: "General Shared Pool" },
                    });
                    if (!defaultPool) {
                      defaultPool = await prisma.nodePool.create({
                        data: {
                          name: "General Shared Pool",
                          type: "SHARED",
                          description: "Primary high-availability BigBlueButton cluster",
                        },
                      });
                    }

                    // Save node to DB
                    const node = await prisma.node.upsert({
                      where: { fqdn },
                      update: {
                        ipAddress: ip,
                        name: nodeName,
                        status: "READY",
                        scaleliteRegistered: true,
                        lastHeartbeatAt: new Date(),
                      },
                      create: {
                        poolId: defaultPool.id,
                        name: nodeName,
                        fqdn,
                        ipAddress: ip,
                        status: "READY",
                        scaleliteRegistered: true,
                        lastHeartbeatAt: new Date(),
                      },
                    });

                    sendEvent("done", {
                      success: true,
                      node,
                      bbbUrl,
                      bbbSecret,
                      message: "Node installed and registered in database!",
                    });
                  } catch (dbErr: any) {
                    sendEvent("done", {
                      success: true,
                      bbbUrl,
                      bbbSecret,
                      message: `Installation succeeded, but DB save warning: ${dbErr?.message}`,
                    });
                  }
                } else {
                  sendEvent("error", {
                    success: false,
                    message: `Installation did not return expected BigBlueButton secret. Check logs above.`,
                  });
                }

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
          readyTimeout: 20000,
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
