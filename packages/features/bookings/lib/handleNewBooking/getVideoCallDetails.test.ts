import type { CalendarEvent } from "@calcom/types/Calendar";
import type { EventResult } from "@calcom/types/EventManager";
import { describe, expect, it } from "vitest";

import { getVideoCallDetails } from "./getVideoCallDetails";

const baseCalendarEvent: CalendarEvent = {
  type: "15min",
  title: "Test meeting",
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

describe("getVideoCallDetails", () => {
  it("returns the meeting url for newly created video integrations", () => {
    const results: EventResult<{ type: string; url: string; id: string; password: string }>[] = [
      {
        type: "leadnest_video",
        appName: "Leadnest Video",
        success: true,
        uid: "booking-ref-1",
        originalEvent: baseCalendarEvent,
        createdEvent: {
          type: "leadnest_video",
          url: "https://meet.leadnest.ai/cal/test-room",
          id: "test-room",
          password: "",
        },
      },
    ];

    const { videoCallUrl } = getVideoCallDetails({ results });

    expect(videoCallUrl).toBe("https://meet.leadnest.ai/cal/test-room");
  });

  it("still supports updated video integrations", () => {
    const results: EventResult<{ type: string; url: string; id: string; password: string }>[] = [
      {
        type: "leadnest_video",
        appName: "Leadnest Video",
        success: true,
        uid: "booking-ref-1",
        originalEvent: baseCalendarEvent,
        updatedEvent: {
          type: "leadnest_video",
          url: "https://meet.leadnest.ai/cal/updated-room",
          id: "updated-room",
          password: "",
        },
      },
    ];

    const { videoCallUrl } = getVideoCallDetails({ results });

    expect(videoCallUrl).toBe("https://meet.leadnest.ai/cal/updated-room");
  });
});
