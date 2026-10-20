# 🚀 Aeorax Live — AI Project Handoff Documentation

> **Generated for seamless transition to Codex / next AI coding agent.**  
> **Date**: October 20, 2026  
> **Repository**: `tariqsun/Aeorax-Live`  
> **Live Production URL**: [https://panel.nesthost.net](https://panel.nesthost.net)  
> **Coolify Master URL**: [https://master.nesthost.net](https://master.nesthost.net)

---

## 1. Project Overview & Architecture

**Aeorax Live** is an enterprise-grade multi-tenant control plane for **BigBlueButton** clusters. It provides:
- **Tenant Isolation**: Separate quotas, branding, and virtual classrooms per college.
- **Node & Cluster Orchestration**: Direct BigBlueButton node management, automated SSH provisioning, version checking, and telemetry monitoring.
- **Scalelite / Direct Node Load Balancing**: Seamless failover and direct node execution.
- **Recording Pipeline**: Automated Cloudflare R2 ingestion and archiving.
- **Admin Test Lab**: Direct benchmark testing for meetings without requiring third-party LMS (like Moodle).

### Technology Stack
- **Framework**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Database & ORM**: PostgreSQL via Prisma ORM (`v5.22.0`) with runtime self-healing migrations (`ensureDatabaseSchema`)
- **Cache & Quota Leases**: Redis (`ioredis`) for real-time participant concurrency
- **Remote Automation**: `ssh2` for remote command execution and BigBlueButton secret extraction
- **Object Storage**: Cloudflare R2 via `@aws-sdk/client-s3`
- **Deployment Platform**: Coolify (Docker Nixpacks/Dockerfile deployment)

---

## 2. Infrastructure & Verified Credentials

### Active BigBlueButton Servers

| Server Role | Domain / FQDN | Public IP | BigBlueButton Shared Secret | SSH Credentials | Live Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Meeting Node 1** | `node1.nesthost.net` | `13.140.140.224` | `JrenQwLngjSY7ApXWzpQvyFz36Z4oaSO7G4eJcKY` | `root` / `3840320925613` | ✅ 200 OK (Verified) |
| **Meeting Node 2** | `node2.nesthost.net` | `13.140.140.237` | `rxHrPQPEvbFtovVJqnQaCyGsLcyzAtMku9XBqmtIY` | `root` / `3840320925613` | ✅ 200 OK (Verified) |
| **Cluster (bbb)** | `bbb.nesthost.net` | `13.140.140.224` | `JrenQwLngjSY7ApXWzpQvyFz36Z4oaSO7G4eJcKY` | `root` / `3840320925613` | ✅ 200 OK (Verified) |

> ⚠️ **Critical Note on Checksums**: BigBlueButton checksums are calculated using `SHA-1` of `apiCall + queryParams + secret`. Always use each node's verified secret when constructing join or create requests.

---

## 3. Production Environment Variables (.env)

```env
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://panel.nesthost.net
NEXTAUTH_URL=https://panel.nesthost.net
NEXTAUTH_SECRET=aeorax_live_super_secret_auth_token_9988776655

# Database (Internal Coolify Docker Network)
DATABASE_URL=postgresql://postgres:Doeubva4sd8EgYtRL831gg1dp0gDW4Vx8QDqUCGr8W1xEpim3kJp3cGIitlxqtDb@nxratqxgwqkgt82e7okajk3v:5432/postgres?schema=public

# Redis Cache
REDIS_URL=redis://aeorax-redis:6379

# Cluster API Fallback
SCALELITE_API_URL=https://node1.nesthost.net/bigbluebutton/api
SCALELITE_SHARED_SECRET=JrenQwLngjSY7ApXWzpQvyFz36Z4oaSO7G4eJcKY

# Cloudflare R2 Storage for Recordings (Refer to Coolify Environment Configuration)
CLOUDFLARE_ACCOUNT_ID=442ee27fafab567aa3828a2a4ee62738
CLOUDFLARE_API_TOKEN=[CONFIGURED_IN_COOLIFY_ENV]
R2_ACCESS_KEY_ID=[CONFIGURED_IN_COOLIFY_ENV]
R2_SECRET_ACCESS_KEY=[CONFIGURED_IN_COOLIFY_ENV]
R2_ENDPOINT=https://442ee27fafab567aa3828a2a4ee62738.r2.cloudflarestorage.com
R2_BUCKET_NAME=aeorax-live
```

---

## 4. Key Endpoints & Architecture Map

### API Routes (`src/app/api/`)
- **`/api/nodes/sync-secret`** (`route.ts`):
  Automated SSH discovery engine. Connects to `ip:22` as `root` with password `3840320925613`, executes `bbb-conf --secret` and hardware diagnostics (`nproc`, `free -m`, `df -BG /`), tests the BBB API live, and persists `sharedSecret`, CPU, RAM, and version into PostgreSQL.
- **`/api/admin/test-meeting`** (`route.ts`):
  Admin direct test lab endpoint. Supports actions: `create`, `info`, `end`, and `test-pipeline`. Automatically resolves correct node-specific secrets dynamically.
- **`/api/nodes`** (`route.ts`):
  CRUD operations for cluster nodes. Returns nodes enriched with live telemetry and verified secrets.
- **`/api/rooms`** (`route.ts`):
  College virtual classroom management.
- **`/api/storage/r2`** & **`/api/recordings/ingest`**:
  Uploads, listing, and synchronization of recording assets with Cloudflare R2.
- **`/api/auth/login`** & `logout`:
  Multi-tenant authentication with Super Admin and College Admin access.

### Core Libraries (`src/lib/`)
- **`src/lib/bbb-api.ts`**:
  Contains `calculateBBBChecksum` and URL generation utilities.
- **`src/lib/prisma.ts`**:
  Prisma Client singleton with `ensureDatabaseSchema()` self-healing column additions without requiring destructive migrations.
- **`src/lib/quota-lease.ts`**:
  Atomic concurrent room and participant quota lease enforcement via Redis.

---

## 5. UI Features in `src/app/page.tsx`

1. **Cluster Management Tab**:
   - `⚡ Auto-Sync Cluster via SSH`: Triggers full cluster SSH discovery.
   - `🔄 Sync`: Per-node one-click sync button in the table actions.
   - `🧪 Test Node`: Direct shortcut to test a specific node in the Test Lab.
   - `⚡ Auto-Import Existing BBB`: In the Add Node modal, allows importing an existing server in 3 seconds without reinstalling BigBlueButton.
2. **Direct Meeting Test Lab (`testlab`)**:
   - Real-time dropdown between Scalelite, Direct Node 1, Direct Node 2, or Custom Host.
   - Generates working moderator and attendee join URLs with zero checksum errors.
   - Real-time telemetry monitoring (participants, voice, video, duration).

---

## 6. Current Git State & Running Services

- **Git Branch**: `main`
- **Latest Commit**: `f9dd1bb` (`feat: automated SSH BigBlueButton secret discovery and direct node meeting execution`)
- **Working Tree**: Clean (`git status` is clean)
- **Local Dev Server**: Can be run via `npm run dev`
- **Production Build**: Verified passing with `npm run build`
