#!/usr/bin/env node
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
dotenv.config({ path: path.join(__dirname, ".env") });

import { prisma } from "@calcom/prisma";

async function setupJitsiApp() {
  try {
    console.log("🔍 Checking for Jitsi app in database...\n");

    // Check if jitsi app exists
    const existingApp = await prisma.app.findFirst({
      where: {
        OR: [
          { slug: "jitsi" },
          { dirName: "jitsivideo" }
        ]
      }
    });

    // The keys that should be stored for the app
    const jitsiKeys = {
      jitsiHost: "https://meet.leadnest.ai",
      jitsiPathPattern: "{Title}-{uuid}"
    };

    if (existingApp) {
      console.log("✏️  Found existing Jitsi app, updating it...");
      console.log("   Current keys:", existingApp.keys);

      const updated = await prisma.app.update({
        where: { id: existingApp.id },
        data: {
          slug: "jitsi",
          dirName: "jitsivideo",
          keys: jitsiKeys,
          enabled: true,
          categories: ["conferencing"]
        }
      });

      console.log("✅ Jitsi app updated successfully!");
      console.log("   New keys:", updated.keys);
      console.log("   Enabled:", updated.enabled);
    } else {
      console.log("📝 Creating new Jitsi app...");

      const created = await prisma.app.create({
        data: {
          slug: "jitsi",
          dirName: "jitsivideo",
          keys: jitsiKeys,
          enabled: true,
          categories: ["conferencing"]
        }
      });

      console.log("✅ Jitsi app created successfully!");
      console.log("   Keys:", created.keys);
      console.log("   Enabled:", created.enabled);
    }

    // Also check for credentials
    console.log("\n🔍 Checking credential types...");
    const credentials = await prisma.credential.findMany({
      where: {
        type: {
          in: ["leadnest_video", "jitsi_video", "Leadnest_video"]
        }
      },
      select: {
        id: true,
        type: true,
        user: { select: { email: true } },
        team: { select: { name: true } }
      },
      take: 5
    });

    if (credentials.length > 0) {
      console.log(`Found ${credentials.length} credential(s):`);
      credentials.forEach(cred => {
        const owner = cred.user?.email || cred.team?.name || "Unknown";
        console.log(`   - Type: ${cred.type}, Owner: ${owner}`);
      });
    } else {
      console.log("   No credentials found (this is OK, they'll be created on first use)");
    }

    console.log("\n✨ Jitsi setup complete!");
    console.log("   Next steps:");
    console.log("   1. Restart Cal.com: pm2 restart calcom (or docker-compose restart)");
    console.log("   2. Go to Apps section");
    console.log("   3. You should now see 'Leadnest Video' available");

  } catch (error) {
    console.error("❌ Error setting up Jitsi:", error);
  }
}

setupJitsiApp();
