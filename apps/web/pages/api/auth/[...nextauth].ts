import type { NextApiRequest, NextApiResponse } from "next";
import NextAuth from "next-auth";

import { getOptions } from "@calcom/features/auth/lib/next-auth-options";
import { getTrackingFromCookies } from "@calcom/lib/tracking";

const handler = (req: NextApiRequest, res: NextApiResponse) =>
  NextAuth(
    req,
    res,
    getOptions({
      getDubId: () => req.cookies.dub_id || req.cookies.dclid,
      getTrackingData: () => getTrackingFromCookies(req.cookies),
      // Explicitly configure Keycloak provider with correct callback
      extraProviders: [
        {
          id: "keycloak",
          name: "Keycloak",
          type: "oauth" as const,
          clientId: process.env.KEYCLOAK_CLIENT_ID as string,
          clientSecret: process.env.KEYCLOAK_CLIENT_SECRET as string,
          issuer: process.env.KEYCLOAK_ISSUER as string,
          authorization: {
            url: `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/auth`,
            params: { scope: "openid email profile" },
          },
          token: `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
          userinfo: `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/userinfo`,
          profile: (profile: any) => ({
            id: profile.sub,
            name: profile.name || profile.preferred_username,
            email: profile.email,
            image: profile.picture,
            email_verified: profile.email_verified,
          }),
          allowDangerousEmailAccountLinking: true,
          checks: ["pkce", "state"],
        },
      ],
    })
  );

export default handler;
