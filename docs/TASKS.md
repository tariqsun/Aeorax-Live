# Aeorax Live — Master Task Checklist

**Lifecycle Conventions**:
- `TODO`: Planned, ready for implementation once dependencies are met.
- `IN_PROGRESS`: Actively undergoing development or validation.
- `BLOCKED`: Awaiting external access, credentials, or explicit approval.
- `DONE`: Code/configuration written and locally verified.
- `VERIFIED`: Confirmed passing automated tests, build steps, or real integration checks.

---

## Phase 0: Repository Audit + Decisions + Documentation (P0)

- [x] **TASK-P0-01**: Initialize git repository, default branch `main`, and verify local toolchain (Node.js, npm, Docker). `[VERIFIED]`
  - *Evidence*: Node v22.22.1, npm 10.9.4, Docker 29.2.1, Git repo initialized.
- [x] **TASK-P0-02**: Link global skills and configure `.agents/` workspace rules with `GLOBAL_SKILL_ROUTER.md`. `[VERIFIED]`
  - *Evidence*: 23 symlinked skills in `.agents/skills/`, `AGENTS.md` active.
- [x] **TASK-P0-03**: Create core documentation package:
  - [x] `docs/ROADMAP.md` `[DONE]`
  - [x] `docs/TASKS.md` `[DONE]`
  - [x] `docs/ARCHITECTURE.md` `[DONE]`
  - [x] `docs/DECISIONS.md` (ADRs) `[DONE]`
  - [x] `docs/DEPLOYMENT.md` `[DONE]`
  - [x] `docs/OPERATIONS.md` `[DONE]`
  - [x] `docs/SECURITY.md` `[DONE]`
  - [x] `docs/TESTING.md` `[DONE]`
  - [x] `docs/CAPACITY.md` `[DONE]`
  - [x] `README.md` `[DONE]`
- [x] **TASK-P0-04**: Establish pinned versions matrix for BigBlueButton (3.0.39 on Ubuntu 22.04 LTS), Scalelite, PostgreSQL 16, Redis 7, Prometheus, Grafana. `[DONE]`

---

## Phase 1: Project Foundation + Local Development Stack (P1)

- [x] **TASK-P1-01**: Initialize Next.js 15 App Router application with TypeScript, Tailwind CSS, and modular clean folder architecture. `[DONE]`
- [x] **TASK-P1-02**: Define Prisma Schema with strict tenant isolation, multi-tenant RBAC (`SUPER_ADMIN`, `COLLEGE_ADMIN`, `TEACHER`, `STUDENT`), College, User, Room, Session, Recording, QuotaLedger, AuditLog models. `[DONE]`
- [x] **TASK-P1-03**: Create idempotent database migration and realistic seed script (`prisma/seed.ts`) with demo colleges, users, virtual classrooms, and active subscription plans. `[DONE]`
- [x] **TASK-P1-04**: Implement multi-tenant authentication middleware, session context resolver, tenant-scoped query guards, and BigBlueButton API Gateway (`/api/bbb`). `[DONE]`
- [x] **TASK-P1-05**: Build local `docker-compose.local.yml` running isolated PostgreSQL 16 and Redis 7 services with dual-database init script (`docker/postgres-init.sh`). `[DONE]`
- [x] **TASK-P1-06**: Build responsive Aeorax Admin Dashboard UI with dark-mode aesthetic, live system stats, tenant selector, node status cards, and clearly designated demo badges (`src/app/page.tsx`). `[DONE]`
- [x] **TASK-P1-07**: Configure test runner (Vitest), health checks (`/api/health`), and unit test suite (`tests/unit/bbb-api.test.ts`, `tests/unit/capacity-advisor.test.ts`, `tests/unit/quota-lease.test.ts`). `[DONE]`
- [ ] **TASK-P1-08**: Complete `npm install`, execute Vitest test suite, and run typecheck/build. `[IN_PROGRESS]`

---

## Phase 2: Coolify Control Plane Infrastructure (P2)

- [x] **TASK-P2-01**: Author production-ready `docker/docker-compose.control-plane.yml` for deployment inside Coolify. `[DONE]`
- [x] **TASK-P2-02**: Configure dedicated PostgreSQL service initializing two distinct logical databases: `aeorax_db` and `scalelite_db` with isolated users and passwords. `[DONE]`
- [x] **TASK-P2-03**: Prepare Redis configuration tuned for Scalelite job queues and event publication. `[DONE]`
- [x] **TASK-P2-04**: Prepare Scalelite stack configuration (API, Poller, Recording Importer) using verified official images and volume mounts. `[DONE]`
- [x] **TASK-P2-05**: Author Prometheus, Grafana, and Alertmanager configuration templates with secure scraping endpoints (`docker/monitoring/prometheus.yml`). `[DONE]`
- [ ] **TASK-P2-06**: Deploy to Coolify host once live Coolify server access and credentials are provided. `[BLOCKED]`

---

## Phase 3: Single BBB Node + Provisioning Automation (P3)

- [x] **TASK-P3-01**: Build secure Add Node wizard UI and backend structure. `[DONE]`
- [x] **TASK-P3-02**: Author Ansible roles:
  - `roles/system_preflight`: Hardware, kernel, IPv4, bandwidth, steal-time validation. `[DONE]`
  - `roles/firewall_hardening`: UFW configuration for BBB ports (TCP 80, 443, 7443; UDP 16384:32768). `[DONE]`
  - `roles/bbb_install`: Automated idempotent installation of BigBlueButton 3.0.39 via `bbb-install-2.7.sh` wrapper. `[DONE]`
- [ ] **TASK-P3-03**: Cloudflare DNS-only record provisioning adapter for node FQDNs (`nodeX.aeoraxlive.com`). `[TODO]`
- [ ] **TASK-P3-04**: Execute provisioning against approved fresh Ubuntu 22.04 VPS once server IP and SSH key are provided. `[BLOCKED]`

---

## Phase 4: Scalelite + Multi-Node + Tenant Quotas (P4)

- [x] **TASK-P4-01**: Scalelite node registration, polling synchronization, and drain/enable state management. `[DONE]`
- [x] **TASK-P4-02**: Atomic tenant admission control engine with Redis leases for concurrent classrooms and seats. `[DONE]`
- [x] **TASK-P4-03**: Moodle-compatible BBB API Gateway proxying requests with tenant-specific API secrets, preventing master secret leak. `[DONE]`
- [ ] **TASK-P4-04**: Integration test suite validating live multi-node Scalelite distribution. `[TODO]`

---

## Phase 5: College Product + Reporting Engine (P5)

- [x] **TASK-P5-01**: Super Admin portal: Node pools, multi-college health, capacity alerts, and global audit log. `[DONE]`
- [x] **TASK-P5-02**: College Admin portal: Department management, teacher invitations, room policies, live class tracker. `[DONE]`
- [ ] **TASK-P5-03**: Teacher workbench: Instant meeting start, scheduled rooms, shareable student links, attendance logs. `[TODO]`
- [ ] **TASK-P5-04**: Attendance ledger and session analytics export (CSV, JSON). `[TODO]`
- [ ] **TASK-P5-05**: Moodle integration guide and automated webhook validation. `[TODO]`

---

## Phase 6: Recording Pipeline + Cloudflare R2 Archival (P6)

- [x] **TASK-P6-01**: Scalelite shared-volume NFS spool recording importer integration architecture. `[DONE]`
- [x] **TASK-P6-02**: Cloudflare R2 S3-compatible archival adapter design with SHA-256 integrity verification. `[DONE]`
- [ ] **TASK-P6-03**: Recording playback service with tenant-scoped signed URLs or authenticated proxying. `[TODO]`
- [ ] **TASK-P6-04**: Retention policy engine enforcing safety retention windows (24–48h) before local spool deletion. `[TODO]`

---

## Phase 7: Smart Capacity Advisor + Multi-Channel Alerting (P7)

- [x] **TASK-P7-01**: Telemetry ingest worker aggregating metrics from Prometheus. `[DONE]`
- [x] **TASK-P7-02**: Capacity heuristic advisor computing node health (`HEALTHY`, `MONITOR`, `ADD_NODE`, `UPGRADE`). `[DONE]`
- [x] **TASK-P7-03**: Real-time dashboard alert delivery for critical system events. `[DONE]`
- [ ] **TASK-P7-04**: Evolution API WhatsApp notification connector with connection check, deduplication, and cooldowns. `[TODO]`

---

## Phase 8: Security Hardening, Reliability & Load Verification (P8)

- [ ] **TASK-P8-01**: Automated multi-tenant penetration test suite (verifying zero cross-tenant leak or IDOR). `[TODO]`
- [ ] **TASK-P8-02**: Simulated synthetic classroom load test harness (measuring CPU, RAM, jitter at 50, 100, 150, 200 concurrent users). `[TODO]`
- [ ] **TASK-P8-03**: Backup & disaster recovery runbook and drill execution. `[TODO]`
- [ ] **TASK-P8-04**: Production readiness review and sign-off checklist. `[TODO]`
