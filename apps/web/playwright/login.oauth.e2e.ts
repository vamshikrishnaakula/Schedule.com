import { expect, test } from "@playwright/test";

import { IS_GOOGLE_LOGIN_ENABLED, IS_SAML_LOGIN_ENABLED } from "../server/lib/constants";

test("Should display Google Login button", async ({ page }) => {
  // eslint-disable-next-line playwright/no-skipped-test
  test.skip(!IS_GOOGLE_LOGIN_ENABLED, "It should only run if Google Login is installed");

  await page.goto(`/auth/login`);

  await expect(page.locator(`[data-testid=google]`)).toBeVisible();
});

// show Keycloak if configured
test("Should display Keycloak Login button", async ({ page }) => {
  // eslint-disable-next-line playwright/no-skipped-test
  test.skip(!process.env.KEYCLOAK_CLIENT_ID, "requires Keycloak config");

  await page.goto(`/auth/login`);
  await expect(page.locator(`[data-testid=keycloak]`)).toBeVisible();
});

// if Keycloak is enabled, we redirect straight to provider
test("Navigating to login should redirect to Keycloak when enabled", async ({ page }) => {
  // eslint-disable-next-line playwright/no-skipped-test
  test.skip(!process.env.KEYCLOAK_CLIENT_ID, "requires Keycloak config");

  await page.goto(`/auth/login`);
  await expect(page).toHaveURL(/\/api\/auth\/signin\/keycloak/);
});

test("Should display SAML Login button", async ({ page }) => {
  // eslint-disable-next-line playwright/no-skipped-test
  test.skip(!IS_SAML_LOGIN_ENABLED, "It should only run if SAML Login is installed");

  // TODO: Fix this later
  // Button is visible only if there is a SAML connection exists (self-hosted)
  // await page.goto(`/auth/login`);
  // await expect(page.locator(`[data-testid=saml]`)).toBeVisible();
});
