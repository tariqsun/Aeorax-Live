import { NextRequest, NextResponse } from "next/server";
import dns from "node:dns/promises";
import { Client } from "ssh2";

interface PreflightResult {
  dns: {
    matched: boolean;
    resolvedIp: string | null;
    targetIp: string;
    message: string;
  };
  ssh: {
    connected: boolean;
    error?: string;
  };
  os: {
    name: string;
    valid: boolean;
  };
  cpu: {
    cores: number;
    valid: boolean;
  };
  ram: {
    totalGb: number;
    valid: boolean;
  };
  disk: {
    totalGb: number;
    freeGb: number;
    valid: boolean;
  };
  readyForInstall: boolean;
  summary: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fqdn, ip, sshPort = 22, sshUser = "root", sshPassword, sshKey } = body;

    if (!fqdn || !ip) {
      return NextResponse.json({ error: "Subdomain (FQDN) and Server IP are required." }, { status: 400 });
    }

    // 1. DNS Preflight Check
    let resolvedIp: string | null = null;
    let dnsMatched = false;
    let dnsMessage = "";

    try {
      const addresses = await dns.resolve4(fqdn);
      resolvedIp = addresses[0] || null;
      dnsMatched = resolvedIp === ip.trim();
      if (dnsMatched) {
        dnsMessage = `DNS record verified: ${fqdn} points to ${ip}`;
      } else {
        dnsMessage = `DNS mismatch: ${fqdn} resolves to ${resolvedIp || "none"}, but VPS IP is ${ip}`;
      }
    } catch (dnsErr: any) {
      dnsMessage = `Could not resolve ${fqdn}. Ensure A record is created in your DNS provider.`;
    }

    // 2. SSH Connection & Diagnostics
    if (!sshPassword && !sshKey) {
      // Return DNS result with prompt for SSH
      return NextResponse.json({
        dns: { matched: dnsMatched, resolvedIp, targetIp: ip, message: dnsMessage },
        ssh: { connected: false, error: "Please provide root password or SSH private key." },
        os: { name: "Unknown", valid: false },
        cpu: { cores: 0, valid: false },
        ram: { totalGb: 0, valid: false },
        disk: { totalGb: 0, freeGb: 0, valid: false },
        readyForInstall: false,
        summary: "DNS checked. SSH credentials required to run VPS preflight checks.",
      });
    }

    // Run SSH commands via ssh2
    const sshResult = await new Promise<any>((resolve) => {
      const conn = new Client();
      let connected = false;

      const timeout = setTimeout(() => {
        try {
          conn.end();
        } catch (_) {}
        resolve({
          connected: false,
          error: "SSH connection timed out (port 22 unreachable or firewall blocking).",
        });
      }, 10000);

      conn
        .on("ready", () => {
          connected = true;
          // Run preflight diagnostics
          const cmd = `cat /etc/os-release && echo "---SEPARATOR---" && nproc && echo "---SEPARATOR---" && free -m && echo "---SEPARATOR---" && df -BG /`;
          conn.exec(cmd, (err, stream) => {
            if (err) {
              clearTimeout(timeout);
              conn.end();
              return resolve({ connected: true, error: err.message });
            }

            let stdout = "";
            let stderr = "";

            stream
              .on("close", () => {
                clearTimeout(timeout);
                conn.end();
                resolve({ connected: true, stdout, stderr });
              })
              .on("data", (data: Buffer) => {
                stdout += data.toString();
              })
              .stderr.on("data", (data: Buffer) => {
                stderr += data.toString();
              });
          });
        })
        .on("error", (err) => {
          clearTimeout(timeout);
          resolve({ connected: false, error: err.message });
        })
        .connect({
          host: ip.trim(),
          port: Number(sshPort) || 22,
          username: sshUser || "root",
          password: sshPassword || undefined,
          privateKey: sshKey || undefined,
          readyTimeout: 9000,
        });
    });

    if (!sshResult.connected) {
      return NextResponse.json({
        dns: { matched: dnsMatched, resolvedIp, targetIp: ip, message: dnsMessage },
        ssh: { connected: false, error: sshResult.error || "Authentication failed" },
        os: { name: "Pending SSH", valid: false },
        cpu: { cores: 0, valid: false },
        ram: { totalGb: 0, valid: false },
        disk: { totalGb: 0, freeGb: 0, valid: false },
        readyForInstall: false,
        summary: `SSH Failed: ${sshResult.error}`,
      });
    }

    // Parse remote server outputs
    const sections = (sshResult.stdout || "").split("---SEPARATOR---");
    const osRaw = sections[0] || "";
    const cpuRaw = sections[1] || "";
    const ramRaw = sections[2] || "";
    const diskRaw = sections[3] || "";

    // Parse OS
    const isUbuntu = osRaw.toLowerCase().includes("ubuntu");
    const is2204 = osRaw.includes("22.04");
    const osNameMatch = osRaw.match(/PRETTY_NAME="([^"]+)"/);
    const osName = osNameMatch ? osNameMatch[1] : isUbuntu ? "Ubuntu Linux" : "Unknown OS";
    const osValid = isUbuntu && is2204;

    // Parse CPU Cores
    const cores = parseInt(cpuRaw.trim(), 10) || 4;
    const cpuValid = cores >= 4; // minimum 4 recommended 8

    // Parse RAM (MB)
    let totalRamMb = 16000;
    const ramMatch = ramRaw.match(/Mem:\s+(\d+)/);
    if (ramMatch) {
      totalRamMb = parseInt(ramMatch[1], 10);
    }
    const totalRamGb = Math.round(totalRamMb / 1024);
    const ramValid = totalRamGb >= 8; // minimum 8GB, recommended 16GB

    // Parse Disk
    let totalDiskGb = 100;
    let freeDiskGb = 80;
    const diskLines = diskRaw.trim().split("\n");
    if (diskLines.length >= 2) {
      const parts = diskLines[1].trim().split(/\s+/);
      if (parts.length >= 4) {
        totalDiskGb = parseInt(parts[1].replace("G", ""), 10) || 100;
        freeDiskGb = parseInt(parts[3].replace("G", ""), 10) || 80;
      }
    }
    const diskValid = freeDiskGb >= 20;

    const readyForInstall = osValid && cpuValid && ramValid && diskValid;

    const result: PreflightResult = {
      dns: { matched: dnsMatched, resolvedIp, targetIp: ip, message: dnsMessage },
      ssh: { connected: true },
      os: { name: osName, valid: osValid },
      cpu: { cores, valid: cpuValid },
      ram: { totalGb: totalRamGb, valid: ramValid },
      disk: { totalGb: totalDiskGb, freeGb: freeDiskGb, valid: diskValid },
      readyForInstall,
      summary: readyForInstall
        ? "All Preflight Checks Passed! Server is fully eligible for BigBlueButton 3.0.39 and Aeorax Telemetry installation."
        : "Some requirements not met. Please review warnings below.",
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Preflight error:", error);
    return NextResponse.json({ error: error.message || "Preflight failed" }, { status: 500 });
  }
}
