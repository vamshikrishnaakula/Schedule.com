import type { CalendarEvent } from "@calcom/types/Calendar";
import { describe, expect, it } from "vitest";

import VideoApiAdapter, { buildLeadnestMeetingUrl } from "./VideoApiAdapter";

const baseCalendarEvent: CalendarEvent = {
  uid: "booking-uid-123",
  type: "15min",
  title: "Leadnest demo",
  startTime: "2026-03-23T10:00:00.000Z",
  endTime: "2026-03-23T10:15:00.000Z",
  organizer: {
    name: "Host",
    email: "host@example.com",
    timeZone: "UTC",
    language: { translate: ((key: string) => key) as never, locale: "en" },
  },
  attendees: [
    {
      name: "Guest",
      email: "guest@example.com",
      timeZone: "UTC",
      language: { translate: ((key: string) => key) as never, locale: "en" },
    },
  ],
};

describe("Leadnest VideoApiAdapter", () => {
  it("creates a meeting url from the booking uid", async () => {
    const meeting = await VideoApiAdapter().createMeeting(baseCalendarEvent);

    expect(meeting).toEqual({
      type: "leadnest_video",
      id: "booking-uid-123",
      password: "",
      url: "https://meet.leadnest.ai/booking-uid-123",
    });
  });

  it("builds stable urls for downstream fallbacks", () => {
    expect(buildLeadnestMeetingUrl("booking-uid-123")).toBe("https://meet.leadnest.ai/booking-uid-123");
  });
});
