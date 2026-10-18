# Aeorax Live — Architectural Decision Records (ADRs)

---

## ADR-001: Pinned BigBlueButton Version Policy
- **Status**: ACCEPTED
- **Date**: 2026-10-18
- **Context**: BigBlueButton 3.0.39 is the stable production standard running on Ubuntu 22.04 LTS. BBB 4.0 is currently in release-candidate stage and requires Ubuntu 24.04 LTS. Deploying pre-releases into an educational production setting carries high risk of audio/video stutter, compatibility regressions, and unstable recording scripts.
- **Decision**: Pinned to **BigBlueButton 3.0.39 on Ubuntu 22.04 LTS**. BigBlueButton 4.0 is deferred to Phase 9 (Post-MVP) after it achieves stable status, upstream verification, and testing on staging clusters.
- **Consequences**: High reliability and compatibility with Moodle BBB plugins and Scalelite. Requires automated Ansible playbook targeting Ubuntu 22.04 LTS.

---

## ADR-002: Control Plane vs Meeting Plane Separation
- **Status**: ACCEPTED
- **Date**: 2026-10-18
- **Context**: Hosting BigBlueButton inside Docker containers on a shared multi-tenant VPS or behind a generic reverse proxy (like Cloudflare orange-cloud) degrades real-time WebRTC media streams, fails FreeSWITCH UDP port allocation, and causes STUN/TURN traversal failures.
- **Decision**: 
  - The **Control Plane** (Next.js panel, API gateway, PostgreSQL, Redis, Scalelite, Prometheus, Grafana) runs in Docker containers on Coolify-managed infrastructure.
  - The **Meeting Plane** runs on bare-metal or dedicated high-frequency Ubuntu 22.04 VPS nodes with direct public IPv4 addresses, DNS-Only records, and raw port exposure.
- **Consequences**: Crystal-clear separation of concerns. Media performance is completely shielded from control plane maintenance, builds, or web traffic spikes.

---

## ADR-003: Multi-Tenant BBB API Gateway & Secret Protection
- **Status**: ACCEPTED
- **Date**: 2026-10-18
- **Context**: If colleges or their Moodle instances are directly given the master Scalelite API secret, any college can create unlimited meetings, bypass quota limits, inspect other colleges' rooms, or terminate arbitrary sessions.
- **Decision**: Implement a reverse-proxy BigBlueButton API Gateway at `bbb.aeoraxlive.com`. Each college receives an isolated `api_key` and `api_secret`. The gateway intercepts all requests, validates tenant quotas atomically in Redis, prefixes meeting IDs with `[tenant_slug]`, and proxies the call to Scalelite with the master secret.
- **Consequences**: Colleges cannot bypass contracted quotas or interfere with other tenants even when using native Moodle BigBlueButton plugins.

---

## ADR-004: Dual Logical Databases with Least-Privilege Users
- **Status**: ACCEPTED
- **Date**: 2026-10-18
- **Context**: Scalelite requires PostgreSQL for its own internal node/meeting state. Running a single shared database user or mixing application tables into Scalelite's schema creates security vulnerabilities and migration collision risks. Reusing Coolify's internal database risks corrupting host orchestration.
- **Decision**: Deploy an independent PostgreSQL 16 container hosting two logical databases:
  1. `aeorax_db` (owned by user `aeorax_user`)
  2. `scalelite_db` (owned by user `scalelite_user`)
- **Consequences**: Clean separation of schemas, zero risk of table collision, independent backup/restore paths, and no dependency on Coolify's internal operational database.

---

## ADR-005: Recording Archival to Cloudflare R2 with Strict Deletion Gates
- **Status**: ACCEPTED
- **Date**: 2026-10-18
- **Context**: College recordings consume massive disk space. Keeping recordings permanently on BBB nodes or Scalelite local spool leads to full disks and catastrophic node downtime. However, deleting local files without verified archival risks permanent student data loss.
- **Decision**:
  1. Use Scalelite's verified recording import workflow.
  2. Aeorax archival worker uploads processed recording packages to private Cloudflare R2 object storage.
  3. SHA-256 integrity checksums are verified before marking status `ARCHIVED`.
  4. Local files are only deleted after: (a) verification succeeds, and (b) a configurable safety retention window (default 24–48 hours) expires.
- **Consequences**: Zero egress fees via Cloudflare R2, virtually limitless storage capacity, and bulletproof protection against accidental recording loss.

---

## ADR-006: Evolution API WhatsApp Integration with Connection Awareness
- **Status**: ACCEPTED
- **Date**: 2026-10-18
- **Context**: Automated WhatsApp alerts for server outages or critical capacity breaches are valuable for college administrators, but disconnected WhatsApp sessions can block notification loops or cause floods of stale messages upon reconnection.
- **Decision**: In-panel dashboard alerts are the primary, always-active notification channel. Evolution API WhatsApp notifications are secondary and strictly **connection-aware**. Alerts are sent only if the WhatsApp instance is verified `CONNECTED`. Delivery incorporates deduplication, 15-minute cooldowns per alert type, and drops stale alerts older than 30 minutes.
- **Consequences**: Zero UI lag, zero failed notification bottlenecks, and resilient messaging.
