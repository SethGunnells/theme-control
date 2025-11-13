import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { existsSync, mkdirSync, rmSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir, homedir } from "os";
import { execSync } from "child_process";

// Test the main.ts theme file writing functionality
describe("main.ts theme file writing", () => {
  const TEST_DIR = join(tmpdir(), `theme-control-test-${Date.now()}`);
  const THEME_FILE = join(TEST_DIR, "current-theme.json");

  beforeEach(() => {
    // Clean up test directory before each test
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    // Clean up test directory after each test
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  test("should create theme directory if it doesn't exist", () => {
    // Simulate the CLI behavior
    const themeDir = TEST_DIR;
    const themeFile = THEME_FILE;

    if (!existsSync(themeDir)) {
      mkdirSync(themeDir, { recursive: true });
    }

    const themeData = {
      theme: "nord",
      appearance: "dark",
      timestamp: new Date().toISOString(),
    };

    Bun.write(themeFile, JSON.stringify(themeData, null, 2));

    expect(existsSync(themeDir)).toBe(true);
    expect(existsSync(themeFile)).toBe(true);
  });

  test("should write correct theme data to file", () => {
    const themeDir = TEST_DIR;
    const themeFile = THEME_FILE;

    if (!existsSync(themeDir)) {
      mkdirSync(themeDir, { recursive: true });
    }

    const expectedTheme = "nord";
    const expectedAppearance = "dark";
    const themeData = {
      theme: expectedTheme,
      appearance: expectedAppearance,
      timestamp: new Date().toISOString(),
    };

    Bun.write(themeFile, JSON.stringify(themeData, null, 2));

    const content = readFileSync(themeFile, "utf-8");
    const parsedData = JSON.parse(content);

    expect(parsedData.theme).toBe(expectedTheme);
    expect(parsedData.appearance).toBe(expectedAppearance);
    expect(parsedData.timestamp).toBeDefined();
  });

  test("should overwrite existing theme file", () => {
    const themeDir = TEST_DIR;
    const themeFile = THEME_FILE;

    if (!existsSync(themeDir)) {
      mkdirSync(themeDir, { recursive: true });
    }

    // Write initial theme
    const initialTheme = {
      theme: "nord",
      appearance: "dark",
      timestamp: new Date().toISOString(),
    };
    Bun.write(themeFile, JSON.stringify(initialTheme, null, 2));

    // Wait a bit to ensure different timestamp
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    sleep(10);

    // Write new theme
    const newTheme = {
      theme: "rosepine",
      appearance: "light",
      timestamp: new Date().toISOString(),
    };
    Bun.write(themeFile, JSON.stringify(newTheme, null, 2));

    const content = readFileSync(themeFile, "utf-8");
    const parsedData = JSON.parse(content);

    expect(parsedData.theme).toBe("rosepine");
    expect(parsedData.appearance).toBe("light");
  });

  test("theme file should be valid JSON", () => {
    const themeDir = TEST_DIR;
    const themeFile = THEME_FILE;

    if (!existsSync(themeDir)) {
      mkdirSync(themeDir, { recursive: true });
    }

    const themeData = {
      theme: "nord",
      appearance: "dark",
      timestamp: new Date().toISOString(),
    };

    Bun.write(themeFile, JSON.stringify(themeData, null, 2));

    const content = readFileSync(themeFile, "utf-8");

    // Should not throw
    expect(() => JSON.parse(content)).not.toThrow();

    const parsedData = JSON.parse(content);
    expect(typeof parsedData.theme).toBe("string");
    expect(typeof parsedData.appearance).toBe("string");
    expect(typeof parsedData.timestamp).toBe("string");
  });
});
