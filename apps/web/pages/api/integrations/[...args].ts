import { ensureAppIsRegistered } from "@calcom/app-store/_utils/syncAppRegistryToDb";
import { throwIfNotHaveAdminAccessToTeam } from "@calcom/app-store/_utils/throwIfNotHaveAdminAccessToTeam";
import { appStoreMetadata } from "@calcom/app-store/appStoreMetaData";
import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import { deriveAppDictKeyFromType } from "@calcom/lib/deriveAppDictKeyFromType";
import { HttpError } from "@calcom/lib/http-error";
import prisma from "@calcom/prisma";
import type { AppMeta } from "@calcom/types/App";
import type { AppDeclarativeHandler, AppHandler } from "@calcom/types/AppHandler";
import type { NextApiRequest, NextApiResponse } from "next";
import type { Session } from "next-auth";

const defaultIntegrationAddHandler = async ({
  slug,
  supportsMultipleInstalls,
  appType,
  user,
  teamId = undefined,
  createCredential,
}: {
  slug: string;
  supportsMultipleInstalls: boolean;
  appType: string;
  user?: Session["user"];
  teamId?: number;
  createCredential: AppDeclarativeHandler["createCredential"];
}): Promise<void> => {
  if (!user?.id) {
    throw new HttpError({ statusCode: 401, message: "You must be logged in to do this" });
  }
  if (!supportsMultipleInstalls) {
    const credentialWhere: { appId: string; userId?: number; AND?: { userId?: number; teamId?: number }[] } =
      {
        appId: slug,
      };

    if (teamId) {
      credentialWhere.AND = [{ userId: user.id }, { teamId }];
    } else {
      credentialWhere.userId = user.id;
    }
    const alreadyInstalled = await prisma.credential.findFirst({
      where: credentialWhere,
    });
    if (alreadyInstalled) {
      throw new Error("App is already installed");
    }
  }

  await throwIfNotHaveAdminAccessToTeam({ teamId: teamId ?? null, userId: user.id });

  await createCredential({ user: user, appType, slug, teamId });
};

const resolveHandlerKey = (appName: string, handlerMap: Record<string, unknown>): string => {
  const derivedHandlerKey = deriveAppDictKeyFromType(appName, handlerMap);
  if (handlerMap[derivedHandlerKey]) {
    return derivedHandlerKey;
  }

  const matchingMetadataKeys = Object.entries(appStoreMetadata).reduce<string[]>(
    (keys, [metadataKey, metadata]) => {
      const appMetadata = metadata as AppMeta;
      if (
        metadataKey === appName ||
        appMetadata.slug === appName ||
        appMetadata.dirName === appName ||
        appMetadata.type === appName
      ) {
        keys.push(metadataKey);
      }
      return keys;
    },
    []
  );

  for (const metadataKey of matchingMetadataKeys) {
    if (handlerMap[metadataKey]) {
      return metadataKey;
    }

    const metadata = appStoreMetadata[metadataKey as keyof typeof appStoreMetadata] as AppMeta;
    const derivedMetadataHandlerKey = deriveAppDictKeyFromType(metadata.type, handlerMap);
    if (handlerMap[derivedMetadataHandlerKey]) {
      return derivedMetadataHandlerKey;
    }
  }

  return derivedHandlerKey;
};

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<NextApiResponse<{ message: string }> | undefined> => {
  // Check that user is authenticated
  req.session = await getServerSession({ req });

  const { args, teamId } = req.query;

  if (!Array.isArray(args)) {
    return res.status(404).json({ message: `API route not found` });
  }

  const [appName, apiEndpoint] = args;
  try {
    /* Absolute path didn't work */
    const handlerMap = (await import("@calcom/app-store/apps.server.generated")).apiHandlers;
    const handlerKey = resolveHandlerKey(appName, handlerMap);
    await ensureAppIsRegistered({ slug: appName });
    const handlers = await handlerMap[handlerKey as keyof typeof handlerMap];
    if (!handlers) throw new HttpError({ statusCode: 404, message: `No handlers found for ${handlerKey}` });
    const handler = handlers[apiEndpoint as keyof typeof handlers] as AppHandler;
    if (typeof handler === "undefined")
      throw new HttpError({ statusCode: 404, message: `API handler not found` });

    if (typeof handler === "function") {
      await handler(req, res);
    } else {
      await defaultIntegrationAddHandler({ user: req.session?.user, teamId: Number(teamId), ...handler });
      const redirectUrl = handler.redirect?.url ?? undefined;
      res.json({ url: redirectUrl, newTab: handler.redirect?.newTab });
    }
    if (!res.writableEnded) res.status(200);
    return;
  } catch (error) {
    console.error(error);
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(404).json({ message: `API handler not found` });
  }
};

export default handler;
