import { describe, expect, it } from "vitest";
import { getNormalizedLoginCallbackUrl } from "./callback-redirect";
import { WEBAPP_URL } from "@calcom/lib/constants";

describe("getNormalizedLoginCallbackUrl", () => {
  it("defaults to /event-types when callbackUrl is missing", () => {
    const callback = getNormalizedLoginCallbackUrl(undefined);
    expect(callback).toBe(`${WEBAPP_URL}/event-types`);
  });

  it("filters out callbackUrl containing undefined and returns /event-types", () => {
    const callback = getNormalizedLoginCallbackUrl("undefined/event-types");
    expect(callback).toBe(`${WEBAPP_URL}/event-types`);
  });

  it("resolves relative callback paths to absolute URL", () => {
    const callback = getNormalizedLoginCallbackUrl("/event-types");
    expect(callback).toBe(`${WEBAPP_URL}/event-types`);
  });

  it("keeps absolute callback URL for allowed host", () => {
    const callback = getNormalizedLoginCallbackUrl(`${WEBAPP_URL}/foo`);
    expect(callback).toBe(`${WEBAPP_URL}/foo`);
  });
});
