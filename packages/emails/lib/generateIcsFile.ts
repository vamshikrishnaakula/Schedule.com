import type { CalendarEvent } from "@calcom/types/Calendar";
import type { TFunction } from "i18next";
import type { EventStatus } from "ics";

import generateIcsString from "./generateIcsString";

export enum GenerateIcsRole {
  ATTENDEE = "attendee",
  ORGANIZER = "organizer",
}

export default function generateIcsFile({
  calEvent,
  role,
  status,
  t,
}: {
  calEvent: CalendarEvent;
  role: GenerateIcsRole;
  status: EventStatus;
  t?: TFunction;
}) {
  // O365 deletes emails if the calendar event is selected. Currently no option to disable this on the web
  if (
    role !== GenerateIcsRole.ATTENDEE &&
    calEvent.destinationCalendar &&
    calEvent.destinationCalendar[0]?.integration === "office365_calendar"
  )
    return null;

  const organizerEmail = calEvent.organizer.email.trim().toLowerCase();
  const attendeeEmails = calEvent.attendees.map(({ email }) => email.trim().toLowerCase()).filter(Boolean);

  // Exchange can reject REQUEST payloads when the organizer and every attendee
  // resolve to the same mailbox. For self-bookings we fall back to a normal
  // email without the calendar attachment to preserve delivery.
  if (attendeeEmails.length > 0 && attendeeEmails.every((email) => email === organizerEmail)) {
    return null;
  }

  return {
    filename: "event.ics",
    content: generateIcsString({
      event: calEvent,
      status,
      t,
    }),
    method: "REQUEST",
  };
}
