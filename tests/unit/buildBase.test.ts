// @vitest-environment node
import { describe, it, expect, afterAll } from "vitest";
import { build } from "vite";
import path from "path";
import fs from "fs";

describe("Base-path build verification (GitHub Pages deploy)", () => {
  const fixtureDir = path.resolve(__dirname, "./fixtures");
  const outDir = path.resolve(fixtureDir, "dist-out");
  const fixtureHtml = path.join(fixtureDir, "index.html");
  const fixtureJs = path.join(fixtureDir, "test.js");

  afterAll(() => {
    fs.rmSync(fixtureDir, { recursive: true, force: true });
  });

  it("correctly prefixes asset references when VITE_BASE is specified", async () => {
    fs.mkdirSync(fixtureDir, { recursive: true });
    fs.writeFileSync(fixtureJs, 'console.log("base-path test");');
    fs.writeFileSync(
      fixtureHtml,
      '<!DOCTYPE html><html><head></head><body><script type="module" src="./test.js"></script></body></html>',
    );

    await build({
      root: fixtureDir,
      base: "/museum-of-us/",
      configFile: false,
      build: {
        outDir,
        write: true,
      },
      logLevel: "silent",
    });

    const indexHtml = fs.readFileSync(path.join(outDir, "index.html"), "utf-8");
    expect(indexHtml).toContain("/museum-of-us/");
    expect(indexHtml).toContain('src="/museum-of-us/');
  }, 10000);
});
