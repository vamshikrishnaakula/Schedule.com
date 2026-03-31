import { appStoreMetadata } from "@calcom/app-store/appStoreMetaData";
import { CredentialRepository } from "@calcom/features/credentials/repositories/CredentialRepository";
import { HttpError } from "@calcom/lib/http-error";
import prisma from "@calcom/prisma";
import type { Prisma } from "@calcom/prisma/client";
import type { AppMeta } from "@calcom/types/App";
import type { UserProfile } from "@calcom/types/UserProfile";

const getKnownAppIdentifiers = ({ slug, dirName }: Pick<AppMeta, "slug" | "dirName">) => {
  const identifiers = [slug, dirName];

  if (dirName === "leadnestvideo" || slug === "leadnest-video" || slug === "jitsi") {
    identifiers.push("jitsi", "leadnestvideo");
  }

  return Array.from(new Set(identifiers.filter(Boolean)));
};

export async function resolveCredentialAppSlug({
  slug,
  appType,
}: {
  slug: string;
  appType: string;
}): Promise<string> {
  const matchingMetadata = Object.values(appStoreMetadata).find((metadata) => {
    const appMetadata = metadata as AppMeta;
    return (
      appMetadata.slug === slug ||
      appMetadata.dirName === slug ||
      appMetadata.type === appType ||
      appMetadata.type === slug
    );
  }) as AppMeta | undefined;

  const appIdentifiers = matchingMetadata ? getKnownAppIdentifiers(matchingMetadata) : [slug];

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

export async function checkInstalled(slug: string, userId: number, appType?: string) {
  const resolvedAppSlug = appType ? await resolveCredentialAppSlug({ slug, appType }) : slug;
  const alreadyInstalled = await CredentialRepository.findByAppIdAndUserId({
    appId: resolvedAppSlug,
    userId,
  });
  if (alreadyInstalled) {
    throw new HttpError({ statusCode: 422, message: "Already installed" });
  }
}

export async function isAppInstalled({ appId, userId }: { appId: string; userId: number }) {
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
}: InstallationArgs) {
  const resolvedAppSlug = await resolveCredentialAppSlug({ slug, appType });
  const installation = await prisma.credential.create({
    data: {
      type: appType,
      key,
      ...(teamId ? { teamId } : { userId: user.id }),
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
