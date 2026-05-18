/**
 * E2E: Client ↔ CPA realtime engagement chat round-trip.
 *
 * Requires four seeded accounts + a shared engagement project. Skips by
 * default so CI never fails on a fresh clone. To enable locally:
 *
 *   export TEST_CLIENT_EMAIL=... TEST_CLIENT_PASSWORD=...
 *   export TEST_CPA_EMAIL=...    TEST_CPA_PASSWORD=...
 *   export TEST_ENGAGEMENT_PROJECT_ID=...
 *   bunx playwright test e2e/engagement-chat.spec.ts
 */
import { test, expect } from "../playwright-fixture";

const CLIENT_EMAIL = process.env.TEST_CLIENT_EMAIL;
const CLIENT_PASSWORD = process.env.TEST_CLIENT_PASSWORD;
const CPA_EMAIL = process.env.TEST_CPA_EMAIL;
const CPA_PASSWORD = process.env.TEST_CPA_PASSWORD;
const PROJECT_ID = process.env.TEST_ENGAGEMENT_PROJECT_ID;

const haveCreds =
  !!CLIENT_EMAIL && !!CLIENT_PASSWORD && !!CPA_EMAIL && !!CPA_PASSWORD && !!PROJECT_ID;

test.describe("engagement chat realtime round-trip", () => {
  test.skip(!haveCreds, "Set TEST_CLIENT_* / TEST_CPA_* / TEST_ENGAGEMENT_PROJECT_ID to run");

  async function signIn(page: import("@playwright/test").Page, email: string, password: string) {
    await page.goto("/auth");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await page.waitForURL((url) => !/\/auth(\?|$)/.test(url.pathname), { timeout: 15_000 });
  }

  test("client and CPA exchange messages and both see them within 5s", async ({ browser }) => {
    const clientCtx = await browser.newContext();
    const cpaCtx = await browser.newContext();
    const clientPage = await clientCtx.newPage();
    const cpaPage = await cpaCtx.newPage();

    await signIn(clientPage, CLIENT_EMAIL!, CLIENT_PASSWORD!);
    await signIn(cpaPage, CPA_EMAIL!, CPA_PASSWORD!);

    await clientPage.goto(`/project/${PROJECT_ID}`);
    await cpaPage.goto(`/cpa/engagements/${PROJECT_ID}`);

    const stamp = Date.now();
    const fromClient = `hello from client ${stamp}`;
    const fromCpa = `reply from cpa ${stamp}`;

    // Client → CPA
    await clientPage.getByPlaceholder(/message|type/i).first().fill(fromClient);
    await clientPage.keyboard.press("Enter");
    await expect(cpaPage.getByText(fromClient)).toBeVisible({ timeout: 5_000 });

    // CPA → Client
    await cpaPage.getByPlaceholder(/message|type/i).first().fill(fromCpa);
    await cpaPage.keyboard.press("Enter");
    await expect(clientPage.getByText(fromCpa)).toBeVisible({ timeout: 5_000 });

    // Persists across reload on both sides
    await clientPage.reload();
    await cpaPage.reload();
    await expect(clientPage.getByText(fromClient)).toBeVisible();
    await expect(cpaPage.getByText(fromCpa)).toBeVisible();

    await clientCtx.close();
    await cpaCtx.close();
  });
});
