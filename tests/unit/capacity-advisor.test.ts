import { describe, it, expect } from "vitest";
import { evaluateNodeCapacity, NodeTelemetry } from "@/lib/capacity-advisor";

describe("Smart Capacity Advisor Heuristics", () => {
  it("flags UPGRADE when CPU steal exceeds threshold (>5%)", () => {
    const telemetry: NodeTelemetry = {
      nodeId: "node-1",
      nodeName: "Node 1",
      cpuUsagePercent: 50.0,
      cpuStealPercent: 6.2,
      memoryUsagePercent: 40.0,
      activeMeetings: 5,
      activeParticipants: 100,
      activeWebcams: 20,
      diskUsagePercent: 30.0,
    };

    const evaluation = evaluateNodeCapacity(telemetry);
    expect(evaluation.status).toBe("UPGRADE");
    expect(evaluation.bottleneck).toContain("Steal");
  });

  it("flags ADD_NODE when CPU is saturated (>=85%)", () => {
    const telemetry: NodeTelemetry = {
      nodeId: "node-2",
      nodeName: "Node 2",
      cpuUsagePercent: 88.5,
      cpuStealPercent: 0.2,
      memoryUsagePercent: 60.0,
      activeMeetings: 12,
      activeParticipants: 350,
      activeWebcams: 80,
      diskUsagePercent: 45.0,
    };

    const evaluation = evaluateNodeCapacity(telemetry);
    expect(evaluation.status).toBe("ADD_NODE");
    expect(evaluation.bottleneck).toContain("CPU Saturation");
  });

  it("flags MONITOR when approaching thresholds (75-84% CPU)", () => {
    const telemetry: NodeTelemetry = {
      nodeId: "node-3",
      nodeName: "Node 3",
      cpuUsagePercent: 78.0,
      cpuStealPercent: 0.1,
      memoryUsagePercent: 50.0,
      activeMeetings: 8,
      activeParticipants: 200,
      activeWebcams: 40,
      diskUsagePercent: 50.0,
    };

    const evaluation = evaluateNodeCapacity(telemetry);
    expect(evaluation.status).toBe("MONITOR");
  });

  it("returns HEALTHY when all metrics are nominal", () => {
    const telemetry: NodeTelemetry = {
      nodeId: "node-4",
      nodeName: "Node 4",
      cpuUsagePercent: 42.0,
      cpuStealPercent: 0.1,
      memoryUsagePercent: 38.0,
      activeMeetings: 4,
      activeParticipants: 120,
      activeWebcams: 15,
      diskUsagePercent: 35.0,
    };

    const evaluation = evaluateNodeCapacity(telemetry);
    expect(evaluation.status).toBe("HEALTHY");
    expect(evaluation.score).toBeGreaterThanOrEqual(90);
  });
});
