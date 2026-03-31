import logger from "@calcom/lib/logger";
import { appsRouter } from "@calcom/trpc/server/routers/viewer/apps/_router";
import { calendarsRouter } from "@calcom/trpc/server/routers/viewer/calendars/_router";
import { CalendarListContainer } from "@components/apps/CalendarListContainer";
import { createRouterCaller } from "app/_trpc/context";
import { _generateMetadata } from "app/_utils";
import type { Metadata } from "next";
import type { JSX } from "react";

const log: ReturnType<typeof logger.getSubLogger> = logger.getSubLogger({
  prefix: ["settings.my-account.calendars.page"],
});

const Page = async (): Promise<JSX.Element> => {
  const [calendarsCaller, appsCaller] = await Promise.all([
    createRouterCaller(calendarsRouter),
    createRouterCaller(appsRouter),
  ]);

  const [connectedCalendarsResult, installedCalendarsResult] = await Promise.allSettled([
    calendarsCaller.connectedCalendars(),
    appsCaller.integrations({
      variant: "calendar",
      onlyInstalled: true,
    }),
  ]);

  if (connectedCalendarsResult.status === "rejected") {
    log.error("Failed to load connected calendars for settings page", connectedCalendarsResult.reason);
  }

  if (installedCalendarsResult.status === "rejected") {
    log.error("Failed to load installed calendar apps for settings page", installedCalendarsResult.reason);
  }

  let connectedCalendars = { connectedCalendars: [], destinationCalendar: null };
  if (connectedCalendarsResult.status === "fulfilled") {
    connectedCalendars = connectedCalendarsResult.value;
  }

  let installedCalendars = { items: [] };
  if (installedCalendarsResult.status === "fulfilled") {
    installedCalendars = installedCalendarsResult.value;
  }

  return (
    <CalendarListContainer connectedCalendars={connectedCalendars} installedCalendars={installedCalendars} />
  );
};

export const generateMetadata = async (): Promise<Metadata> =>
  await _generateMetadata(
    (t) => t("calendars"),
    (t) => t("calendars_description"),
    undefined,
    undefined,
    "/settings/my-account/calendars"
  );

export default Page;
