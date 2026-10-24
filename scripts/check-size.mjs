import fs from "fs";
import path from "path";
import zlib from "zlib";

const distDir = path.resolve("dist");
if (!fs.existsSync(distDir)) {
  console.error(
    'Error: dist directory does not exist. Run "npm run build" first.',
  );
  process.exit(1);
}

const assetsDir = path.join(distDir, "assets");
if (!fs.existsSync(assetsDir)) {
  console.error("Error: dist/assets directory does not exist.");
  process.exit(1);
}

const files = fs.readdirSync(assetsDir);
const jsFiles = files.filter((f) => f.endsWith(".js"));

console.log("Build JS Assets:");
let entryFile = null;
let threeFile = null;

for (const file of jsFiles) {
  const filePath = path.join(assetsDir, file);
  const content = fs.readFileSync(filePath);
  const gzipped = zlib.gzipSync(content);
  const sizeKb = (content.length / 1024).toFixed(2);
  const gzipKb = (gzipped.length / 1024).toFixed(2);
  console.log(` - ${file}: ${sizeKb} KB (gzipped: ${gzipKb} KB)`);

  if (file.startsWith("index") || (!file.includes("three") && !entryFile)) {
    entryFile = {
      name: file,
      sizeKb,
      gzipKb: parseFloat(gzipKb),
      content: content.toString("utf-8"),
    };
  }
  if (file.includes("three") || file.includes("3d")) {
    threeFile = { name: file, sizeKb, gzipKb: parseFloat(gzipKb) };
  }
}

// Read index.html to find the real entry point script
const indexHtml = fs.readFileSync(path.join(distDir, "index.html"), "utf-8");
const entryMatch = indexHtml.match(/src="\/assets\/([^"]+)"/);
if (entryMatch) {
  const realEntryName = entryMatch[1];
  const realEntryPath = path.join(assetsDir, realEntryName);
  if (fs.existsSync(realEntryPath)) {
    const content = fs.readFileSync(realEntryPath);
    const gzipped = zlib.gzipSync(content);
    entryFile = {
      name: realEntryName,
      sizeKb: (content.length / 1024).toFixed(2),
      gzipKb: parseFloat((gzipped.length / 1024).toFixed(2)),
      content: content.toString("utf-8"),
    };
  }
}

if (!entryFile) {
  console.error("Error: Could not locate entry JS file.");
  process.exit(1);
}

console.log(`\nEntry bundle (${entryFile.name}): ${entryFile.gzipKb} KB gzip`);

const MAX_ENTRY_GZIP_KB = 200;
if (entryFile.gzipKb > MAX_ENTRY_GZIP_KB) {
  console.error(
    `FAILED: Entry bundle (${entryFile.gzipKb} KB gzip) exceeds budget of ${MAX_ENTRY_GZIP_KB} KB!`,
  );
  process.exit(1);
}

console.log(`PASSED: Entry bundle is within ${MAX_ENTRY_GZIP_KB} KB budget.`);

// Verify Three.js is separated
if (threeFile) {
  console.log(`PASSED: 3D chunk (${threeFile.name}) is lazy and separate.`);
} else {
  // If dynamic import chunk has hash name, check that entry does not bundle THREE
  if (
    entryFile.content.includes("WebGLRenderer") ||
    entryFile.content.includes("PerspectiveCamera")
  ) {
    console.error(
      "FAILED: Entry bundle appears to contain Three.js symbols directly instead of being lazy-loaded!",
    );
    process.exit(1);
  } else {
    console.log("PASSED: 3D symbols are not bundled in entry file.");
  }
}
