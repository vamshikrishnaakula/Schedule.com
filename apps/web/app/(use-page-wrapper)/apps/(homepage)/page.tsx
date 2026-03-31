import { getAppRegistry, getAppRegistryWithCredentials } from "@calcom/app-store/_appRegistry";
import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import { UserRepository } from "@calcom/features/users/repositories/UserRepository";
import logger from "@calcom/lib/logger";
import prisma from "@calcom/prisma";
import type { AppCategories } from "@calcom/prisma/enums";
import { buildLegacyRequest } from "@lib/buildLegacyCtx";
import { _generateMetadata } from "app/_utils";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import type { JSX } from "react";

import AppsPage from "~/apps/apps-view";

const log: ReturnType<typeof logger.getSubLogger> = logger.getSubLogger({
  prefix: ["apps.homepage.page"],
});

const ServerPage = async (): Promise<JSX.Element> => {
  const req = buildLegacyRequest(await headers(), await cookies());
  const session = await getServerSession({ req });
  let appStore = [];
  let userAdminTeamsIds: number[] = [];
  if (session?.user?.id) {
    try {
      const userRepo = new UserRepository(prisma);
      const userAdminTeams = await userRepo.getUserAdminTeams({ userId: session.user.id });
      userAdminTeamsIds = userAdminTeams?.teams?.map(({ team }) => team.id) ?? [];
      appStore = await getAppRegistryWithCredentials(session.user.id, userAdminTeamsIds);
    } catch (error) {
      log.error("Failed to load app registry with user credentials", error);

      try {
        appStore = await getAppRegistry();
      } catch (fallbackError) {
        log.error("Failed to load public app registry fallback", fallbackError);
      }
    }
  } else {
    try {
      appStore = await getAppRegistry();
    } catch (error) {
      log.error("Failed to load public app registry", error);
    }
  }

  const categoryQuery = appStore.map(({ categories }) => ({
    categories: categories || [],
  }));
  const categories = categoryQuery.reduce(
    (c, app) => {
      for (const category of app.categories) {
        if (c[category]) {
          c[category] = c[category] + 1;
        } else {
          c[category] = 1;
        }
      }
      return c;
    },
    {} as Record<string, number>
  );

  const props = {
    categories: Object.entries(categories)
      .map(([name, count]): { name: AppCategories; count: number } => ({
        name: name as AppCategories,
        count,
      }))
      .sort((a, b) => b.count - a.count),
    appStore,
    userAdminTeams: userAdminTeamsIds,
  };

  return <AppsPage {...props} isAdmin={session?.user?.role === "ADMIN"} />;
};

export const generateMetadata = async (): Promise<Metadata> =>
  await _generateMetadata(
    (t) => t("app_store"),
    (t) => t("app_store_description"),
    undefined,
    undefined,
    "/apps"
  );

export default ServerPage;
