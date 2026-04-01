import process from "node:process";
import { syncAppRegistryToDb } from "@calcom/app-store/_utils/syncAppRegistryToDb";
import logger from "@calcom/lib/logger";
import { defaultResponderForAppDir } from "app/api/defaultResponderForAppDir";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const isDryRun: boolean = process.env.CRON_ENABLE_APP_SYNC !== "true";
const logPrefix: string[] = ["[api/cron/syncAppMeta]"];

if (isDryRun) {
  logPrefix.push("(dry-run)");
}

const log: ReturnType<typeof logger.getSubLogger> = logger.getSubLogger({
  prefix: logPrefix,
});

/**
 * syncAppMeta makes sure any app metadata that has been replicated into the database
 * remains synchronized with any changes made to the app config files.
 */
async function postHandler(request: NextRequest): Promise<NextResponse> {
  const apiKey = request.headers.get("authorization") || request.nextUrl.searchParams.get("apiKey");

  if (process.env.CRON_API_KEY !== apiKey) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  log.info(`🧐 Syncing filesystem App Store metadata into Prisma`);

  if (!isDryRun) {
    await syncAppRegistryToDb({ force: true });
  }

  return NextResponse.json({ ok: true, dryRun: isDryRun });
}

export const POST: ReturnType<typeof defaultResponderForAppDir> = defaultResponderForAppDir(postHandler);
