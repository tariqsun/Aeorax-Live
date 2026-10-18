# Aeorax Live — Deployment Guide

**Target Environment**: Coolify (Control Plane) + Dedicated Ubuntu 22.04 LTS (Meeting Plane)  
**Reference Date**: 2026-10-18  

---

## 1. Domain & DNS Configuration (Cloudflare)

| Hostname | Record Type | Target / Content | Cloudflare Proxy Status | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `panel.aeoraxlive.com` | `A` | Coolify Host IP | **Proxied (Orange Cloud)** | Super Admin & College Web UI |
| `bbb.aeoraxlive.com` | `A` | Coolify Host IP | **Proxied (Orange Cloud)** | Multi-tenant BBB API Gateway |
| `node1.aeoraxlive.com` | `A` | Dedicated VPS 1 IPv4 | **DNS Only (Grey Cloud)** | BigBlueButton Node 1 WebRTC |
| `node2.aeoraxlive.com` | `A` | Dedicated VPS 2 IPv4 | **DNS Only (Grey Cloud)** | BigBlueButton Node 2 WebRTC |

> [!CRITICAL]
> All BBB meeting nodes MUST be configured as **DNS Only** (Grey Cloud) in Cloudflare. Proxied mode terminates WebRTC UDP packets and blocks FreeSWITCH media ports, preventing audio/video streams from functioning.

---

## 2. Control Plane (Coolify Stack)

### Services Breakdown:
1. **`aeorax-web`**: Next.js 15 App running web dashboard & API routes.
2. **`aeorax-worker`**: Background queue worker for node provisioning, capacity analysis, and R2 recording sync.
3. **`postgres`**: PostgreSQL 16 image managing `aeorax_db` and `scalelite_db`.
4. **`redis`**: Redis 7 image with persistent AOF, used for Scalelite queues and atomic tenant quota leases.
5. **`scalelite-api`**: Official Scalelite Rails API image for BigBlueButton load balancing.
6. **`scalelite-poller`**: Periodic status poller discovering BBB node health.
7. **`scalelite-recording-importer`**: Worker ingesting published recordings.
8. **`prometheus` + `grafana` + `alertmanager`**: Telemetry and monitoring.

### Required Environment Secrets Template:
```bash
# Database Secrets
POSTGRES_USER=postgres
POSTGRES_PASSWORD=replace_with_strong_random_password
AEORAX_DB_NAME=aeorax_db
AEORAX_DB_USER=aeorax_user
AEORAX_DB_PASSWORD=replace_with_strong_random_password
SCALELITE_DB_NAME=scalelite_db
SCALELITE_DB_USER=scalelite_user
SCALELITE_DB_PASSWORD=replace_with_strong_random_password

# Redis
REDIS_PASSWORD=replace_with_strong_random_password

# Scalelite Core
SCALELITE_TAG=v1.4.0
SCALELITE_SECRET_KEY_BASE=generate_with_rake_secret_or_openssl_rand_hex_64
LOADBALANCER_SECRET=generate_strong_alphanumeric_secret

# Aeorax Auth
NEXTAUTH_SECRET=generate_strong_alphanumeric_secret
NEXTAUTH_URL=https://panel.aeoraxlive.com

# Cloudflare R2 Storage (Recordings)
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=aeorax-recordings
R2_PUBLIC_DOMAIN=recordings.aeoraxlive.com

# Evolution API WhatsApp (Optional)
EVOLUTION_API_URL=https://whatsapp.yourdomain.com
EVOLUTION_API_KEY=your_evolution_key
EVOLUTION_INSTANCE_NAME=aeorax_alerts
```

---

## 3. Meeting Plane (BBB Dedicated VPS Node)

### Node Hardware Specifications (Minimum Recommended):
- **CPU**: 8 Dedicated vCores (AMD EPYC or Intel Xeon, high clock speed, steal time < 1%)
- **RAM**: 16 GB to 32 GB ECC RAM
- **Disk**: 100 GB NVMe SSD (fast I/O for raw audio/video presentation rendering)
- **Bandwidth**: 1 Gbps port with unmetered or high data transfer cap
- **OS**: Fresh Ubuntu 22.04 LTS x64 (Clean, zero conflicting web services)

### Automated Provisioning Pipeline:
1. Super Admin inputs node IPv4, SSH port, and temporary root SSH key into Aeorax Admin Panel.
2. Background worker executes Ansible preflight checks:
   - Validates Ubuntu 22.04 LTS version.
   - Verifies CPU cores, memory, disk headroom, and low steal time.
   - Checks DNS record matches target IP.
3. Ansible configures UFW firewall:
   - Allow TCP 22 (SSH), TCP 80 (HTTP), TCP 443 (HTTPS), TCP 7443.
   - Allow UDP 16384:32768 (WebRTC audio/video).
4. Ansible runs official BigBlueButton installer:
   ```bash
   wget -qO- https://ubuntu.bigbluebutton.org/bbb-install-2.7.sh | bash -s -- \
     -v jammy-300 \
     -s node1.aeoraxlive.com \
     -e admin@aeoraxlive.com \
     -g
   ```
5. Ansible installs and secures `node_exporter` and `bigbluebutton-exporter`.
6. Node registers automatically into Scalelite pool using its unique secret.
7. Aeorax runs synthetic meeting creation test. Upon success, node state switches from `PROVISIONING` to `READY`.
