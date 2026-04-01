import { normalizeEmailAddresses } from "@calcom/emails/lib/normalizeEmailAddresses";
import type { CalendarEvent } from "@calcom/types/Calendar";

import { getReplyToEmail } from "./getReplyToEmail";

export function getReplyToHeader(
  calEvent: CalendarEvent,
  additionalEmails?: string | string[],
  excludeOrganizerEmail?: boolean
) {
  if (calEvent.hideOrganizerEmail) return {};

  const replyToEmail = getReplyToEmail(calEvent, excludeOrganizerEmail);
  const emailArray: string[] = [];

  if (additionalEmails) {
    if (Array.isArray(additionalEmails)) {
      emailArray.push(...additionalEmails);
    } else {
      emailArray.push(additionalEmails);
    }
  }

  if (replyToEmail) {
    emailArray.push(replyToEmail);
  }

  const normalizedEmails = normalizeEmailAddresses(emailArray);

  if (normalizedEmails.length === 0) {
    return {};
  }

  const replyTo = normalizedEmails.length === 1 ? normalizedEmails[0] : normalizedEmails;
  return { replyTo };
}
