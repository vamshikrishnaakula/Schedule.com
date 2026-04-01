import { ensureAppIsRegistered } from "@calcom/app-store/_utils/syncAppRegistryToDb";
import { appStoreMetadata } from "@calcom/app-store/appStoreMetaData";
import { CredentialRepository } from "@calcom/features/credentials/repositories/CredentialRepository";
import { HttpError } from "@calcom/lib/http-error";
import prisma from "@calcom/prisma";
import type { Prisma } from "@calcom/prisma/client";
import type { AppMeta } from "@calcom/types/App";
import type { UserProfile } from "@calcom/types/UserProfile";

const getKnownAppIdentifiers = ({ slug, dirName }: Pick<AppMeta, "slug" | "dirName">): string[] => {
  const identifiers = [slug, dirName].filter((identifier): identifier is string => Boolean(identifier));

  if (dirName === "leadnestvideo" || slug === "leadnest-video" || slug === "jitsi") {
    identifiers.push("jitsi", "leadnestvideo");
  }

  return Array.from(new Set(identifiers.filter(Boolean)));
};

async function resolveCredentialAppSlug({
  slug,
  appType,
}: {
  slug: string;
  appType: string;
}): Promise<string> {
  const registeredApp = await ensureAppIsRegistered({ slug, appType });
  if (registeredApp) {
    return registeredApp.slug;
  }

  const matchingMetadata = Object.values(appStoreMetadata).find((metadata) => {
    const appMetadata = metadata as AppMeta;
    return (
      appMetadata.slug === slug ||
      appMetadata.dirName === slug ||
      appMetadata.type === appType ||
      appMetadata.type === slug
    );
  }) as AppMeta | undefined;

  let appIdentifiers = [slug];

  if (matchingMetadata) {
    appIdentifiers = getKnownAppIdentifiers(matchingMetadata);
  }

  const existingApp = await prisma.app.findFirst({
    where: {
      OR: [
        ...appIdentifiers.map((identifier) => ({ slug: identifier })),
        ...appIdentifiers.map((identifier) => ({ dirName: identifier })),
      ],
    },
    select: {
      slug: true,
    },
  });

  return existingApp?.slug ?? slug;
}

async function checkInstalled(slug: string, userId: number, appType?: string): Promise<void> {
  let resolvedAppSlug = slug;

  if (appType) {
    resolvedAppSlug = await resolveCredentialAppSlug({ slug, appType });
  }

  const alreadyInstalled = await CredentialRepository.findByAppIdAndUserId({
    appId: resolvedAppSlug,
    userId,
  });
  if (alreadyInstalled) {
    throw new HttpError({ statusCode: 422, message: "Already installed" });
  }
}

async function isAppInstalled({ appId, userId }: { appId: string; userId: number }): Promise<boolean> {
  const alreadyInstalled = await CredentialRepository.findByAppIdAndUserId({ appId, userId });
  return !!alreadyInstalled;
}

type InstallationArgs = {
  appType: string;
  user: {
    id: number;
    profile?: UserProfile;
  };
  slug: string;
  key?: Prisma.InputJsonValue;
  teamId?: number;
  subscriptionId?: string | null;
  paymentStatus?: string | null;
  billingCycleStart?: number | null;
};

export async function createDefaultInstallation({
  appType,
  user,
  slug,
  key = {},
  teamId,
  billingCycleStart,
  paymentStatus,
  subscriptionId,
}: InstallationArgs): Promise<Awaited<ReturnType<typeof prisma.credential.create>>> {
  const resolvedAppSlug = await resolveCredentialAppSlug({ slug, appType });
  const installationOwner: { teamId?: number; userId?: number } = {};

  if (teamId) {
    installationOwner.teamId = teamId;
  } else {
    installationOwner.userId = user.id;
  }
  const installation = await prisma.credential.create({
    data: {
      type: appType,
      key,
      ...installationOwner,
      appId: resolvedAppSlug,
      subscriptionId,
      paymentStatus,
      billingCycleStart,
    },
  });
  if (!installation) {
    throw new Error(`Unable to create user credential for type ${appType}`);
  }
  return installation;
}

export { checkInstalled, isAppInstalled, resolveCredentialAppSlug };
