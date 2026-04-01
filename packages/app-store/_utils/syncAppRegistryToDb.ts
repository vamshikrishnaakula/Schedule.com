import { appStoreMetadata } from "@calcom/app-store/appStoreMetaData";
import logger from "@calcom/lib/logger";
import prisma from "@calcom/prisma";
import type { AppCategories } from "@calcom/prisma/client";
import type { AppMeta } from "@calcom/types/App";

const log: ReturnType<typeof logger.getSubLogger> = logger.getSubLogger({
  prefix: ["app-store.sync-registry"],
});

const SYNC_INTERVAL_MS: number = 5 * 60 * 1000;

let lastFullSyncAt = 0;
let fullSyncPromise: Promise<void> | null = null;

const isAppCategory = (value: string): value is AppCategories => {
  return [
    "calendar",
    "messaging",
    "other",
    "payment",
    "video",
    "web3",
    "automation",
    "analytics",
    "conferencing",
    "crm",
  ].includes(value);
};

const getRegistryCategories = (app: AppMeta): AppCategories[] => {
  const categories = new Set<AppCategories>();

  for (const category of app.categories ?? []) {
    if (isAppCategory(category)) {
      categories.add(category);
    }
  }

  if ("category" in app && app.category && isAppCategory(app.category)) {
    categories.add(app.category);
  }

  if (app.variant && isAppCategory(app.variant)) {
    categories.add(app.variant);
  }

  if (categories.has("video")) {
    categories.add("conferencing");
  }

  if (!categories.size) {
    categories.add("other");
  }

  return Array.from(categories);
};

const getSyncableApps = (): AppMeta[] => {
  return Object.values(appStoreMetadata).filter((app) => !app.isTemplate);
};

const getAppIdentifiers = (app: Pick<AppMeta, "slug" | "dirName" | "type">, appType?: string): string[] => {
  return Array.from(
    new Set([app.slug, app.dirName, app.type, appType].filter((value): value is string => Boolean(value)))
  );
};

const getMetadataForApp = ({ slug, appType }: { slug?: string; appType?: string }): AppMeta | null => {
  return (
    getSyncableApps().find((app) => {
      const identifiers = getAppIdentifiers(app, appType);
      if (identifiers.includes(slug ?? "")) {
        return true;
      }

      if (appType) {
        return identifiers.includes(appType);
      }

      return false;
    }) ?? null
  );
};

const upsertAppMetadata = async (app: AppMeta): Promise<void> => {
  const dirName = app.dirName ?? app.slug;
  const categories = getRegistryCategories(app);
  const data = {
    slug: app.slug,
    dirName,
    categories,
    enabled: true,
  };

  const existingApp = await prisma.app.findFirst({
    where: {
      OR: [{ slug: app.slug }, { dirName }],
    },
    select: {
      slug: true,
      dirName: true,
      enabled: true,
      categories: true,
    },
  });

  if (!existingApp) {
    log.debug("Creating missing App Store app row", { slug: app.slug, dirName, categories });
    await prisma.app.create({ data });
    return;
  }

  const categoriesChanged =
    existingApp.categories.length !== categories.length ||
    existingApp.categories.some((category) => !categories.includes(category));

  if (
    existingApp.slug === data.slug &&
    existingApp.dirName === data.dirName &&
    existingApp.enabled === data.enabled &&
    !categoriesChanged
  ) {
    return;
  }

  log.debug("Updating App Store app row", {
    existingSlug: existingApp.slug,
    slug: app.slug,
    dirName,
    categories,
    enabled: true,
  });

  await prisma.app.update({
    where: { slug: existingApp.slug },
    data,
  });
};

export const ensureAppIsRegistered = async ({
  slug,
  appType,
}: {
  slug?: string;
  appType?: string;
}): Promise<{ slug: string; dirName: string; categories: AppCategories[] } | null> => {
  const metadata = getMetadataForApp({ slug, appType });

  if (!metadata) {
    return null;
  }

  await upsertAppMetadata(metadata);

  return {
    slug: metadata.slug,
    dirName: metadata.dirName ?? metadata.slug,
    categories: getRegistryCategories(metadata),
  };
};

export const syncAppRegistryToDb = async ({ force = false }: { force?: boolean } = {}): Promise<void> => {
  if (!force && lastFullSyncAt && Date.now() - lastFullSyncAt < SYNC_INTERVAL_MS) {
    return;
  }

  if (!force && fullSyncPromise) {
    return fullSyncPromise;
  }

  const runSync = async (): Promise<void> => {
    const syncableApps = getSyncableApps();

    log.debug("Syncing App Store metadata into Prisma", { appCount: syncableApps.length, force });

    for (const app of syncableApps) {
      await upsertAppMetadata(app);
    }

    lastFullSyncAt = Date.now();
  };

  fullSyncPromise = runSync().finally(() => {
    fullSyncPromise = null;
  });

  return fullSyncPromise;
};
