# Aeorax Live — Master Roadmap

**System**: Aeorax Live  
**Role**: Multi-Tenant Managed BigBlueButton (BBB) Cloud Hosting Platform for Colleges  
**Reference Date**: 2026-10-18  
**Architecture Paradigm**: Control Plane (Next.js + Prisma + PostgreSQL + Redis + Scalelite) + Meeting Plane (Dedicated Ubuntu VPS nodes running official BigBlueButton 3.0.x) + Long-term Storage (Cloudflare R2).

---

## High-Level Vision & Operating Model

Aeorax Live transforms raw BigBlueButton nodes into a turnkey SaaS platform for educational institutions. Instead of managing raw Linux VPS instances, colleges purchase structured capacity tiers (concurrent classrooms, student seats, storage limits). 

- **Tenant Isolation**: Strict logical multi-tenancy at database, API, quota, and room routing levels.
- **Quota & Admission Control**: Atomic server-side leases prevent exceeding contracted limits across all entry pathways (direct, Moodle, portal).
- **Control vs Media Decoupling**: Centralized control plane hosted via Coolify/Docker; raw WebRTC media streams run strictly on dedicated Ubuntu VPS nodes with public IPv4.
- **Recording Lifecycle**: Recorded locally on BBB, processed, imported through Scalelite shared spool, archived with verified integrity to Cloudflare R2, and safely pruned only after retention gates pass.

---

## Phase Matrix

| Phase | Title | Priority | Target Scope | Status |
| :--- | :--- | :--- | :--- | :--- |
| **P0** | **Repository Audit + Decisions + Documentation** | `MUST` | Baseline architecture, threat model, ADRs, task tracking, pinned software versions, boundary definitions. | **DONE** |
| **P1** | **Project Foundation + Local Development Stack** | `MUST` | Next.js 15 App Router, TypeScript, Tailwind CSS, Prisma ORM, PostgreSQL schema, tenant isolation, RBAC, seed data, local Docker Compose, health endpoints, test runner. | **IN_PROGRESS** |
| **P2** | **Coolify Control Plane Infrastructure** | `MUST` | Production Docker Compose definitions for Aeorax App, Redis, PostgreSQL (aeorax_db + scalelite_db), Scalelite (API, Poller, Importer), Prometheus, Grafana, Alertmanager. | **TODO** |
| **P3** | **Single BBB Node + Provisioning Automation** | `MUST` | Ansible automation for Ubuntu 22.04 LTS, BBB 3.0.39 stable installer, Node Exporter, BBB Prometheus exporter, firewall rules, health checks, Cloudflare DNS-only record provisioning. | **TODO** |
| **P4** | **Scalelite + Multi-Node + Tenant Quotas** | `MUST` | Node pool management, Scalelite node registration/drain, atomic quota leases, Moodle-compatible authenticated proxy gateway, multi-node failover testing. | **TODO** |
| **P5** | **College Product + Reporting Engine** | `MUST` | Super Admin & College Admin portals, Teacher workbench, reusable virtual rooms, attendance/session audit ledger, student join tokens, Moodle LTI/API validation. | **TODO** |
| **P6** | **Recording Pipeline + Cloudflare R2 Archival** | `MUST` | Scalelite recording spool ingestion, R2 S3-compatible archival adapter, playback asset verification, retention policy scheduler, safe local deletion gates. | **TODO** |
| **P7** | **Smart Capacity Advisor + Multi-Channel Alerting** | `MUST` | Prometheus scraping, custom capacity heuristics (active meetings/cams/CPU/RTT), Grafana dashboards, Evolution API WhatsApp connector (status-aware, deduplicated). | **TODO** |
| **P8** | **Security Hardening, Reliability & Load Verification** | `MUST` | Pre-flight security audit, synthetic load benchmarks (50–200 concurrent seats with webcams), backup/restore drills, operational SLO runbooks, production launch checklist. | **TODO** |
| **P9** | **Future Enhancements (Post-MVP)** | `LATER` | BigBlueButton 4.0 LTS migration, AI lecture summaries/transcripts, payment gateway auto-billing, enterprise SSO (SAML/OAuth2), automated VPS autoscaling. | **TODO** |
