#!/usr/bin/env node
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

import { prisma } from "@calcom/prisma";

async function checkApps() {
  try {
    console.log("🔍 Checking apps in database...\n");

    const apps = await prisma.app.findMany({
      where: {
        OR: [
          { slug: { contains: "jitsi" } },
          { slug: { contains: "leadnest" } },
          { dirName: { contains: "jitsi" } },
          { dirName: { contains: "leadnest" } }
        ]
      },
      select: {
        slug: true,
        dirName: true,
        enabled: true,
        keys: true,
        categories: true
      }
    });

    console.log("Found apps:", apps.length);
    apps.forEach(app => {
      console.log(`- ${app.slug} (${app.dirName}) - Enabled: ${app.enabled}`);
      console.log(`  Categories: ${JSON.stringify(app.categories)}`);
      console.log(`  Keys: ${JSON.stringify(app.keys)}\n`);
    });

    // Also check all conferencing apps
    console.log("📹 All conferencing apps:");
    const conferencingApps = await prisma.app.findMany({
      where: {
        categories: {
          has: "conferencing"
        }
      },
      select: {
        slug: true,
        dirName: true,
        enabled: true
      }
    });

    conferencingApps.forEach(app => {
      console.log(`- ${app.slug} (${app.dirName}) - Enabled: ${app.enabled}`);
    });

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkApps();