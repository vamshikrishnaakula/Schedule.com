import process from "node:process";
import slugify from "@calcom/lib/slugify";
import type { Prisma } from "@calcom/prisma/client";
import type { CalendarEvent } from "@calcom/types/Calendar";
import type { VideoCallData } from "@calcom/types/VideoApiAdapter";
import { v4 as uuidv4 } from "uuid";

type JitsiAppKeys = Prisma.JsonObject & {
  jitsiHost?: string;
  jitsiPathPattern?: string;
};

export function buildJitsiMeetingData({
  appKeys,
  eventData,
  type,
}: {
  appKeys: JitsiAppKeys;
  eventData: CalendarEvent;
  type: VideoCallData["type"];
}): VideoCallData {
  const uniqueId = uuidv4();
  const meetingPattern = appKeys.jitsiPathPattern || process.env.CALCOM_JITSI_PATH_PATTERN || "{uuid}";
  const hostUrl = appKeys.jitsiHost || process.env.CALCOM_JITSI_HOST || "https://meet.leadnest.ai/cal";

  const rawMeetingId = meetingPattern
    .replaceAll("{uuid}", uniqueId)
    .replaceAll("{Title}", eventData.title)
    .replaceAll("{Event Type Title}", eventData.type)
    .replaceAll("{Scheduler}", eventData.attendees.map((attendee) => attendee.name).join("-"))
    .replaceAll("{Organizer}", eventData.organizer.name)
    .replaceAll("{Location}", eventData.location || "")
    .replaceAll("{Team}", eventData.team?.name || "");

  const meetingId = slugify(rawMeetingId) || uniqueId;
  const normalizedHostUrl = hostUrl.replace(/\/+$/, "");

  return {
    type,
    id: meetingId,
    password: "",
    url: `${normalizedHostUrl}/${encodeURIComponent(meetingId)}`,
  };
}
