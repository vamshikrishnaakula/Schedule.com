import { jwtVerify } from "jose";
import type { GetServerSidePropsContext } from "next";
import { getCsrfToken } from "next-auth/react";

import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import { isSAMLLoginEnabled, samlProductID, samlTenantID } from "@calcom/features/ee/sso/lib/saml";
import { WEBSITE_URL } from "@calcom/lib/constants";
import { getSafeRedirectUrl } from "@calcom/lib/getSafeRedirectUrl";
import prisma from "@calcom/prisma";

import { IS_GOOGLE_LOGIN_ENABLED } from "@server/lib/constants";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { req, query } = context;

  const session = await getServerSession({ req });

  const verifyJwt = (jwt: string) => {
    const secret = new TextEncoder().encode(process.env.CALENDSO_ENCRYPTION_KEY);

    return jwtVerify(jwt, secret, {
      issuer: WEBSITE_URL,
      audience: `${WEBSITE_URL}/auth/login`,
      algorithms: ["HS256"],
    });
  };

  let totpEmail = null;
  if (context.query.totp) {
    try {
      const decryptedJwt = await verifyJwt(context.query.totp as string);
      if (decryptedJwt.payload) {
        totpEmail = decryptedJwt.payload.email as string;
      } else {
        return {
          redirect: {
            destination: "/auth/error?error=JWT%20Invalid%20Payload",
            permanent: false,
          },
        };
      }
    } catch {
      return {
        redirect: {
          destination: "/auth/error?error=Invalid%20JWT%3A%20Please%20try%20again",
          permanent: false,
        },
      };
    }
  }

  if (session) {
    const { callbackUrl } = query;

    if (callbackUrl) {
      try {
        const destination = getSafeRedirectUrl(callbackUrl as string);
        if (destination) {
          return {
            redirect: {
              destination,
              permanent: false,
            },
          };
        }
      } catch (e) {
        console.warn(e);
      }
    }

    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const userExists = await prisma.user.findFirst({ select: { id: true } });
  if (!userExists) {
    // Proceed to new onboarding to create first admin user
    return {
      redirect: {
        destination: "/auth/setup",
        permanent: false,
      },
    };
  }
  // construct callbackUrl (re-using logic from above)
  let callbackUrl = (query.callbackUrl as string) || "";
  if (/"\//.test(callbackUrl)) callbackUrl = callbackUrl.substring(1);
  if (!/^https?:\/\//.test(callbackUrl)) {
    callbackUrl = `${WEBSITE_URL}/${callbackUrl}`;
  }
  const safeCallbackUrl = getSafeRedirectUrl(callbackUrl) || "";

  const keycloakEnabled =
    !!process.env.KEYCLOAK_CLIENT_ID &&
    !!process.env.KEYCLOAK_CLIENT_SECRET &&
    !!process.env.KEYCLOAK_ISSUER;

  // If NextAuth redirected here with an error (eg. unable to complete the
  // Keycloak flow), don't immediately redirect again to avoid a redirect loop.
  // This matches the behavior we want for other errors (show error page / form).
  if (userExists && keycloakEnabled && !query.error) {
    const dest = `/api/auth/signin/keycloak?callbackUrl=${encodeURIComponent(
      safeCallbackUrl || WEBSITE_URL
    )}`;
    return {
      redirect: {
        destination: dest,
        permanent: false,
      },
    };
  }

  return {
    props: {
      csrfToken: await getCsrfToken(context),
      isGoogleLoginEnabled: IS_GOOGLE_LOGIN_ENABLED,
      isSAMLLoginEnabled,
      samlTenantID,
      samlProductID,
      totpEmail,
      isKeycloakLoginEnabled: keycloakEnabled,
    },
  };
}
