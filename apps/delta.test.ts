import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  APP_NAME,
  resolveConfig,
  updateIfEnabled,
  type DeltaAppConfig,
} from "./delta";
import type { Context } from "../context";
import type { Appearance } from "../themes";

// Create a test directory
const TEST_DIR = join(tmpdir(), `delta-test-${Date.now()}`);
const TEST_CONFIG_PATH = join(TEST_DIR, "gitconfig");
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
        enabled: overrides.enabled ?? ["delta"],
        bat: {
          configPath: "/tmp/bat-config",
          themesPath: overrides.themesPath ?? TEST_THEMES_PATH,
        },
        delta: {
          configPath: overrides.configPath ?? TEST_CONFIG_PATH,
        },
      },
    },
    log: mockLogger,
    os: "darwin",
  };
}

describe("delta module", () => {
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
    test("should return default path when no config provided", () => {
      const config = resolveConfig();
      expect(config.configPath).toContain(".gitconfig");
    });

    test("should use custom configPath when provided", () => {
      const customPath = "/custom/gitconfig";
      const config = resolveConfig({ configPath: customPath });
      expect(config.configPath).toBe(customPath);
    });
  });

  describe("updateIfEnabled", () => {
    test("should skip when delta is not enabled", async () => {
      const context = createTestContext({ enabled: ["bat"] });

      await updateIfEnabled("dark", "nord", context);

      expect(context.log.debug).toHaveBeenCalledWith(
        "Skipping delta: not enabled",
      );
      expect(existsSync(TEST_CONFIG_PATH)).toBe(false);
    });

    test("should create git config with delta theme when it doesn't exist", async () => {
      const context = createTestContext({});

      await updateIfEnabled("dark", "nord", context);

      expect(existsSync(TEST_CONFIG_PATH)).toBe(true);

      const content = readFileSync(TEST_CONFIG_PATH, "utf-8");
      expect(content).toContain("delta");
      expect(content).toContain("syntax-theme");
      expect(content).toContain("Nord");
    });

    test("should set delta.syntax-theme to resolved theme", async () => {
      const context = createTestContext({});

      await updateIfEnabled("dark", "rosepine", context);

      const content = readFileSync(TEST_CONFIG_PATH, "utf-8");
      expect(content).toContain("[delta]");
      expect(content).toContain("syntax-theme = rose-pine");
    });

    test("should update existing delta.syntax-theme in git config", async () => {
      const context = createTestContext({});

      // Create initial config with a theme
      writeFileSync(TEST_CONFIG_PATH, "[delta]\n\tsyntax-theme = base16\n");

      await updateIfEnabled("dark", "nord", context);

      const content = readFileSync(TEST_CONFIG_PATH, "utf-8");
      expect(content).toContain("syntax-theme = Nord");
      expect(content).not.toContain("syntax-theme = base16");
    });

    test("should use default theme when theme not found in mapping", async () => {
      const context = createTestContext({});

      // Use an invalid theme that doesn't exist in the theme map
      // This should fall back to the default theme
      await updateIfEnabled("dark", "foobar" as any, context);

      const content = readFileSync(TEST_CONFIG_PATH, "utf-8");
      // Should resolve to the default dark theme
      expect(content).toContain("syntax-theme = base16");
    });

    test("should use light theme for light appearance", async () => {
      const context = createTestContext({});

      await updateIfEnabled("light", "rosepine", context);

      const content = readFileSync(TEST_CONFIG_PATH, "utf-8");
      expect(content).toContain("syntax-theme = rose-pine-dawn");
    });

    test("should install bat themes when updating delta", async () => {
      const context = createTestContext({});

      await updateIfEnabled("dark", "nord", context);

      // Verify bat themes directory was created
      expect(existsSync(TEST_THEMES_PATH)).toBe(true);

      // Verify theme files were installed
      const rosePineFile = join(TEST_THEMES_PATH, "rose-pine.tmTheme");
      const rosePineDawnFile = join(TEST_THEMES_PATH, "rose-pine-dawn.tmTheme");

      expect(existsSync(rosePineFile)).toBe(true);
      expect(existsSync(rosePineDawnFile)).toBe(true);
    });

    test("should force update themes when forceUpdateThemes is true", async () => {
      const context = createTestContext({});

      // Create themes directory with old content
      mkdirSync(TEST_THEMES_PATH, { recursive: true });
      const rosePineFile = join(TEST_THEMES_PATH, "rose-pine.tmTheme");
      writeFileSync(rosePineFile, "old content");

      await updateIfEnabled("dark", "nord", context, true);

      const content = readFileSync(rosePineFile, "utf-8");
      expect(content).not.toBe("old content");
      expect(content.length).toBeGreaterThan(0);
    });

    test("should preserve existing git config sections", async () => {
      const context = createTestContext({});

      // Create config with other sections
      writeFileSync(
        TEST_CONFIG_PATH,
        "[user]\n\tname = Test User\n\temail = test@example.com\n[core]\n\teditor = vim\n",
      );

      await updateIfEnabled("dark", "nord", context);

      const content = readFileSync(TEST_CONFIG_PATH, "utf-8");
      expect(content).toContain("[user]");
      expect(content).toContain("name = Test User");
      expect(content).toContain("[core]");
      expect(content).toContain("editor = vim");
      expect(content).toContain("syntax-theme = Nord");
    });
  });
});
