import process from "node:process";
import { WEBAPP_URL } from "./constants";

export const normalizeNextAuthUrl = (nextAuthUrl: string): string => {
  if (!nextAuthUrl) {
    return nextAuthUrl;
  }

  try {
    const url = new URL(nextAuthUrl);

    if (url.pathname === "/" || url.pathname === "") {
      url.pathname = "/api/auth";
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    return nextAuthUrl.replace(/\/$/, "");
  }
};

export const getNormalizedNextAuthUrl = (): string => {
  return normalizeNextAuthUrl(process.env.NEXTAUTH_URL || `${WEBAPP_URL}/api/auth`);
};
