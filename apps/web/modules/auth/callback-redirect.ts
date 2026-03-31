import process from "node:process";
import { WEBAPP_URL } from "@calcom/lib/constants";
import { getSafeRedirectUrl } from "@calcom/lib/getSafeRedirectUrl";

const isAuthLoopPath = (value: string): boolean => {
  return (
    value.includes("/auth/login") ||
    value.includes("/api/auth/signin") ||
    value.includes("/api/auth/callback") ||
    value.endsWith("/api/auth") ||
    value.includes("/auth/error")
  );
};

export function getNormalizedLoginCallbackUrl(
  rawCallbackUrl: string | null | undefined,
  webappUrlOverride?: string
): string {
  const webappUrl =
    (process.env.NEXT_PUBLIC_WEBAPP_URL && process.env.NEXT_PUBLIC_WEBAPP_URL !== "undefined"
      ? process.env.NEXT_PUBLIC_WEBAPP_URL
      : WEBAPP_URL) || "";
  const defaultCallback = `${webappUrl.replace(/\/+$/, "") || ""}/event-types`;
  let callbackUrl =
    rawCallbackUrl && !rawCallbackUrl.includes("undefined") ? rawCallbackUrl : defaultCallback;

  if (/^\//.test(callbackUrl)) callbackUrl = callbackUrl.substring(1);

  const absolutePrefix = webappUrlOverride || webappUrl || WEBAPP_URL || "";
  if (!/^https?:\/\//.test(callbackUrl)) {
    callbackUrl = `${absolutePrefix.replace(/\/+$/, "")}/${callbackUrl}`;
  }

  const safeCallbackUrl = getSafeRedirectUrl(callbackUrl);
  if (!safeCallbackUrl || isAuthLoopPath(safeCallbackUrl)) {
    return `${absolutePrefix.replace(/\/+$/, "")}/event-types`;
  }

  return safeCallbackUrl;
}

export function getNormalizedSignupCallbackUrl({
  callbackUrl,
  webappUrl = WEBAPP_URL,
  isOrgInviteByLink,
  isPlatformUser,
  verifyOrGettingStarted,
  gettingStartedWithPlatform,
}: {
  callbackUrl: string | null | undefined;
  webappUrl?: string;
  isOrgInviteByLink: boolean;
  isPlatformUser: boolean;
  verifyOrGettingStarted: string;
  gettingStartedWithPlatform: string;
}): string {
  if (isOrgInviteByLink && callbackUrl) {
    return `${webappUrl}/${callbackUrl}`;
  }

  const normalized = callbackUrl?.includes("undefined") ? "" : callbackUrl;
  const targetPath = normalized ? `${webappUrl}/${normalized}` : "";

  if (targetPath) {
    const separator = targetPath.includes("?") ? "&" : "?";
    return `${targetPath}${separator}from=signup`;
  }

  if (isPlatformUser) {
    return `${webappUrl}/${gettingStartedWithPlatform}?from=signup`;
  }

  return `${webappUrl}/${verifyOrGettingStarted}?from=signup`;
}
