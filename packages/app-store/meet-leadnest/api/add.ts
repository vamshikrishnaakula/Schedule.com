import { createDefaultInstallation } from "@calcom/app-store/_utils/installation";
import setDefaultConferencingApp from "@calcom/app-store/_utils/setDefaultConferencingApp";
import { throwIfNotHaveAdminAccessToTeam } from "@calcom/app-store/_utils/throwIfNotHaveAdminAccessToTeam";
import prisma from "@calcom/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

import getInstalledAppPath from "../../_utils/getInstalledAppPath";
import { metadata } from "../_metadata";

/**
 * This is an example endpoint for an app, these will run under `/api/integrations/[...args]`
 * @param req
 * @param res
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!req.session?.user?.id) {
    return res.status(401).json({ message: "You must be logged in to do this" });
  }
  const { teamId, returnTo } = req.query;

  await throwIfNotHaveAdminAccessToTeam({ teamId: Number(teamId) ?? null, userId: req.session.user.id });

  const installForObject = teamId ? { teamId: Number(teamId) } : { userId: req.session.user.id };
  try {
    const alreadyInstalled = await prisma.credential.findFirst({
      where: {
        type: metadata.type,
        ...installForObject,
      },
    });
    if (alreadyInstalled) {
      throw new Error("Already installed");
    }
    const installation = await createDefaultInstallation({
      appType: metadata.type,
      user: req.session.user,
      slug: metadata.slug,
      key: {},
      teamId: teamId ? Number(teamId) : undefined,
    });
    if (!installation) {
      throw new Error(`Unable to create user credential for ${metadata.slug}`);
    }

    if (!teamId) {
      await setDefaultConferencingApp(req.session.user.id, metadata.slug);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }
    return res.status(500);
  }
  return res
    .status(200)
    .json({ url: returnTo ?? getInstalledAppPath({ variant: metadata.variant, slug: metadata.slug }) });
}
