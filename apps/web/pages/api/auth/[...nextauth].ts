import process from "node:process";
import { getOptions } from "@calcom/features/auth/lib/next-auth-options";
import { getNormalizedNextAuthUrl, normalizeNextAuthUrl } from "@calcom/lib/getNormalizedNextAuthUrl";
import { getTrackingFromCookies } from "@calcom/lib/tracking";
import type { NextApiRequest, NextApiResponse } from "next";
import NextAuth from "next-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  process.env.NEXTAUTH_URL = getNormalizedNextAuthUrl();

  if (process.env.NEXTAUTH_URL_INTERNAL) {
    process.env.NEXTAUTH_URL_INTERNAL = normalizeNextAuthUrl(process.env.NEXTAUTH_URL_INTERNAL);
  }

  const options = await getOptions({
    getDubId: () => req.cookies.dub_id || req.cookies.dclid,
    getTrackingData: () => getTrackingFromCookies(req.cookies),
  });

  return await NextAuth(req, res, options);
}
