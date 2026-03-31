import process from "node:process";
import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import { isSAMLLoginEnabled, samlProductID, samlTenantID } from "@calcom/features/ee/sso/lib/saml";
import { WEBAPP_URL } from "@calcom/lib/constants";
import { getSafeRedirectUrl } from "@calcom/lib/getSafeRedirectUrl";
import prisma from "@calcom/prisma";
import { IS_GOOGLE_LOGIN_ENABLED } from "@server/lib/constants";
import { jwtVerify } from "jose";
import type { GetServerSidePropsContext } from "next";
import { getCsrfToken } from "next-auth/react";

const isInvalidLoginCallbackUrl = (value: string): boolean => {
  return (
    value.includes("/auth/login") ||
    value.includes("/api/auth/signin") ||
    value.includes("/api/auth/callback") ||
    value.endsWith("/api/auth") ||
    value.includes("/auth/error")
  );
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { req, query } = context;

  const session = await getServerSession({ req });

  const verifyJwt = (jwt: string) => {
    const secret = new TextEncoder().encode(process.env.CALENDSO_ENCRYPTION_KEY);

    return jwtVerify(jwt, secret, {
      issuer: WEBAPP_URL,
      audience: `${WEBAPP_URL}/auth/login`,
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
        const normalizedCallbackUrl = /^https?:\/\//.test(callbackUrl as string)
          ? (callbackUrl as string)
          : `${WEBAPP_URL.replace(/\/+$/, "")}/${(callbackUrl as string).replace(/^\/+/, "")}`;
        const destination = getSafeRedirectUrl(normalizedCallbackUrl);
        if (destination && !isInvalidLoginCallbackUrl(destination)) {
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
        destination: "/event-types",
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
  if (/^\//.test(callbackUrl)) callbackUrl = callbackUrl.substring(1);
  if (!/^https?:\/\//.test(callbackUrl)) {
    callbackUrl = `${WEBAPP_URL}/${callbackUrl}`;
  }
  const safeCallbackUrl = getSafeRedirectUrl(callbackUrl) || "";

  const keycloakEnabled =
    !!process.env.KEYCLOAK_CLIENT_ID && !!process.env.KEYCLOAK_CLIENT_SECRET && !!process.env.KEYCLOAK_ISSUER;

  return {
    props: {
      csrfToken: await getCsrfToken(context),
      isGoogleLoginEnabled: IS_GOOGLE_LOGIN_ENABLED,
      isSAMLLoginEnabled,
      samlTenantID,
      samlProductID,
      totpEmail,
      isKeycloakLoginEnabled: keycloakEnabled,
      safeCallbackUrl:
        !safeCallbackUrl || isInvalidLoginCallbackUrl(safeCallbackUrl)
          ? `${WEBAPP_URL}/event-types`
          : safeCallbackUrl,
    },
  };
}
