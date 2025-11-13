import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { resolveConfig, updateIfEnabled } from "./helix";
import { createTestContext } from "../tests/utils";

// Create a test directory
const TEST_DIR = join(tmpdir(), `helix-test-${Date.now()}`);
const TEST_CONFIG_PATH = join(TEST_DIR, "config.toml");

describe("helix module", () => {
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
      expect(config.configPath).toContain(".config/helix/config.toml");
    });

    test("should use custom configPath when provided", () => {
      const customPath = "/custom/helix/config.toml";
      const config = resolveConfig({ configPath: customPath });
      expect(config.configPath).toBe(customPath);
    });
  });

  describe("updateIfEnabled", () => {
    test("should skip when helix is not enabled", async () => {
      const context = createTestContext({ apps: { enabled: [] } });

      await updateIfEnabled("dark", "nord", context);

      expect(existsSync(TEST_CONFIG_PATH)).toBe(false);
    });

    test("should create config file with theme when it doesn't exist", async () => {
      const context = createTestContext({
        apps: {
          enabled: ["helix"],
          helix: { configPath: TEST_CONFIG_PATH },
        },
      });

      await updateIfEnabled("dark", "nord", context);

      expect(existsSync(TEST_CONFIG_PATH)).toBe(true);

      const content = readFileSync(TEST_CONFIG_PATH, "utf-8");
      expect(content).toContain('theme = "nord"');
    });

    test("should set theme to nord for dark + nord", async () => {
      const context = createTestContext({
        apps: {
          enabled: ["helix"],
          helix: { configPath: TEST_CONFIG_PATH },
        },
      });

      await updateIfEnabled("dark", "nord", context);

      const content = readFileSync(TEST_CONFIG_PATH, "utf-8");
      expect(content).toContain('theme = "nord"');
    });

    test("should set theme to rose_pine for dark + rosepine", async () => {
      const context = createTestContext({
        apps: {
          enabled: ["helix"],
          helix: { configPath: TEST_CONFIG_PATH },
        },
      });

      await updateIfEnabled("dark", "rosepine", context);

      const content = readFileSync(TEST_CONFIG_PATH, "utf-8");
      expect(content).toContain('theme = "rose_pine"');
    });

    test("should set theme to rose_pine_dawn for light + rosepine", async () => {
      const context = createTestContext({
        apps: {
          enabled: ["helix"],
          helix: { configPath: TEST_CONFIG_PATH },
        },
      });

      await updateIfEnabled("light", "rosepine", context);

      const content = readFileSync(TEST_CONFIG_PATH, "utf-8");
      expect(content).toContain('theme = "rose_pine_dawn"');
    });

    test("should update existing theme in config file", async () => {
      const context = createTestContext({
        apps: {
          enabled: ["helix"],
          helix: { configPath: TEST_CONFIG_PATH },
        },
      });

      // Create initial config with a different theme
      writeFileSync(TEST_CONFIG_PATH, 'theme = "default"\n');

      await updateIfEnabled("dark", "nord", context);

      const content = readFileSync(TEST_CONFIG_PATH, "utf-8");
      expect(content).toContain('theme = "nord"');
      expect(content).not.toContain('theme = "default"');
    });

    test("should preserve other config keys when updating theme", async () => {
      const context = createTestContext({
        apps: {
          enabled: ["helix"],
          helix: { configPath: TEST_CONFIG_PATH },
        },
      });

      // Create config with other settings
      writeFileSync(
        TEST_CONFIG_PATH,
        'theme = "default"\n\n[editor]\nline-number = "relative"\nauto-save = true\n',
      );

      await updateIfEnabled("dark", "rosepine", context);

      const content = readFileSync(TEST_CONFIG_PATH, "utf-8");
      expect(content).toContain('theme = "rose_pine"');
      expect(content).toContain("[editor]");
      expect(content).toContain('line-number = "relative"');
      expect(content).toContain("auto-save = true");
    });

    test("should use default theme when theme not found in mapping", async () => {
      const context = createTestContext({
        apps: {
          enabled: ["helix"],
          helix: { configPath: TEST_CONFIG_PATH },
        },
      });

      // Use an invalid theme that doesn't exist in the theme map
      // This should fall back to the default theme
      await updateIfEnabled("dark", "foobar" as any, context);

      const content = readFileSync(TEST_CONFIG_PATH, "utf-8");
      // Should resolve to the default dark theme
      expect(content).toContain('theme = "nord"');
    });

    test("should handle empty config file", async () => {
      const context = createTestContext({
        apps: {
          enabled: ["helix"],
          helix: { configPath: TEST_CONFIG_PATH },
        },
      });

      // Create empty config file
      writeFileSync(TEST_CONFIG_PATH, "");

      await updateIfEnabled("light", "rosepine", context);

      const content = readFileSync(TEST_CONFIG_PATH, "utf-8");
      expect(content).toContain('theme = "rose_pine_dawn"');
    });
  });
});
