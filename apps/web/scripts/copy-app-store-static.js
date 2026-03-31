import process from "node:process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const glob = require("glob");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const copyAppStoreStatic = () => {
  // Get all static files from app-store packages (relative to apps/web)
  const staticFiles = glob.sync("../../packages/app-store/**/static/**/*", { nodir: true });

  // Object to store icon SVG hashes
  const SVG_HASHES = {};

  staticFiles.forEach((file) => {
    // Normalize path separators for cross-platform compatibility (Windows uses backslashes)
    const normalizedFile = file.replace(/\\/g, "/");
    // Extract app name from path
    const appNameMatch = normalizedFile.match(/app-store\/(.*?)\/static/);
    if (!appNameMatch) return;

    const appName = appNameMatch[1];
    const fileName = path.basename(file);
    const destDir = `public/app-store/${appName}`;
    const destPath = `${destDir}/${fileName}`;

    // Create directory if it doesn't exist
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Copy file
    fs.copyFileSync(file, destPath);

    // Store SVG hash for icon.svg files
    if (fileName === "icon.svg") {
      const fileContents = fs.readFileSync(file);
      const hash = createHash("sha256").update(fileContents).digest("hex").substring(0, 8);
      SVG_HASHES[appName] = hash;
    }
  });

  // Create directory if it doesn't exist
  if (!fs.existsSync("public/app-store")) {
    fs.mkdirSync("public/app-store", { recursive: true });
  }

  // Write SVG hashes to JSON file
  fs.writeFileSync("public/app-store/svg-hashes.json", JSON.stringify(SVG_HASHES, null, 2));
  
  console.log(`✅ Copied ${staticFiles.length} static files`);
};

copyAppStoreStatic();
