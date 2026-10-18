import { describe, it, expect, beforeEach } from "vitest";
import { acquireMeetingLease, releaseMeetingLease } from "@/lib/quota-lease";

describe("Tenant Quota Lease Management", () => {
  const collegeId = "college_test_99";
  const maxRooms = 3;
  const maxParticipants = 150;

  it("permits meeting lease when below quota", async () => {
    const result = await acquireMeetingLease(collegeId, "room-1", 40, maxRooms, maxParticipants);
    expect(result.allowed).toBe(true);
    expect(result.currentActiveRooms).toBe(1);
    expect(result.currentParticipants).toBe(40);
  });

  it("blocks meeting creation when concurrent rooms limit reached", async () => {
    // Acquire room 2 and room 3 to reach limit of 3
    await acquireMeetingLease(collegeId, "room-2", 40, maxRooms, maxParticipants);
    await acquireMeetingLease(collegeId, "room-3", 40, maxRooms, maxParticipants);

    // 4th room must be blocked
    const result = await acquireMeetingLease(collegeId, "room-4", 20, maxRooms, maxParticipants);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Maximum concurrent rooms limit reached");
  });

  it("permits new meeting after releasing an ended meeting", async () => {
    await releaseMeetingLease(collegeId, "room-1", 40);

    const result = await acquireMeetingLease(collegeId, "room-4", 20, maxRooms, maxParticipants);
    expect(result.allowed).toBe(true);
  });
});
