import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import logger from "@calcom/lib/logger";
import { AppCategories } from "@calcom/prisma/enums";
import { appsRouter } from "@calcom/trpc/server/routers/viewer/apps/_router";
import { calendarsRouter } from "@calcom/trpc/server/routers/viewer/calendars/_router";
import { buildLegacyRequest } from "@lib/buildLegacyCtx";
import { createRouterCaller } from "app/_trpc/context";
import type { PageProps } from "app/_types";
import { _generateMetadata } from "app/_utils";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { JSX } from "react";
import { z } from "zod";

import InstalledApps from "~/apps/installed/[category]/installed-category-view";

const log: ReturnType<typeof logger.getSubLogger> = logger.getSubLogger({
  prefix: ["apps.installed.category.page"],
});

const querySchema: z.ZodType<{ category: AppCategories }> = z.object({
  category: z.nativeEnum(AppCategories),
});

const InstalledAppsWrapper = async ({ params }: PageProps): Promise<JSX.Element> => {
  const parsedParams = querySchema.safeParse(await params);

  if (!parsedParams.success) {
    redirect("/apps/installed/calendar");
  }

  const session = await getServerSession({ req: buildLegacyRequest(await headers(), await cookies()) });
  if (!session?.user?.id) {
    return redirect("/auth/login");
  }

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
    log.error("Failed to load connected calendars for installed apps page", connectedCalendarsResult.reason);
  }

  if (installedCalendarsResult.status === "rejected") {
    log.error(
      "Failed to load installed calendar apps for installed apps page",
      installedCalendarsResult.reason
    );
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
    <InstalledApps
      connectedCalendars={connectedCalendars}
      installedCalendars={installedCalendars}
      category={parsedParams.data.category}
    />
  );
};

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> =>
  await _generateMetadata(
    (t) => t("installed_apps"),
    (t) => t("manage_your_connected_apps"),
    undefined,
    undefined,
    `/apps/installed/${(await params).category}`
  );

export default InstalledAppsWrapper;
