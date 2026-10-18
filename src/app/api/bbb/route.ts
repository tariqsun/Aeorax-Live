import { NextRequest, NextResponse } from "next/server";
import { verifyBBBChecksum, buildScopedMeetingId } from "../../../lib/bbb-api";
import { acquireMeetingLease } from "../../../lib/quota-lease";

// Standard BBB XML Error Helper
function bbbXmlError(messageKey: string, message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <returncode>FAILED</returncode>
  <messageKey>${messageKey}</messageKey>
  <message>${message}</message>
</response>`;
}

// Standard BBB XML Success Helper
function bbbXmlSuccess(content: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <returncode>SUCCESS</returncode>
  ${content}
</response>`;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get("action") || "";
  const checksum = searchParams.get("checksum") || "";
  const apiKey = searchParams.get("apiKey") || request.headers.get("x-college-api-key") || "";

  // If no action, return base status
  if (!action) {
    return new NextResponse(
      bbbXmlSuccess(`<version>2.0</version><service>Aeorax Live BBB Gateway</service>`),
      { headers: { "Content-Type": "application/xml" } }
    );
  }

  // Handle Create Meeting
  if (action === "create") {
    const name = searchParams.get("name") || "Virtual Classroom";
    const meetingID = searchParams.get("meetingID") || "";
    const attendeePW = searchParams.get("attendeePW") || "ap";
    const moderatorPW = searchParams.get("moderatorPW") || "mp";
    const collegeSlug = searchParams.get("collegeSlug") || "demo-college";

    if (!meetingID) {
      return new NextResponse(bbbXmlError("missingParamMeetingID", "You must supply a meetingID"), {
        status: 400,
        headers: { "Content-Type": "application/xml" },
      });
    }

    // Atomic Quota Check
    // Demo limits: 5 concurrent rooms, 250 total students
    const lease = await acquireMeetingLease(collegeSlug, meetingID, 50, 5, 250);
    if (!lease.allowed) {
      return new NextResponse(bbbXmlError("quotaExceeded", lease.reason || "Quota exceeded"), {
        status: 429,
        headers: { "Content-Type": "application/xml" },
      });
    }

    const scopedMeetingId = buildScopedMeetingId(collegeSlug, meetingID);

    const xml = bbbXmlSuccess(`
  <meetingID>${meetingID}</meetingID>
  <internalMeetingID>${scopedMeetingId}</internalMeetingID>
  <parentMeetingID>bbb-none</parentMeetingID>
  <attendeePW>${attendeePW}</attendeePW>
  <moderatorPW>${moderatorPW}</moderatorPW>
  <createTime>${Date.now()}</createTime>
  <voiceBridge>70000</voiceBridge>
  <dialNumber>000-000-0000</dialNumber>
  <hasUserJoined>false</hasUserJoined>
  <duration>0</duration>
  <hasBeenForciblyEnded>false</hasBeenForciblyEnded>
`);

    return new NextResponse(xml, {
      status: 200,
      headers: { "Content-Type": "application/xml" },
    });
  }

  // Handle Get Meeting Info
  if (action === "getMeetingInfo") {
    const meetingID = searchParams.get("meetingID") || "";
    if (!meetingID) {
      return new NextResponse(bbbXmlError("missingParamMeetingID", "You must supply a meetingID"), {
        status: 400,
        headers: { "Content-Type": "application/xml" },
      });
    }

    const xml = bbbXmlSuccess(`
  <meetingName>Classroom Session</meetingName>
  <meetingID>${meetingID}</meetingID>
  <createTime>${Date.now() - 1800000}</createTime>
  <createDate>${new Date().toUTCString()}</createDate>
  <voiceBridge>70000</voiceBridge>
  <dialNumber>000-000-0000</dialNumber>
  <attendeePW>ap</attendeePW>
  <moderatorPW>mp</moderatorPW>
  <running>true</running>
  <duration>30</duration>
  <hasUserJoined>true</hasUserJoined>
  <recording>true</recording>
  <hasBeenForciblyEnded>false</hasBeenForciblyEnded>
  <startTime>${Date.now() - 1800000}</startTime>
  <endTime>0</endTime>
  <participantCount>42</participantCount>
  <listenerCount>35</listenerCount>
  <voiceParticipantCount>12</voiceParticipantCount>
  <videoCount>8</videoCount>
`);

    return new NextResponse(xml, {
      status: 200,
      headers: { "Content-Type": "application/xml" },
    });
  }

  return new NextResponse(bbbXmlError("unsupportedAction", `Action ${action} is not supported`), {
    status: 400,
    headers: { "Content-Type": "application/xml" },
  });
}
