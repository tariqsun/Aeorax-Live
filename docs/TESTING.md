# Aeorax Live — Testing Strategy & Verification Protocol

**Scope**: Unit testing, multi-tenant isolation testing, synthetic load verification, and CI/CD validation.  
**Reference Date**: 2026-10-18  

---

## 1. Test Pyramid & Automation Levels

```
               /  E2E Multi-Tenant Flow  \
              /   (Join/Record/Archive)    \
             /------------------------------\
            /    API Quota & RBAC Contracts   \
           /     (Moodle Gateway & Leases)     \
          /--------------------------------------\
         /      Prisma Tenant Isolation Tests      \
        /--------------------------------------------\
       /        Unit Tests: Validators, Hashing,       \
      /         Checksums & Capacity Heuristics         \
     /----------------------------------------------------\
```

---

## 2. Test Suites Overview

### A. Unit Tests (`tests/unit/`)
- **Checksum Calculation**: BigBlueButton SHA-1/SHA-256 API checksum generators and validators.
- **Tenant Key Parsing**: Correct slug extraction, room parameter validation.
- **Capacity Advisor Heuristics**: Deterministic tests validating that sustained >85% CPU for 10 minutes returns `CRITICAL` recommendation `ADD_NODE`.
- **R2 Storage Path Keys**: Format verification for recording archive keys (`recordings/[college_id]/[meeting_id]/...`).

### B. Multi-Tenant Isolation Tests (`tests/tenant-isolation/`)
- **Cross-Tenant IDOR Test**: Attempt to fetch, update, or delete College A's room using College B's authenticated session. Assert HTTP `403 Forbidden` or `404 Not Found`.
- **Quota Leak Test**: Simulate 10 simultaneous meeting creation requests when tenant quota is 2. Ensure exactly 2 succeed and 8 fail with HTTP `429 Too Many Requests`.
- **Moodle Gateway Secret Isolation**: Attempt to invoke BigBlueButton API using master Scalelite secret directly on tenant endpoint. Ensure request is rejected.

### C. Synthetic Load Testing (`tests/load/`)
- Harness using ethical simulated clients generating real WebRTC audio/video feeds.
- **Tier 1 (50 Concurrent Users)**: 1 room with 50 students, 10 active webcams. Measure CPU, RAM, and WebRTC RTT jitter.
- **Tier 2 (100 Concurrent Users)**: 2 rooms with 50 students each, 20 total webcams.
- **Tier 3 (150 Concurrent Users)**: 3 rooms with 50 students each, distributed across nodes.
- **Tier 4 (200 Concurrent Users)**: Target stress ceiling. Measure audio packet loss, CPU steal time, and memory consumption.
