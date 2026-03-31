import { describe, expect, it } from "vitest";
import { getNormalizedSignupCallbackUrl } from "./callback-redirect";
import { WEBAPP_URL } from "@calcom/lib/constants";

describe("getNormalizedSignupCallbackUrl", () => {
  it("defaults to verify path when callbackUrl is missing", () => {
    const callback = getNormalizedSignupCallbackUrl({
      callbackUrl: null,
      webappUrl: WEBAPP_URL,
      isOrgInviteByLink: false,
      isPlatformUser: false,
      verifyOrGettingStarted: "auth/verify-email",
      gettingStartedWithPlatform: "settings/platform/new",
    });

    expect(callback).toBe(`${WEBAPP_URL}/auth/verify-email?from=signup`);
  });

  it("filtering undefined from callbackUrl returns first-step route", () => {
    const callback = getNormalizedSignupCallbackUrl({
      callbackUrl: "undefined/event-types",
      webappUrl: WEBAPP_URL,
      isOrgInviteByLink: false,
      isPlatformUser: false,
      verifyOrGettingStarted: "auth/verify-email",
      gettingStartedWithPlatform: "settings/platform/new",
    });

    expect(callback).toBe(`${WEBAPP_URL}/auth/verify-email?from=signup`);
  });

  it("uses callbackUrl when valid and appends from=signup", () => {
    const callback = getNormalizedSignupCallbackUrl({
      callbackUrl: "event-types",
      webappUrl: WEBAPP_URL,
      isOrgInviteByLink: false,
      isPlatformUser: false,
      verifyOrGettingStarted: "auth/verify-email",
      gettingStartedWithPlatform: "settings/platform/new",
    });

    expect(callback).toBe(`${WEBAPP_URL}/event-types?from=signup`);
  });

  it("can resolve org invite callback URL verbatim", () => {
    const callback = getNormalizedSignupCallbackUrl({
      callbackUrl: "teams?token=abc",
      webappUrl: WEBAPP_URL,
      isOrgInviteByLink: true,
      isPlatformUser: false,
      verifyOrGettingStarted: "auth/verify-email",
      gettingStartedWithPlatform: "settings/platform/new",
    });

    expect(callback).toBe(`${WEBAPP_URL}/teams?token=abc`);
  });
});
