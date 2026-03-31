import type { AdditionalInformation } from "@calcom/types/Calendar";
import type { EventResult } from "@calcom/types/EventManager";

type ExtraAdditionalInfo = AdditionalInformation & {
  url?: string | undefined;
  iCalUID?: string | undefined;
};

type VideoResult = EventResult<ExtraAdditionalInfo>;

function extractVideoEvent(result: VideoResult | undefined): ExtraAdditionalInfo | undefined {
  if (!result || !result.success) return undefined;

  if (Array.isArray(result.updatedEvent)) {
    return result.updatedEvent[0];
  }

  return result.updatedEvent ?? result.createdEvent;
}

function extractMetadata(event: ExtraAdditionalInfo): AdditionalInformation {
  return {
    hangoutLink: event.hangoutLink,
    conferenceData: event.conferenceData,
    entryPoints: event.entryPoints,
  };
}

export function getVideoCallDetails({ results }: { results: VideoResult[] }) {
  const firstVideoResult = results.find((result) => result.type.includes("_video"));
  const videoEvent = extractVideoEvent(firstVideoResult);
  const metadata = videoEvent ? extractMetadata(videoEvent) : {};

  const videoCallUrl = metadata.hangoutLink || videoEvent?.url;

  return { videoCallUrl, metadata, updatedVideoEvent: videoEvent };
}
