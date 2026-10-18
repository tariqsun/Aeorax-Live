# Aeorax Live — Security & Compliance Architecture

**Scope**: Multi-tenant security, data protection, secret management, threat model, and RBAC matrix.  
**Reference Date**: 2026-10-18  

---

## 1. Threat Model & Mitigations (STRIDE Matrix)

| Threat Category | Specific Attack Vector | Aeorax Live Defense & Mitigation |
| :--- | :--- | :--- |
| **Spoofing** | Forged student join request or fake teacher token. | HMAC-SHA256 signed join URLs with short expiration window (5 minutes); session tokens validated server-side. |
| **Tampering** | Altering quota parameters or meeting parameters via Moodle API. | API Gateway strictly validates incoming checksums against stored tenant secret; rejects altered payload parameters. |
| **Repudiation** | Denying creation/deletion of rooms or modification of quotas. | Comprehensive immutable `AuditLog` table records actor, action, tenant, IP address, and payload diffs. |
| **Information Disclosure** | IDOR (Insecure Direct Object Reference) allowing College A to view College B's rooms, recordings, or users. | Prisma client middleware and service layer enforce tenant query filters (`where: { collegeId }`) on every operation. Automated penetration tests verify isolation. |
| **Denial of Service** | Flooding meeting creation or exhausting video bandwidth beyond subscription plan. | Redis atomic quota leases restrict concurrent rooms and seats; Cloudflare rate limits protect web endpoints; FreeSWITCH limits max participants per room. |
| **Elevation of Privilege** | Student or Teacher accessing College Admin or Super Admin functionality. | Strict server-side RBAC enforced in Next.js Server Components, Server Actions, and API Route Handlers. |

---

## 2. Role-Based Access Control (RBAC) Matrix

| Permission / Action | `SUPER_ADMIN` | `COLLEGE_ADMIN` | `TEACHER` | `STUDENT` |
| :--- | :---: | :---: | :---: | :---: |
| View Global Server Fleet & Node Metrics | ✅ | ❌ | ❌ | ❌ |
| Add / Drain / Remove BBB Servers | ✅ | ❌ | ❌ | ❌ |
| Configure College Subscriptions & Quotas | ✅ | ❌ | ❌ | ❌ |
| Manage College Staff & Departments | ✅ | ✅ (Own College) | ❌ | ❌ |
| View College Live Meeting Sessions | ✅ | ✅ (Own College) | ❌ | ❌ |
| Create Virtual Classroom Definitions | ✅ | ✅ (Own College) | ✅ (Assigned) | ❌ |
| Launch / End Classroom Meeting | ✅ | ✅ (Own College) | ✅ (Assigned) | ❌ |
| Generate Student Join Link | ✅ | ✅ (Own College) | ✅ (Assigned) | ❌ |
| Join Meeting via Authorized Link | ✅ | ✅ | ✅ | ✅ |
| Access Published Class Recordings | ✅ | ✅ (Own College) | ✅ (Own Classes) | ✅ (Permitted) |
| Download Attendance & Analytics | ✅ | ✅ (Own College) | ✅ (Own Classes) | ❌ |

---

## 3. Secret Management & Key Hygiene Rules

1. **Zero Plaintext Secrets in Code**: No passwords, database URIs, SSH private keys, BBB secrets, or R2 tokens committed to Git.
2. **Master Scalelite Secret Insulation**: The master Scalelite API secret is stored securely in environment variables for the API Gateway and is NEVER exposed to college admins, teachers, or LMS plugins.
3. **Short-Lived Join Tokens**: When a student or teacher requests access to a room, the system generates a signed join URL valid for a maximum of 300 seconds.
4. **SSH Key Encryption**: If the provisioning worker stores temporary SSH keys to configure VPS instances, they are held in memory or transient encrypted files, and decommissioned immediately upon completion of the provisioning pipeline.
