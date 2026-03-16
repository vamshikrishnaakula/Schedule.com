#!/usr/bin/env node
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

import { prisma } from "@calcom/prisma";

async function checkJitsi() {
  try {
    console.log("🔍 Checking Jitsi app in database...\n");

    const apps = await prisma.app.findMany({
      where: {
        OR: [
          { slug: "jitsi" },
          { dirName: "jitsivideo" },
          { slug: "leadnestvideo" }
        ]
      }
    });

    if (apps.length === 0) {
      console.log("❌ No Jitsi apps found in database!");
      console.log("   This means the app was not seeded properly.");
    } else {
      console.log("✅ Found Jitsi apps:");
      apps.forEach(app => {
        console.log("   - Slug:", app.slug);
        console.log("   - DirName:", app.dirName);
        console.log("   - Enabled:", app.enabled);
        console.log("   - Categories:", app.categories);
        console.log("   - Keys:", app.keys);
        console.log("   ---");
      });
    }

    // Also check credentials
    const credentials = await prisma.credential.findMany({
      where: {
        type: {
          in: ["leadnest_video", "jitsi_video", "Leadnest_video"]
        }
      },
      select: {
        id: true,
        type: true,
        userId: true,
        teamId: true
      }
    });

    console.log("\n🔍 Checking credentials...");
    if (credentials.length === 0) {
      console.log("   No Jitsi credentials found (this is OK)");
    } else {
      console.log("   Found credentials:", credentials.length);
      credentials.forEach(cred => {
        console.log("   - Type:", cred.type, "User:", cred.userId, "Team:", cred.teamId);
      });
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkJitsi();