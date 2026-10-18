export type CapacityStatus = "HEALTHY" | "MONITOR" | "ADD_NODE" | "UPGRADE";

export interface NodeTelemetry {
  nodeId: string;
  nodeName: string;
  cpuUsagePercent: number;
  cpuStealPercent: number;
  memoryUsagePercent: number;
  activeMeetings: number;
  activeParticipants: number;
  activeWebcams: number;
  diskUsagePercent: number;
}

export interface CapacityEvaluation {
  status: CapacityStatus;
  score: number; // 0 to 100
  bottleneck?: string;
  evidence: string;
  actionRequired: string;
}

/**
 * Evaluates node capacity and provides SRE recommendations
 */
export function evaluateNodeCapacity(telemetry: NodeTelemetry): CapacityEvaluation {
  // 1. Critical Check: High Steal Time indicates VPS host contention
  if (telemetry.cpuStealPercent > 5.0) {
    return {
      status: "UPGRADE",
      score: 30,
      bottleneck: "Host Contention (CPU Steal)",
      evidence: `CPU Steal time is ${telemetry.cpuStealPercent.toFixed(1)}% (>5.0% threshold). The VPS host is oversubscribed.`,
      actionRequired: "Migrate or upgrade to dedicated bare-metal/isolated vCPU node.",
    };
  }

  // 2. Critical Check: High Sustained CPU
  if (telemetry.cpuUsagePercent >= 85.0) {
    return {
      status: "ADD_NODE",
      score: 25,
      bottleneck: "CPU Saturation",
      evidence: `Node CPU is critical at ${telemetry.cpuUsagePercent.toFixed(1)}% with ${telemetry.activeWebcams} active webcams across ${telemetry.activeMeetings} meetings.`,
      actionRequired: "Drain node and add new BigBlueButton node to the pool.",
    };
  }

  // 3. Disk Full Warning (spool & recordings)
  if (telemetry.diskUsagePercent >= 85.0) {
    return {
      status: "MONITOR",
      score: 45,
      bottleneck: "Disk Utilization",
      evidence: `Disk storage at ${telemetry.diskUsagePercent.toFixed(1)}%. Risk of recording pipeline failure.`,
      actionRequired: "Force R2 sync and purge verified local recordings older than 24 hours.",
    };
  }

  // 4. Warning: Approaching Peak Capacity
  if (telemetry.cpuUsagePercent >= 75.0 || telemetry.memoryUsagePercent >= 80.0) {
    return {
      status: "MONITOR",
      score: 65,
      bottleneck: "High Utilization",
      evidence: `CPU at ${telemetry.cpuUsagePercent.toFixed(1)}%, RAM at ${telemetry.memoryUsagePercent.toFixed(1)}%.`,
      actionRequired: "Monitor active meetings. Prepare next node in pool if classes increase.",
    };
  }

  // 5. Healthy State
  return {
    status: "HEALTHY",
    score: 95,
    evidence: `Nominal operation. CPU: ${telemetry.cpuUsagePercent.toFixed(1)}%, RAM: ${telemetry.memoryUsagePercent.toFixed(1)}%, Active Meetings: ${telemetry.activeMeetings}, Active Webcams: ${telemetry.activeWebcams}.`,
    actionRequired: "No action required.",
  };
}
