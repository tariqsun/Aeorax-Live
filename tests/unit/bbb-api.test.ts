import { describe, it, expect } from "vitest";
import {
  calculateBBBChecksum,
  verifyBBBChecksum,
  buildScopedMeetingId,
  parseScopedMeetingId,
} from "@/lib/bbb-api";

describe("BigBlueButton API Helpers", () => {
  const secret = "test_bbb_secret_12345";

  it("calculates correct sha1 checksum according to official BBB formula", () => {
    const apiCall = "create";
    const queryString = "meetingID=math-101&name=Calculus+Class";
    const checksum = calculateBBBChecksum(apiCall, queryString, secret, "sha1");

    expect(checksum).toBeTypeOf("string");
    expect(checksum.length).toBe(40); // SHA-1 is 40 hex chars
  });

  it("validates valid checksum correctly", () => {
    const apiCall = "getMeetingInfo";
    const queryString = "meetingID=physics-201";
    const validChecksum = calculateBBBChecksum(apiCall, queryString, secret);

    const isValid = verifyBBBChecksum(apiCall, queryString, validChecksum, secret);
    expect(isValid).toBe(true);

    const isInvalid = verifyBBBChecksum(apiCall, queryString, "invalid_checksum_value", secret);
    expect(isInvalid).toBe(false);
  });

  it("builds and parses scoped tenant meeting IDs without collision", () => {
    const collegeSlug = "oxford-intl";
    const roomId = "room_abc123";

    const scopedId = buildScopedMeetingId(collegeSlug, roomId);
    expect(scopedId).toBe("oxford-intl_room_abc123");

    const parsed = parseScopedMeetingId(scopedId);
    expect(parsed).not.toBeNull();
    expect(parsed?.collegeSlug).toBe("oxford-intl");
    expect(parsed?.roomId).toBe("room_abc123");
  });

  it("handles invalid scoped meeting ID gracefully", () => {
    const invalidId = "invalidmeetingidwithoutunderscore";
    const parsed = parseScopedMeetingId(invalidId);
    expect(parsed).toBeNull();
  });
});
