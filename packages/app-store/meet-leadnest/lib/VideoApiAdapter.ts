import type { CalendarEvent } from "@calcom/types/Calendar";
import type { PartialReference } from "@calcom/types/EventManager";
import type { VideoApiAdapter, VideoCallData } from "@calcom/types/VideoApiAdapter";

import { metadata } from "../_metadata";

function buildLeadnestMeetingUrl(uid: string) {
  return new URL(`/${encodeURIComponent(uid)}`, metadata.url).toString();
}

const JitsiVideoApiAdapter = (): VideoApiAdapter => {
  return {
    getAvailability: () => {
      return Promise.resolve([]);
    },
    createMeeting: async (eventData: CalendarEvent): Promise<VideoCallData> => {
      if (!eventData.uid) {
        throw new Error("Leadnest Video requires the booking uid to create a meeting");
      }

      return Promise.resolve({
        type: metadata.type,
        id: eventData.uid,
        password: "",
        url: buildLeadnestMeetingUrl(eventData.uid),
      });
    },
    deleteMeeting: async (): Promise<void> => {
      Promise.resolve();
    },
    updateMeeting: (bookingRef: PartialReference): Promise<VideoCallData> => {
      return Promise.resolve({
        type: metadata.type,
        id: bookingRef.meetingId as string,
        password: bookingRef.meetingPassword as string,
        url: bookingRef.meetingUrl as string,
      });
    },
  };
};

export default JitsiVideoApiAdapter;
export { buildLeadnestMeetingUrl };
