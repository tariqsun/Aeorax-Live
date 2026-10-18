# Aeorax Live 🎓

**Multi-Tenant Managed BigBlueButton (BBB) Cloud Hosting Platform for Colleges & Universities.**

Aeorax Live provides educational institutions with a high-performance, turnkey virtual classroom solution. Instead of managing complex Linux media servers, colleges purchase managed concurrency quotas with seamless Moodle integration, automated recording archival to Cloudflare R2, and real-time telemetry.

---

## 🚀 Key Architecture Highlights

- **Control Plane**: Modern Next.js 15 App Router, TypeScript, Tailwind CSS, Prisma ORM, PostgreSQL 16 (`aeorax_db` + `scalelite_db`), Redis 7, Scalelite load balancer, Prometheus & Grafana. Hosted on Coolify.
- **Meeting Plane**: Dedicated high-frequency Ubuntu 22.04 LTS VPS nodes running official, pinned **BigBlueButton 3.0.39**, configured via idempotent Ansible automation with direct public IPv4 and Cloudflare DNS-Only records.
- **Moodle Quota Gateway**: Authenticated reverse-proxy exposing standard BigBlueButton API to Moodle LMS with tenant-specific API secrets, preventing master secret leakage and atomically enforcing contracted concurrent classroom and seat quotas.
- **Recording Lifecycle**: Spooled via Scalelite shared volume, archived to Cloudflare R2 object storage with SHA-256 verification, and safely pruned from local disks only after a verified retention window (24–48h).
- **Smart Capacity Advisor**: Automated telemetry analysis providing predictive `HEALTHY`, `MONITOR`, `ADD_NODE`, or `UPGRADE` recommendations.
- **Multi-Channel Alerts**: Real-time web panel notifications + optional connection-aware Evolution API WhatsApp alerts.

---

## 📂 Documentation Directory

| Document | Description |
| :--- | :--- |
| [docs/ROADMAP.md](file:///Users/Shared/Dev_Projects/Aeorax-Live/docs/ROADMAP.md) | Master phase-by-phase roadmap (P0 through P9) |
| [docs/TASKS.md](file:///Users/Shared/Dev_Projects/Aeorax-Live/docs/TASKS.md) | Actionable task checklist with statuses (`TODO`, `IN_PROGRESS`, `DONE`, `VERIFIED`) |
| [docs/ARCHITECTURE.md](file:///Users/Shared/Dev_Projects/Aeorax-Live/docs/ARCHITECTURE.md) | Complete topology diagrams, service boundaries, and data flow |
| [docs/DECISIONS.md](file:///Users/Shared/Dev_Projects/Aeorax-Live/docs/DECISIONS.md) | Architectural Decision Records (ADRs) |
| [docs/DEPLOYMENT.md](file:///Users/Shared/Dev_Projects/Aeorax-Live/docs/DEPLOYMENT.md) | Coolify control plane and Ansible BBB node deployment guides |
| [docs/OPERATIONS.md](file:///Users/Shared/Dev_Projects/Aeorax-Live/docs/OPERATIONS.md) | SRE runbooks: node draining, maintenance, backups, and disaster recovery |
| [docs/SECURITY.md](file:///Users/Shared/Dev_Projects/Aeorax-Live/docs/SECURITY.md) | Threat model (STRIDE), RBAC matrix, and secret management |
| [docs/TESTING.md](file:///Users/Shared/Dev_Projects/Aeorax-Live/docs/TESTING.md) | Test pyramid, multi-tenant isolation verification, and synthetic load tests |
| [docs/CAPACITY.md](file:///Users/Shared/Dev_Projects/Aeorax-Live/docs/CAPACITY.md) | BigBlueButton sizing formulas, video stream math, and capacity heuristics |

---

## 🛠️ Quick Start (Local Development)

### 1. Prerequisites
- Node.js >= 20.x (v22.x recommended)
- Docker & Docker Compose
- PostgreSQL 16 & Redis 7 (or run via provided `docker-compose.local.yml`)

### 2. Setup & Installation
```bash
# Clone and enter workspace
cd /Users/Shared/Dev_Projects/Aeorax-Live

# Install dependencies
npm install

# Start local backing services (PostgreSQL + Redis)
docker compose -f docker-compose.local.yml up -d

# Run database migrations and seed realistic demo colleges & rooms
npx prisma migrate dev --name init
npm run db:seed

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the Aeorax Live Dashboard.

---

## 🔒 License & Copyright
Aeorax Live © 2026. All rights reserved.
