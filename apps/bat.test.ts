import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  APP_NAME,
  resolveConfig,
  themes,
  installThemes,
  updateIfEnabled,
  type BatAppConfig,
} from "./bat";
import type { Context } from "../context";
import type { Appearance } from "../themes";

// Import theme files for content verification using Bun.file
const rosePineThemeFile = Bun.file(new URL("../bat-themes/rose-pine.tmTheme", import.meta.url));
const rosePineDawnThemeFile = Bun.file(new URL("../bat-themes/rose-pine-dawn.tmTheme", import.meta.url));

// Create a test directory
const TEST_DIR = join(tmpdir(), `bat-test-${Date.now()}`);
const TEST_CONFIG_PATH = join(TEST_DIR, "config");
const TEST_THEMES_PATH = join(TEST_DIR, "themes");

// Test utility to create context with minimal required fields
function createTestContext(overrides: {
  enabled?: string[];
  configPath?: string;
  themesPath?: string;
  logLevel?: number;
}): Context {
  const mockLogger = {
    debug: mock(() => {}),
    info: mock(() => {}),
    warn: mock(() => {}),
    error: mock(() => {}),
  };

  return {
    config: {
      log_level: overrides.logLevel ?? 2,
      apps: {
        enabled: overrides.enabled ?? ["bat"],
        bat: {
          configPath: overrides.configPath ?? TEST_CONFIG_PATH,
          themesPath: overrides.themesPath ?? TEST_THEMES_PATH,
        },
        delta: {
          configPath: "/tmp/gitconfig",
        },
      },
    },
    log: mockLogger,
    os: "darwin",
  };
}

describe("bat module", () => {
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

  describe("resolveConfig", () => {
    test("should return default paths when no config provided", () => {
      const config = resolveConfig();
      expect(config.configPath).toContain(".config/bat/config");
      expect(config.themesPath).toContain(".config/bat/themes");
    });

    test("should use custom configPath when provided", () => {
      const customPath = "/custom/bat/config";
      const config = resolveConfig({ configPath: customPath });
      expect(config.configPath).toBe(customPath);
      expect(config.themesPath).toContain(".config/bat/themes");
    });

    test("should use custom themesPath when provided", () => {
      const customPath = "/custom/bat/themes";
      const config = resolveConfig({ themesPath: customPath });
      expect(config.configPath).toContain(".config/bat/config");
      expect(config.themesPath).toBe(customPath);
    });

    test("should use both custom paths when provided", () => {
      const customConfigPath = "/custom/bat/config";
      const customThemesPath = "/custom/bat/themes";
      const config = resolveConfig({
        configPath: customConfigPath,
        themesPath: customThemesPath,
      });
      expect(config.configPath).toBe(customConfigPath);
      expect(config.themesPath).toBe(customThemesPath);
    });
  });

  describe("installThemes", () => {
    test("should create themes directory if it doesn't exist", async () => {
      const mockLogger = {
        debug: mock(() => {}),
        info: mock(() => {}),
        warn: mock(() => {}),
        error: mock(() => {}),
      };

      expect(existsSync(TEST_THEMES_PATH)).toBe(false);

      await installThemes(TEST_THEMES_PATH, false, mockLogger);

      expect(existsSync(TEST_THEMES_PATH)).toBe(true);
    });

    test("should install theme files when they don't exist", async () => {
      const mockLogger = {
        debug: mock(() => {}),
        info: mock(() => {}),
        warn: mock(() => {}),
        error: mock(() => {}),
      };

      mkdirSync(TEST_THEMES_PATH, { recursive: true });

      await installThemes(TEST_THEMES_PATH, false, mockLogger);

      const rosePineFile = join(TEST_THEMES_PATH, "rose-pine.tmTheme");
      const rosePineDawnFile = join(TEST_THEMES_PATH, "rose-pine-dawn.tmTheme");

      expect(existsSync(rosePineFile)).toBe(true);
      expect(existsSync(rosePineDawnFile)).toBe(true);

      // Verify files match the imported theme files
      const expectedRosePineContent = await rosePineThemeFile.text();
      const expectedRosePineDawnContent = await rosePineDawnThemeFile.text();
      
      const rosePineContent = readFileSync(rosePineFile, "utf-8");
      const rosePineDawnContent = readFileSync(rosePineDawnFile, "utf-8");

      expect(rosePineContent).toBe(expectedRosePineContent);
      expect(rosePineDawnContent).toBe(expectedRosePineDawnContent);
    });

    test("should update theme files when forceUpdate is true", async () => {
      const mockLogger = {
        debug: mock(() => {}),
        info: mock(() => {}),
        warn: mock(() => {}),
        error: mock(() => {}),
      };

      mkdirSync(TEST_THEMES_PATH, { recursive: true });

      const rosePineFile = join(TEST_THEMES_PATH, "rose-pine.tmTheme");
      writeFileSync(rosePineFile, "old content");

      await installThemes(TEST_THEMES_PATH, true, mockLogger);

      const content = readFileSync(rosePineFile, "utf-8");
      expect(content).not.toBe("old content");
      expect(content.length).toBeGreaterThan(0);
    });

    test("should not reinstall themes if they already exist and forceUpdate is false", async () => {
      const mockLogger = {
        debug: mock(() => {}),
        info: mock(() => {}),
        warn: mock(() => {}),
        error: mock(() => {}),
      };

      mkdirSync(TEST_THEMES_PATH, { recursive: true });

      const rosePineFile = join(TEST_THEMES_PATH, "rose-pine.tmTheme");
      const rosePineDawnFile = join(TEST_THEMES_PATH, "rose-pine-dawn.tmTheme");
      const testContent = "existing content";

      writeFileSync(rosePineFile, testContent);
      writeFileSync(rosePineDawnFile, testContent);

      await installThemes(TEST_THEMES_PATH, false, mockLogger);

      expect(readFileSync(rosePineFile, "utf-8")).toBe(testContent);
      expect(readFileSync(rosePineDawnFile, "utf-8")).toBe(testContent);
    });
  });

  describe("updateIfEnabled", () => {
    test("should skip when bat is not enabled", async () => {
      const context = createTestContext({ enabled: ["delta"] });

      await updateIfEnabled("dark", "nord", context);

      expect(context.log.debug).toHaveBeenCalledWith("Skipping bat: not enabled");
      expect(existsSync(TEST_CONFIG_PATH)).toBe(false);
    });

    test("should create config file with theme when it doesn't exist", async () => {
      const context = createTestContext({});

      await updateIfEnabled("dark", "nord", context);

      expect(existsSync(TEST_CONFIG_PATH)).toBe(true);

      const content = readFileSync(TEST_CONFIG_PATH, "utf-8");
      expect(content).toContain('--theme="Nord"');
    });

    test("should replace existing theme in config file", async () => {
      const context = createTestContext({});

      // Create initial config with a theme
      writeFileSync(TEST_CONFIG_PATH, '--theme="base16"\n--paging=never\n');

      await updateIfEnabled("dark", "nord", context);

      const content = readFileSync(TEST_CONFIG_PATH, "utf-8");
      expect(content).toContain('--theme="Nord"');
      expect(content).not.toContain('--theme="base16"');
      expect(content).toContain("--paging=never");
    });

    test("should append theme to config with existing content but no theme", async () => {
      const context = createTestContext({});

      // Create config without theme
      writeFileSync(TEST_CONFIG_PATH, "--paging=never\n--style=numbers,grid\n");

      await updateIfEnabled("light", "rosepine", context);

      const content = readFileSync(TEST_CONFIG_PATH, "utf-8");
      expect(content).toContain('--theme="rose-pine-dawn"');
      expect(content).toContain("--paging=never");
      expect(content).toContain("--style=numbers,grid");
    });

    test("should use default theme when theme not found in mapping", async () => {
      const context = createTestContext({});

      // Use an invalid theme that doesn't exist in the theme map
      // This should fall back to the default theme
      await updateIfEnabled("dark", "foobar" as any, context);

      const content = readFileSync(TEST_CONFIG_PATH, "utf-8");
      // Should resolve to the default dark theme
      expect(content).toContain('--theme="base16"');
    });
  });
});
