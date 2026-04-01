import type { CalendarEvent } from "@calcom/types/Calendar";
import type { CredentialPayload } from "@calcom/types/Credential";
import { describe, expect, it } from "vitest";

import { getVideoAdapters } from "./getVideoAdapters";

const leadnestCredential: CredentialPayload = {
  id: 0,
  type: "leadnest_video",
  appId: "leadnest-video",
  userId: 0,
  user: { email: "" },
  teamId: null,
  key: {},
  invalid: false,
  delegationCredentialId: null,
};

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

describe("getVideoAdapters", () => {
  it("resolves the Leadnest adapter from the appId", async () => {
    const [adapter] = await getVideoAdapters([leadnestCredential]);

    expect(adapter).toBeDefined();

    const meeting = await adapter.createMeeting(baseCalendarEvent);

    expect(meeting).toEqual({
      type: "leadnest_video",
      id: "booking-uid-123",
      password: "",
      url: "https://meet.leadnest.ai/booking-uid-123",
    });
  });
});
