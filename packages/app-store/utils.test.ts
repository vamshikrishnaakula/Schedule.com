import { BookingStatus } from "@calcom/prisma/enums";
import type { App } from "@calcom/types/App";
import type { TFunction } from "i18next";
import { describe, expect, it } from "vitest";
import { getSuccessPageLocationMessage } from "./locations";
import type { CredentialDataWithTeamName, LocationOption } from "./utils";
import getApps, { sanitizeAppForViewer } from "./utils";

describe("sanitizeAppForViewer", () => {
  it("should remove key, credential, and credentials properties", () => {
    const mockCredential: CredentialDataWithTeamName = {
      id: 1,
      type: "daily_video",
      key: { api_key: "secret-api-key" },
      userId: 1,
      user: { email: "test@example.com" },
      teamId: null,
      appId: "daily-video",
      invalid: false,
      delegatedTo: null,
      delegatedToId: null,
      delegationCredentialId: null,
      team: null,
    };

    const mockApp: App & {
      credential: CredentialDataWithTeamName | null;
      credentials: CredentialDataWithTeamName[];
      locationOption: LocationOption | null;
    } = {
      type: "daily_video",
      name: "Daily Video",
      description: "Video conferencing",
      variant: "conferencing",
      slug: "daily-video",
      categories: ["conferencing"],
      logo: "/logo.png",
      publisher: "Daily",
      url: "https://daily.co",
      email: "support@daily.co",
      key: { api_key: "secret-global-api-key" },
      credential: mockCredential,
      credentials: [mockCredential],
      locationOption: {
        value: "integrations:daily_video",
        label: "Daily Video",
      },
    };

    const sanitized = sanitizeAppForViewer(mockApp);

    // Should not have key, credential, or credentials
    expect(sanitized).not.toHaveProperty("key");
    expect(sanitized).not.toHaveProperty("credential");
    expect(sanitized).not.toHaveProperty("credentials");

    // Should have all other properties
    expect(sanitized).toHaveProperty("type", "daily_video");
    expect(sanitized).toHaveProperty("name", "Daily Video");
    expect(sanitized).toHaveProperty("slug", "daily-video");
    expect(sanitized).toHaveProperty("locationOption");
    expect(sanitized.locationOption).toEqual({
      value: "integrations:daily_video",
      label: "Daily Video",
    });
  });

  it("should handle apps without credential or credentials", () => {
    const mockApp: App & {
      credential?: CredentialDataWithTeamName | null;
      credentials?: CredentialDataWithTeamName[];
      locationOption?: LocationOption | null;
    } = {
      type: "zoom_video",
      name: "Zoom",
      description: "Video conferencing",
      variant: "conferencing",
      slug: "zoom",
      categories: ["conferencing"],
      logo: "/logo.png",
      publisher: "Zoom",
      url: "https://zoom.us",
      email: "support@zoom.us",
      key: { api_key: "secret-key" },
    };

    const sanitized = sanitizeAppForViewer(mockApp);

    expect(sanitized).not.toHaveProperty("key");
    expect(sanitized).not.toHaveProperty("credential");
    expect(sanitized).not.toHaveProperty("credentials");
    expect(sanitized).toHaveProperty("slug", "zoom");
  });

  it("should include locationOption for global no-credential apps", () => {
    const mockApps = getApps([], false);
    const leadnestApp = mockApps.find((app) => app.slug === "leadnest-video" || app.slug === "jitsi");

    expect(leadnestApp).toBeDefined();
    expect(leadnestApp?.locationOption).toEqual({
      value: "integrations:leadnestvideo",
      label: "Leadnest Video",
      disabled: false,
    });
  });

  it("should keep a URL location value on success page", () => {
    const location = "https://meet.leadnest.ai/cal/abc123";
    const t = ((s: string) => s) as unknown as TFunction;
    const result = getSuccessPageLocationMessage(location, t, BookingStatus.ACCEPTED);

    expect(result).toBe(location);
  });

  it("should preserve all non-sensitive properties", () => {
    const mockApp: App & {
      credential: CredentialDataWithTeamName | null;
      credentials: CredentialDataWithTeamName[];
      locationOption: LocationOption | null;
    } = {
      type: "stripe_payment",
      name: "Stripe",
      description: "Payment processing",
      variant: "payment",
      slug: "stripe",
      categories: ["payment"],
      logo: "/logo.png",
      publisher: "Stripe",
      url: "https://stripe.com",
      email: "support@stripe.com",
      verified: true,
      trending: true,
      rating: 4.5,
      reviews: 1000,
      isGlobal: false,
      key: { api_key: "sk_live_secret" },
      credential: null,
      credentials: [],
      locationOption: null,
      appData: {
        location: {
          type: "integrations:stripe",
          label: "Stripe",
          linkType: "dynamic",
        },
      },
    };

    const sanitized = sanitizeAppForViewer(mockApp);

    expect(sanitized).not.toHaveProperty("key");
    expect(sanitized).not.toHaveProperty("credential");
    expect(sanitized).not.toHaveProperty("credentials");
    expect(sanitized.verified).toBe(true);
    expect(sanitized.trending).toBe(true);
    expect(sanitized.rating).toBe(4.5);
    expect(sanitized.reviews).toBe(1000);
    expect(sanitized.appData).toBeDefined();
  });
});
