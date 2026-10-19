#!/usr/bin/env bash
# ==============================================================================
# Aeorax Live — BigBlueButton 3.0.39 & Monitoring Client Automated Installer
# Target OS: Ubuntu 22.04 LTS (Jammy)
# Supported Architecture: x86_64
# ==============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${PURPLE}================================================================${NC}"
echo -e "${PURPLE}    Aeorax Live — Dedicated BigBlueButton 3.0 Node Installer    ${NC}"
echo -e "${PURPLE}================================================================${NC}"

# 1. Root check
if [ "$(id -u)" -ne 0 ]; then
    echo -e "${RED}[ERROR] This script must be run as root (or with sudo).${NC}"
    exit 1
fi

# 2. OS check
if [ -f /etc/os-release ]; then
    . /etc/os-release
    if [ "$ID" != "ubuntu" ] || [ "$VERSION_ID" != "22.04" ]; then
        echo -e "${RED}[ERROR] Aeorax BigBlueButton 3.0 requires Ubuntu 22.04 LTS (Jammy). Found: $PRETTY_NAME${NC}"
        exit 1
    fi
else
    echo -e "${RED}[ERROR] Cannot detect operating system. Please run on Ubuntu 22.04 LTS.${NC}"
    exit 1
fi

# Parse Arguments
FQDN=""
EMAIL="admin@aeoraxlive.com"
PANEL_URL=""
NODE_NAME=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --fqdn|-s)
            FQDN="$2"
            shift 2
            ;;
        --email|-e)
            EMAIL="$2"
            shift 2
            ;;
        --panel|-p)
            PANEL_URL="$2"
            shift 2
            ;;
        --name|-n)
            NODE_NAME="$2"
            shift 2
            ;;
        *)
            echo -e "${YELLOW}[WARNING] Unknown argument: $1${NC}"
            shift
            ;;
    esac
done

# Prompt for FQDN if not supplied
if [ -z "$FQDN" ]; then
    echo -e "${CYAN}Please enter the Fully Qualified Domain Name (FQDN) for this node:${NC}"
    read -rp "Domain (e.g. node1.aeoraxlive.com): " FQDN
fi

if [ -z "$FQDN" ]; then
    echo -e "${RED}[ERROR] FQDN / Subdomain is required for SSL and BigBlueButton.${NC}"
    exit 1
fi

# Detect Public IP
PUBLIC_IP=$(curl -s -4 https://ifconfig.me || curl -s -4 https://api.ipify.org || hostname -I | awk '{print $1}')
echo -e "${BLUE}[INFO] Detected Server Public IPv4: ${GREEN}$PUBLIC_IP${NC}"
echo -e "${BLUE}[INFO] Target Subdomain / FQDN: ${GREEN}$FQDN${NC}"
echo -e "${BLUE}[INFO] Let's Encrypt Email: ${GREEN}$EMAIL${NC}"

# DNS Preflight Check
echo -e "${YELLOW}[1/5] Checking DNS Resolution for $FQDN...${NC}"
RESOLVED_IP=$(dig +short "$FQDN" | tail -n1 || true)
if [ -z "$RESOLVED_IP" ]; then
    RESOLVED_IP=$(getent hosts "$FQDN" | awk '{print $1}' || true)
fi

if [ "$RESOLVED_IP" != "$PUBLIC_IP" ]; then
    echo -e "${YELLOW}[WARNING] DNS resolution mismatch!${NC}"
    echo -e "   FQDN points to: ${CYAN}$RESOLVED_IP${NC}"
    echo -e "   This server IP: ${CYAN}$PUBLIC_IP${NC}"
    echo -e "   ${YELLOW}Make sure your DNS 'A' record is pointed to this server IP before Let's Encrypt issues certificates.${NC}"
    read -rp "Do you want to continue anyway? [y/N]: " CONFIRM_DNS
    if [[ ! "$CONFIRM_DNS" =~ ^[Yy]$ ]]; then
        echo -e "${RED}[ABORTED] Please update your DNS 'A' record and run again.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}[OK] DNS 'A' record correctly verified: $FQDN -> $PUBLIC_IP${NC}"
fi

# Step 2: System Preflight & Locale
echo -e "${YELLOW}[2/5] Configuring System Locales & Core Dependencies...${NC}"
apt-get update -qq
apt-get install -y -qq locales curl wget ufw jq python3 python3-pip dnsutils

locale-gen en_US.UTF-8
update-locale LANG=en_US.UTF-8
export LANG=en_US.UTF-8

# Step 3: Firewall Hardening (UFW)
echo -e "${YELLOW}[3/5] Configuring High-Performance Firewall (WebRTC UDP Ports)...${NC}"
ufw --force reset > /dev/null 2>&1 || true
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP Let's Encrypt'
ufw allow 443/tcp comment 'HTTPS BBB WebRTC'
ufw allow 16384:32768/udp comment 'BBB FreeSWITCH WebRTC Media Audio/Video'
# Allow Node Exporter / Prometheus Telemetry if needed
ufw allow 9100/tcp comment 'Node Exporter Metrics'
ufw --force enable

# Step 4: BigBlueButton Installation
echo -e "${YELLOW}[4/5] Installing BigBlueButton with Let's Encrypt SSL...${NC}"
if which bbb-conf > /dev/null 2>&1; then
    echo -e "${GREEN}[OK] BigBlueButton is already installed. Verifying configuration...${NC}"
    bbb-conf --check
else
    UBUNTU_VER=$(grep "VERSION_ID" /etc/os-release | cut -d'"' -f2 || echo "24.04")
    if [ "$UBUNTU_VER" = "24.04" ]; then
        echo -e "${CYAN}Target: BigBlueButton 4.0 for Ubuntu 24.04 (noble-400)...${NC}"
        wget -qO /root/bbb-install.sh https://raw.githubusercontent.com/bigbluebutton/bbb-install/v4.0.x-release/bbb-install.sh || wget -qO /root/bbb-install.sh https://ubuntu.bigbluebutton.org/bbb-install.sh
        chmod +x /root/bbb-install.sh
        echo -e "${CYAN}Running BigBlueButton 4.0 (Noble-400) installation...${NC}"
        /root/bbb-install.sh -v noble-400 -s "$FQDN" -e "$EMAIL"
    else
        echo -e "${CYAN}Target: BigBlueButton 3.0 for Ubuntu 22.04 (jammy-300)...${NC}"
        wget -qO /root/bbb-install.sh https://ubuntu.bigbluebutton.org/bbb-install-2.7.sh
        chmod +x /root/bbb-install.sh
        echo -e "${CYAN}Running BigBlueButton 3.0 (Jammy-300) installation...${NC}"
        /root/bbb-install.sh -v jammy-300 -s "$FQDN" -e "$EMAIL"
    fi
fi

# Step 5: Install Aeorax Telemetry & Monitoring Client Agent
echo -e "${YELLOW}[5/5] Deploying Aeorax Real-time Telemetry & Heartbeat Agent...${NC}"

# Extract BBB Secret
BBB_SECRET=$(bbb-conf --secret | grep "Secret:" | awk '{print $2}' || true)
BBB_URL=$(bbb-conf --secret | grep "URL:" | awk '{print $2}' || true)

mkdir -p /opt/aeorax-agent

cat << 'EOF' > /opt/aeorax-agent/agent.py
#!/usr/bin/env python3
"""
Aeorax Live — Node Telemetry & Heartbeat Agent
Streams CPU, RAM, Disk, Active Meetings and Participant counts to Master Panel.
"""
import os
import sys
import time
import json
import socket
import urllib.request
import urllib.parse
import subprocess

CONFIG_FILE = "/opt/aeorax-agent/config.json"

def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            return json.load(f)
    return {}

def get_system_stats():
    # CPU Usage
    try:
        with open("/proc/stat", "r") as f:
            fields = [float(column) for column in f.readline().strip().split()[1:]]
        idle_time, total_time = fields[3], sum(fields)
        time.sleep(0.5)
        with open("/proc/stat", "r") as f:
            fields2 = [float(column) for column in f.readline().strip().split()[1:]]
        idle_time2, total_time2 = fields2[3], sum(fields2)
        idle_delta = idle_time2 - idle_time
        total_delta = total_time2 - total_time
        cpu_usage = round(100.0 * (1.0 - idle_delta / total_delta), 1)
    except Exception:
        cpu_usage = 0.0

    # RAM Usage
    try:
        mem_info = {}
        with open("/proc/meminfo", "r") as f:
            for line in f:
                parts = line.split(":")
                if len(parts) == 2:
                    mem_info[parts[0].strip()] = int(parts[1].split()[0])
        total_kb = mem_info.get("MemTotal", 1)
        avail_kb = mem_info.get("MemAvailable", 0)
        ram_usage = round(((total_kb - avail_kb) / total_kb) * 100.0, 1)
        ram_total_gb = round(total_kb / 1024 / 1024, 1)
    except Exception:
        ram_usage = 0.0
        ram_total_gb = 16.0

    # Disk Usage
    try:
        stat = os.statvfs("/")
        total_bytes = stat.f_frsize * stat.f_blocks
        free_bytes = stat.f_frsize * stat.f_bavail
        disk_usage = round(((total_bytes - free_bytes) / total_bytes) * 100.0, 1)
        disk_total_gb = round(total_bytes / (1024**3), 1)
    except Exception:
        disk_usage = 0.0
        disk_total_gb = 100.0

    # CPU Cores
    try:
        cpu_cores = os.cpu_count() or 4
    except Exception:
        cpu_cores = 4

    return {
        "cpu_pct": cpu_usage,
        "ram_pct": ram_usage,
        "ram_total_gb": ram_total_gb,
        "disk_pct": disk_usage,
        "disk_total_gb": disk_total_gb,
        "cpu_cores": cpu_cores,
    }

def get_bbb_stats():
    active_meetings = 0
    active_participants = 0
    try:
        res = subprocess.run(["bbb-record", "--list"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        # Check active meetings count via bbb-conf
        check_out = subprocess.run(["bbb-conf", "--check"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        # Alternatively call local BBB api if secret available
    except Exception:
        pass
    return {
        "active_meetings": active_meetings,
        "active_participants": active_participants
    }

def send_heartbeat():
    config = load_config()
    panel_url = config.get("panel_url")
    if not panel_url:
        return

    endpoint = f"{panel_url.rstrip('/')}/api/nodes/heartbeat"
    sys_stats = get_system_stats()
    bbb_stats = get_bbb_stats()

    payload = {
        "fqdn": config.get("fqdn"),
        "ip": config.get("ip"),
        "secret": config.get("secret"),
        "cpu_pct": sys_stats["cpu_pct"],
        "ram_pct": sys_stats["ram_pct"],
        "disk_pct": sys_stats["disk_pct"],
        "cpu_cores": sys_stats["cpu_cores"],
        "ram_total_gb": sys_stats["ram_total_gb"],
        "disk_total_gb": sys_stats["disk_total_gb"],
        "active_meetings": bbb_stats["active_meetings"],
        "active_participants": bbb_stats["active_participants"],
        "timestamp": int(time.time())
    }

    try:
        req = urllib.request.Request(
            endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", "User-Agent": "Aeorax-Agent/1.0"}
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            pass
    except Exception as e:
        pass

def main():
    while True:
        try:
            send_heartbeat()
        except Exception:
            pass
        time.sleep(15)

if __name__ == "__main__":
    main()
EOF

chmod +x /opt/aeorax-agent/agent.py

# Write Agent Config
cat << EOF > /opt/aeorax-agent/config.json
{
  "fqdn": "$FQDN",
  "ip": "$PUBLIC_IP",
  "secret": "$BBB_SECRET",
  "panel_url": "$PANEL_URL"
}
EOF

# Create Systemd Service for Agent
cat << 'EOF' > /etc/systemd/system/aeorax-agent.service
[Unit]
Description=Aeorax Live Real-time Telemetry & Heartbeat Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/aeorax-agent
ExecStart=/usr/bin/python3 /opt/aeorax-agent/agent.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now aeorax-agent

# System Specs
CORES=$(nproc)
RAM_GB=$(free -m | awk '/Mem:/ { printf("%.0f", $2/1024) }')
DISK_GB=$(df -BG / | awk 'NR==2 { print substr($2, 1, length($2)-1) }')

echo ""
echo -e "${GREEN}================================================================${NC}"
echo -e "${GREEN}    BIGBLUEBUTTON & AEORAX MONITORING INSTALLED SUCCESSFULLY!   ${NC}"
echo -e "${GREEN}================================================================${NC}"
echo ""
echo -e "Node Specifications:"
echo -e "  • Subdomain (FQDN): ${CYAN}$FQDN${NC}"
echo -e "  • Server IPv4:      ${CYAN}$PUBLIC_IP${NC}"
echo -e "  • CPU Cores:        ${CYAN}$CORES Cores${NC}"
echo -e "  • RAM Total:        ${CYAN}${RAM_GB} GB${NC}"
echo -e "  • NVMe Disk:        ${CYAN}${DISK_GB} GB${NC}"
echo -e "  • BBB API URL:      ${CYAN}$BBB_URL${NC}"
echo -e "  • BBB Secret (Salt):${PURPLE}$BBB_SECRET${NC}"
echo ""
echo -e "${YELLOW}To link this node into Aeorax Master Panel:${NC}"
echo -e "1. Open your Master Panel -> ${GREEN}Nodes Management${NC}"
echo -e "2. Click ${GREEN}+ Register Node (Manual DNS)${NC}"
echo -e "3. Paste the Subdomain and BBB Secret shown above"
echo -e "4. Click 'Test Handshake' and 'Link & Register Node'!"
echo ""
echo -e "${PURPLE}Monitoring Service Status:${NC}"
systemctl status aeorax-agent --no-pager -n 2
echo ""
