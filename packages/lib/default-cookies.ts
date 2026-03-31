import process from "node:process";
import type { CookieOption, CookiesOptions } from "next-auth";

/**
 * Copy from 'https://github.com/nextauthjs/next-auth/blob/227ff2259f/src/core/lib/cookie.ts' as we can't import it directly
 *
 * Use secure cookies if the site uses HTTPS
 * This being conditional allows cookies to work non-HTTPS development URLs
 * Honour secure cookie option, which sets 'secure' and also adds '__Secure-'
 * prefix, but enable them by default if the site URL is HTTPS; but not for
 * non-HTTPS URLs like http://localhost which are used in development).
 * For more on prefixes see https://googlechrome.github.io/samples/cookie-prefixes/
 *
 */

const NEXTAUTH_COOKIE_DOMAIN = process.env.NEXTAUTH_COOKIE_DOMAIN || "";
const NEXTAUTH_COOKIE_SAME_SITE = process.env.NEXTAUTH_COOKIE_SAME_SITE;

const getSameSite = (useSecureCookies: boolean): "lax" | "strict" | "none" => {
  if (
    NEXTAUTH_COOKIE_SAME_SITE === "lax" ||
    NEXTAUTH_COOKIE_SAME_SITE === "strict" ||
    NEXTAUTH_COOKIE_SAME_SITE === "none"
  ) {
    return NEXTAUTH_COOKIE_SAME_SITE;
  }

  return useSecureCookies ? "lax" : "lax";
};

export function defaultCookies(useSecureCookies: boolean): CookiesOptions {
  const cookiePrefix = useSecureCookies ? "__Secure-" : "";
  const sameSite = getSameSite(useSecureCookies);

  const defaultOptions: CookieOption["options"] = {
    domain: NEXTAUTH_COOKIE_DOMAIN || undefined,
    sameSite,
    path: "/",
    secure: useSecureCookies,
  };
  return {
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token`,
      options: {
        ...defaultOptions,
        httpOnly: true,
      },
    },
    callbackUrl: {
      name: `${cookiePrefix}next-auth.callback-url`,
      options: defaultOptions,
    },
    csrfToken: {
      name: `${cookiePrefix}next-auth.csrf-token`,
      options: {
        ...defaultOptions,
        httpOnly: true,
      },
    },
    pkceCodeVerifier: {
      name: `${cookiePrefix}next-auth.pkce.code_verifier`,
      options: {
        ...defaultOptions,
        httpOnly: true,
      },
    },
    state: {
      name: `${cookiePrefix}next-auth.state`,
      options: {
        ...defaultOptions,
        httpOnly: true,
      },
    },
    nonce: {
      name: `${cookiePrefix}next-auth.nonce`,
      options: {
        httpOnly: true,
        sameSite,
        path: "/",
        secure: useSecureCookies,
        domain: NEXTAUTH_COOKIE_DOMAIN || undefined,
      },
    },
  };
}
