import crypto from "crypto";

export interface BBBMeetingConfig {
  meetingID: string;
  name: string;
  attendeePW: string;
  moderatorPW: string;
  record?: boolean;
  maxParticipants?: number;
  logoutURL?: string;
}

export interface BBBJoinConfig {
  meetingID: string;
  fullName: string;
  password: string;
  userID?: string;
  avatarURL?: string;
}

/**
 * Calculates official BigBlueButton API checksum
 * @param apiCall The API call name, e.g. "create", "join", "getMeetingInfo"
 * @param queryString The query parameters string without checksum
 * @param secret The BBB/Scalelite shared secret
 * @param algorithm "sha1" (standard) or "sha256"
 */
export function calculateBBBChecksum(
  apiCall: string,
  queryString: string,
  secret: string,
  algorithm: "sha1" | "sha256" = "sha1"
): string {
  const data = `${apiCall}${queryString}${secret}`;
  return crypto.createHash(algorithm).update(data).digest("hex");
}

/**
 * Validates incoming checksum from client or Moodle integration
 */
export function verifyBBBChecksum(
  apiCall: string,
  queryStringWithoutChecksum: string,
  receivedChecksum: string,
  secret: string
): boolean {
  const expectedSha1 = calculateBBBChecksum(apiCall, queryStringWithoutChecksum, secret, "sha1");
  const expectedSha256 = calculateBBBChecksum(apiCall, queryStringWithoutChecksum, secret, "sha256");
  return receivedChecksum === expectedSha1 || receivedChecksum === expectedSha256;
}

/**
 * Builds a tenant-scoped BigBlueButton meeting ID
 * Format: [college_slug]_[internal_room_id]
 */
export function buildScopedMeetingId(collegeSlug: string, roomId: string): string {
  const sanitizedSlug = collegeSlug.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();
  return `${sanitizedSlug}_${roomId}`;
}

/**
 * Parses tenant slug and room ID from a scoped meeting ID
 */
export function parseScopedMeetingId(scopedId: string): { collegeSlug: string; roomId: string } | null {
  const separatorIndex = scopedId.indexOf("_");
  if (separatorIndex === -1) return null;
  return {
    collegeSlug: scopedId.substring(0, separatorIndex),
    roomId: scopedId.substring(separatorIndex + 1),
  };
}

export interface BBBBrandingConfig {
  logo?: string;
  bannerText?: string;
  customStyleUrl?: string;
  customStyle?: string;
  defaultPresentation?: string;
}

/**
 * Builds meeting create parameters with dynamic tenant branding / white-labeling
 */
export function buildBBBMeetingParams(
  config: BBBMeetingConfig,
  branding?: BBBBrandingConfig
): URLSearchParams {
  const params = new URLSearchParams();
  params.set("meetingID", config.meetingID);
  params.set("name", config.name);
  params.set("attendeePW", config.attendeePW);
  params.set("moderatorPW", config.moderatorPW);
  if (config.record !== undefined) params.set("record", config.record ? "true" : "false");
  if (config.maxParticipants) params.set("maxParticipants", config.maxParticipants.toString());
  if (config.logoutURL) params.set("logoutURL", config.logoutURL);

  if (branding?.logo) params.set("logo", branding.logo);
  if (branding?.bannerText) params.set("bannerText", branding.bannerText);
  if (branding?.customStyleUrl) params.set("userdata-bbb_custom_style_url", branding.customStyleUrl);
  if (branding?.customStyle) params.set("userdata-bbb_custom_style", branding.customStyle);
  if (branding?.defaultPresentation) params.set("defaultPresentation", branding.defaultPresentation);

  return params;
}

