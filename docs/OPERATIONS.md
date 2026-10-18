# Aeorax Live — Operational Runbook & SRE Procedures

**Scope**: Production operations, maintenance, incident response, node draining, and backup recovery.  
**Reference Date**: 2026-10-18  

---

## 1. Node Lifecycle & Maintenance Operations

### A. Graceful Node Draining (Zero Classroom Disruption)
When a BigBlueButton node requires kernel updates, security patches, or maintenance:
1. In the Super Admin panel (or via CLI), switch the node status to **`DRAIN`**:
   ```bash
   # CLI equivalent in Scalelite container:
   bundle exec rake servers:drain[node-id]
   ```
2. **Behavior**:
   - Scalelite will **immediately stop routing new meetings** to this node.
   - Ongoing meetings remain active and undisturbed.
3. **Monitoring Drain Progress**:
   - Monitor active meetings on the node via panel or Grafana.
   - Once active meetings reach `0` and recording spooling has completed:
     ```bash
     # Verify no active meetings
     bbb-conf --meetings
     ```
4. **Perform Maintenance**:
   - Apply updates: `apt update && apt dist-upgrade -y`
   - Reboot if necessary: `reboot`
5. **Re-enabling Node**:
   - Run health check: `bbb-conf --check`
   - Mark node **`ACTIVE`** in panel or Scalelite:
     ```bash
     bundle exec rake servers:enable[node-id]
     ```

---

## 2. Backup & Disaster Recovery Procedures

### A. Database Backups (`aeorax_db` & `scalelite_db`)
- Automated daily logical dumps via `pg_dump`:
  ```bash
  # aeorax_db backup
  pg_dump -h localhost -U aeorax_user -d aeorax_db -F c -b -v -f /backups/aeorax_db_$(date +%Y%m%d_%H%M%S).dump

  # scalelite_db backup
  pg_dump -h localhost -U scalelite_user -d scalelite_db -F c -b -v -f /backups/scalelite_db_$(date +%Y%m%d_%H%M%S).dump
  ```
- Backups are encrypted via GPG and replicated to a separate off-site Cloudflare R2 bucket.

### B. Full Disaster Recovery (RTO < 30 mins, RPO < 1 hour)
1. Restore database container from latest dump:
   ```bash
   pg_restore -h localhost -U aeorax_user -d aeorax_db -v /backups/aeorax_db_latest.dump
   ```
2. Re-deploy Coolify Control Plane stack.
3. Redis state for active leases will self-reconcile with running meetings within 2 minutes via periodic sync worker.

---

## 3. Incident Response Playbooks

### Incident 1: BBB Node CPU Stolen / Overload (>85% sustained)
- **Symptom**: Audio stuttering, dropped WebRTC connections, Alertmanager alert fired.
- **Immediate Action**:
  1. Trigger immediate `DRAIN` on the affected node.
  2. If steal time is high (>5%), investigate VPS provider host contention.
  3. Spin up standby node or shift college routing to another node in the pool.

### Incident 2: Recording Spool Disk Full (>90%)
- **Symptom**: BBB recordings fail to process; presentation publishing hangs.
- **Immediate Action**:
  1. Inspect `/var/bigbluebutton/spool` and `/var/bigbluebutton/published`.
  2. Execute emergency sync script to force upload verified packages to R2.
  3. Purge oldest verified recordings that exceed safety retention gate (24h).
