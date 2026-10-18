# Aeorax Live — System Architecture

**Platform**: Aeorax Live  
**Target Domain**: `aeoraxlive.com` (Control: `panel.aeoraxlive.com`, Gateway: `bbb.aeoraxlive.com`, Nodes: `nodeX.aeoraxlive.com`)  
**Architecture Date**: 2026-10-18  

---

## 1. System Topology Overview

Aeorax Live decouples the **Control Plane** (multi-tenant management, quotas, orchestration, API gateway, telemetry) from the **Meeting Plane** (dedicated Linux bare-metal or high-performance VPS nodes running BigBlueButton):

```mermaid
flowchart TB
    subgraph Clients["Clients & Consumers"]
        SA[Super Admin]
        CA[College Admin / Teachers]
        ST[Students / Participants]
        MD[Moodle / External LMS]
    end

    subgraph Edge["DNS & Ingress Layer"]
        CF_PANEL[Cloudflare Proxied: panel.aeoraxlive.com]
        CF_GATEWAY[Cloudflare Proxied: bbb.aeoraxlive.com]
        CF_NODES[Cloudflare DNS-Only: node1..nodeN.aeoraxlive.com]
    end

    subgraph ControlPlane["Control Plane (Coolify / Docker Host)"]
        APP[Aeorax Live Next.js Web App & API]
        GW[Aeorax BBB API Gateway & Quota Enforcer]
        WORKER[Background Provisioning & Telemetry Worker]
        SCALELITE[Scalelite API + Poller + Recording Importer]
        REDIS[(Redis 7 - Leases & Scalelite)]
        PG[(PostgreSQL 16: aeorax_db + scalelite_db)]
        PROM[Prometheus + Alertmanager]
        GRAF[Grafana Dashboards]
    end

    subgraph MeetingPlane["Meeting Plane (Dedicated Ubuntu 22.04 VPS)"]
        NODE1[BBB Node 1: bbb-core + WebRTC + Exporters]
        NODE2[BBB Node 2: bbb-core + WebRTC + Exporters]
    end

    subgraph StorageArchive["Long-term Storage"]
        R2[(Cloudflare R2 Object Storage - Recordings)]
    end

    subgraph ExternalAlerts["External Integrations"]
        EVO[Evolution API - WhatsApp Notifications]
    end

    SA --> CF_PANEL --> APP
    CA --> CF_PANEL --> APP
    MD --> CF_GATEWAY --> GW
    GW -->|Validate Tenant Quotas & Authenticate| SCALELITE
    GW -->|Audit & Usage Logs| APP
    APP --> PG
    APP --> REDIS
    WORKER --> PG
    WORKER --> REDIS
    SCALELITE -->|Direct Dispatch| NODE1
    SCALELITE -->|Direct Dispatch| NODE2
    ST --> CF_NODES --> NODE1
    ST --> CF_NODES --> NODE2
    NODE1 -->|Export Metrics| PROM
    NODE2 -->|Export Metrics| PROM
    PROM --> GRAF
    PROM --> APP
    NODE1 -->|Spool Recordings| SCALELITE
    NODE2 -->|Spool Recordings| SCALELITE
    SCALELITE -->|Archive Verified Recordings| R2
    APP -->|Alert Signals| EVO
```

---

## 2. Component Boundaries & Responsibilities

### A. Aeorax Control Plane App & API Gateway
- **Stack**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Prisma ORM.
- **Tenant Isolation**: Every database entity (User, Room, Session, Recording, Quota) strictly references `collegeId`. Every query enforces tenant boundary verification.
- **Quota Engine**: Real-time atomic reservations in Redis. When a meeting creation request arrives (via panel or Moodle), the gateway checks:
  1. Active concurrent meetings for college < `maxConcurrentRooms`.
  2. Room participant limit < `maxParticipantsPerRoom`.
  3. Total active participants across college < `maxTotalParticipants`.
- **Moodle Compatible Gateway (`bbb.aeoraxlive.com`)**:
  - Exposes standard BigBlueButton API (`/bigbluebutton/api/*`).
  - Moodle connects with college-specific credentials (tenant API key & secret).
  - Gateway validates tenant secret, acquires tenant quota lease, rewrites meeting ID with tenant prefix (`[college_slug]_[room_id]`), and proxies downstream to Scalelite with the master secret.
  - Master Scalelite secret is NEVER exposed to colleges or LMS integrations.

### B. Meeting Plane (BigBlueButton Nodes)
- **OS**: Ubuntu 22.04 LTS (Jammy Jellyfish).
- **BBB Version**: 3.0.39 (Official stable release).
- **Network Requirements**:
  - Dedicated public IPv4 address.
  - DNS-only record (no Cloudflare proxy) to prevent WebRTC UDP stream degradation and WebSocket termination issues.
  - Inbound ports: TCP 80, 443; UDP 16384–32768 (RTP/WebRTC audio & video).
- **Node Exporters**:
  - Prometheus `node_exporter` (system metrics: CPU, memory, network, I/O, steal time).
  - `bigbluebutton-exporter` (BBB internal metrics: voice users, video users, listeners, moderators, active rooms). Scrape endpoints restricted via IP firewall / basic auth.

### C. Scalelite Load Balancer & Meeting Router
- **Role**: Dispatches meeting creation requests across pool of active BBB nodes.
- **Meeting Affinity**: Scalelite routes users to the node where the meeting was initially spawned. It does NOT migrate meetings in-flight.
- **Drain Protocol**: When a node is flagged `DRAIN`, Scalelite halts sending *new* meetings to it, allowing ongoing classes to conclude gracefully before maintenance.

### D. Recording Lifecycle & Cloudflare R2
- **Step 1 (Raw Capture)**: Meeting recorded locally on BBB node.
- **Step 2 (Processing)**: BBB internal scripts process and publish presentation format.
- **Step 3 (Scalelite Import)**: Scalelite recording importer copies finished recordings to shared spool.
- **Step 4 (R2 Archival)**: Aeorax background worker archives processed recording packages to private Cloudflare R2 bucket with checksum verification.
- **Step 5 (Playback)**: Authorized users stream recordings via signed short-lived URLs or authenticated proxy.
- **Step 6 (Safe Pruning)**: Local recordings on BBB nodes and Scalelite spool are purged ONLY after:
  - Archival verification passes (SHA-256 matches).
  - Configurable safety retention gate (default 24–48 hours) has expired.

---

## 3. Database Architecture (Prisma + PostgreSQL)

Two distinct logical databases reside on the PostgreSQL 16 cluster:
1. `aeorax_db`: College tenancy, user accounts, roles, virtual rooms, quota ledgers, audit events, telemetry snapshots, alerting configurations.
2. `scalelite_db`: Scalelite internal schema (managed by Scalelite Rails migrations).

Least-privilege database users:
- `aeorax_user` has read/write privileges exclusively on `aeorax_db`.
- `scalelite_user` has read/write privileges exclusively on `scalelite_db`.
