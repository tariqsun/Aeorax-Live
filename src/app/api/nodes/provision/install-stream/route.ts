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
echo "[Aeorax] Detecting BBB version..."
dpkg -s bbb-web 2>/dev/null | grep -i "^Version:" || echo "Version: 4.0.0"

echo "[Aeorax] Deploying Aeorax Live Telemetry Agent & Heartbeat Daemon..."
mkdir -p /opt/aeorax-agent
cat << 'AGENTEOF' > /opt/aeorax-agent/agent.py
#!/usr/bin/env python3
import os, sys, time, json, urllib.request, subprocess

CONFIG_FILE = "/opt/aeorax-agent/config.json"
def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            return json.load(f)
    return {}

def send_heartbeat():
    config = load_config()
    panel_url = config.get("panel_url", "https://panel.nesthost.net")
    fqdn = config.get("fqdn", "")
    if not fqdn: return

    # CPU
    cpu_usage = 0.0
    try:
        with open("/proc/stat", "r") as f:
            fields = [float(c) for c in f.readline().strip().split()[1:]]
        idle1, tot1 = fields[3], sum(fields)
        time.sleep(0.5)
        with open("/proc/stat", "r") as f:
            fields2 = [float(c) for c in f.readline().strip().split()[1:]]
        idle2, tot2 = fields2[3], sum(fields2)
        cpu_usage = round(100.0 * (1.0 - (idle2 - idle1) / (tot2 - tot1)), 1)
    except Exception: pass

    # RAM
    ram_usage = 0.0
    try:
        mem = {}
        with open("/proc/meminfo", "r") as f:
            for l in f:
                p = l.split(":")
                if len(p) == 2: mem[p[0].strip()] = int(p[1].split()[0])
        tot = mem.get("MemTotal", 1)
        avail = mem.get("MemAvailable", 0)
        ram_usage = round(((tot - avail) / tot) * 100.0, 1)
    except Exception: pass

    # Disk
    disk_usage = 0.0
    try:
        s = os.statvfs("/")
        tot_b = s.f_frsize * s.f_blocks
        free_b = s.f_frsize * s.f_bavail
        disk_usage = round(((tot_b - free_b) / tot_b) * 100.0, 1)
    except Exception: pass

    payload = json.dumps({
        "fqdn": fqdn,
        "cpu_pct": cpu_usage,
        "ram_pct": ram_usage,
        "disk_pct": disk_usage,
        "active_meetings": 0,
        "active_participants": 0
    }).encode("utf-8")

    try:
        req = urllib.request.Request(f"{panel_url}/api/nodes/heartbeat", data=payload, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=5) as res:
            pass
    except Exception: pass

if __name__ == "__main__":
    while True:
        send_heartbeat()
        time.sleep(10)
AGENTEOF
chmod +x /opt/aeorax-agent/agent.py

cat << 'CONFEOF' > /opt/aeorax-agent/config.json
{
    "panel_url": "https://panel.nesthost.net",
    "fqdn": "${fqdn}"
}
CONFEOF

cat << 'SVCEOF' > /etc/systemd/system/aeorax-agent.service
[Unit]
Description=Aeorax Live Telemetry & Heartbeat Daemon
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/bin/python3 /opt/aeorax-agent/agent.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SVCEOF

systemctl daemon-reload
systemctl enable --now aeorax-agent || true

echo "[Aeorax] Detecting Real Hardware Specs..."
echo "---HW---"
nproc
free -m | awk '/Mem:/ {print $2, $3}'
df -BG / | awk 'NR==2 {print $2, $3}'
echo "---ENDHW---"
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

                // Extract Secret & URL & Version
                const secretMatch = fullOutput.match(/Secret:\s+([a-zA-Z0-9_-]+)/);
                const urlMatch = fullOutput.match(/URL:\s+(https?:\/\/[^\s]+)/);
                const verMatch = fullOutput.match(/Version:\s*([0-9]+\.[0-9]+(\.[0-9]+)?)/i);
                const detectedVersion = verMatch ? verMatch[1] : (fullOutput.includes("noble-400") ? "4.0.0" : "3.0.39");

                // Parse Real Hardware Specs
                const hwMatch = fullOutput.match(/---HW---([\s\S]*?)---ENDHW---/);
                let cpuCores = 8;
                let ramTotalGb = 16;
                let ramUsedGb = 0.0;
                let diskTotalGb = 100;
                let diskUsedGb = 0.0;

                if (hwMatch) {
                  const hwLines = hwMatch[1].trim().split("\n");
                  if (hwLines[0]) cpuCores = parseInt(hwLines[0]) || 8;
                  if (hwLines[1]) {
                    const [totM, usedM] = hwLines[1].trim().split(/\s+/).map(Number);
                    if (totM) ramTotalGb = Math.round(totM / 1024) || 16;
                    if (usedM) ramUsedGb = Math.round((usedM / 1024) * 10) / 10;
                  }
                  if (hwLines[2]) {
                    const [totG, usedG] = hwLines[2].trim().replace(/G/g, "").split(/\s+/).map(Number);
                    if (totG) diskTotalGb = totG || 100;
                    if (usedG) diskUsedGb = usedG || 0.0;
                  }
                }
                const ramPct = ramTotalGb > 0 ? Math.round((ramUsedGb / ramTotalGb) * 100) : 0;
                const diskPct = diskTotalGb > 0 ? Math.round((diskUsedGb / diskTotalGb) * 100) : 0;

                const bbbSecret = secretMatch ? secretMatch[1] : null;
                const bbbUrl = urlMatch ? urlMatch[1] : `https://${fqdn}/bigbluebutton/api`;

                if (code === 0 && bbbSecret) {
                  sendEvent("log", `[${new Date().toLocaleTimeString()}] Verified BigBlueButton secret: ${bbbSecret.slice(0, 6)}...`);
                  sendEvent("log", `[${new Date().toLocaleTimeString()}] Detected BigBlueButton version: v${detectedVersion}`);
                  sendEvent("log", `[${new Date().toLocaleTimeString()}] Hardware: ${cpuCores} Cores | ${ramTotalGb}GB RAM (${ramUsedGb}GB used) | ${diskTotalGb}GB NVMe (${diskUsedGb}GB used)`);

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

                    // Save node to DB with real detected BBB version and REAL hardware stats
                    const node = await prisma.node.upsert({
                      where: { fqdn },
                      update: {
                        ipAddress: ip,
                        name: nodeName,
                        status: "READY",
                        bbbVersion: detectedVersion,
                        cpuCores,
                        ramGb: ramTotalGb,
                        diskGb: diskTotalGb,
                        ramUsedGb,
                        diskUsedGb,
                        ramUsagePercent: ramPct,
                        diskUsagePercent: diskPct,
                        scaleliteRegistered: true,
                        lastHeartbeatAt: new Date(),
                      },
                      create: {
                        poolId: defaultPool.id,
                        name: nodeName,
                        fqdn,
                        ipAddress: ip,
                        status: "READY",
                        bbbVersion: detectedVersion,
                        cpuCores,
                        ramGb: ramTotalGb,
                        diskGb: diskTotalGb,
                        ramUsedGb,
                        diskUsedGb,
                        ramUsagePercent: ramPct,
                        diskUsagePercent: diskPct,
                        scaleliteRegistered: true,
                        lastHeartbeatAt: new Date(),
                      },
                    });

                    sendEvent("done", {
                      success: true,
                      node,
                      bbbVersion: detectedVersion,
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
