#!/usr/bin/env node
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

import { prisma } from "@calcom/prisma";

async function addJitsiApp() {
  try {
    console.log("🔧 Adding Jitsi app to database...\n");

    // Check if app already exists
    const existingApp = await prisma.app.findFirst({
      where: {
        OR: [
          { slug: "jitsi" },
          { dirName: "jitsivideo" }
        ]
      }
    });

    if (existingApp) {
      console.log("✅ Jitsi app already exists, updating it...");
      const updated = await prisma.app.update({
        where: { id: existingApp.id },
        data: {
          slug: "jitsi",
          dirName: "jitsivideo",
          categories: ["conferencing"],
          enabled: true,
          keys: {
            jitsiHost: "https://meet.leadnest.ai",
            jitsiPathPattern: "{Title}-{uuid}"
          }
        }
      });
      console.log("✅ Updated Jitsi app successfully!");
      console.log("   Keys:", updated.keys);
    } else {
      console.log("📝 Creating new Jitsi app...");
      const created = await prisma.app.create({
        data: {
          slug: "jitsi",
          dirName: "jitsivideo",
          categories: ["conferencing"],
          enabled: true,
          keys: {
            jitsiHost: "https://meet.leadnest.ai",
            jitsiPathPattern: "{Title}-{uuid}"
          }
        }
      });
      console.log("✅ Created Jitsi app successfully!");
      console.log("   Keys:", created.keys);
    }

    console.log("\n🎉 Jitsi app is now in the database!");
    console.log("   Next steps:");
    console.log("   1. Restart Cal.com: pkill -f 'turbo run start' && yarn start");
    console.log("   2. Go to Apps section - you should see 'Leadnest Video'");

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addJitsiApp();