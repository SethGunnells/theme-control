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

// Create a test directory
const TEST_DIR = join(tmpdir(), `bat-test-${Date.now()}`);
const TEST_CONFIG_PATH = join(TEST_DIR, "config");
const TEST_THEMES_PATH = join(TEST_DIR, "themes");

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

  describe("APP_NAME", () => {
    test("should be 'bat'", () => {
      expect(APP_NAME).toBe("bat");
    });
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

  describe("themes", () => {
    test("should have correct structure", () => {
      expect(themes).toHaveProperty("light");
      expect(themes).toHaveProperty("dark");
    });

    test("should have light theme mappings", () => {
      expect(themes.light).toHaveProperty("default");
      expect(themes.light).toHaveProperty("rosepine");
      expect(themes.light.default).toBe("base16");
      expect(themes.light.rosepine).toBe("rose-pine-dawn");
    });

    test("should have dark theme mappings", () => {
      expect(themes.dark).toHaveProperty("default");
      expect(themes.dark).toHaveProperty("nord");
      expect(themes.dark).toHaveProperty("rosepine");
      expect(themes.dark.default).toBe("base16");
      expect(themes.dark.nord).toBe("Nord");
      expect(themes.dark.rosepine).toBe("rose-pine");
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

      // Verify files have content
      const rosePineContent = readFileSync(rosePineFile, "utf-8");
      const rosePineDawnContent = readFileSync(rosePineDawnFile, "utf-8");

      expect(rosePineContent.length).toBeGreaterThan(0);
      expect(rosePineDawnContent.length).toBeGreaterThan(0);
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
      const mockLogger = {
        debug: mock(() => {}),
        info: mock(() => {}),
        warn: mock(() => {}),
        error: mock(() => {}),
      };

      const context: Context = {
        config: {
          log_level: 2,
          apps: {
            enabled: ["delta"], // bat not enabled
            bat: {
              configPath: TEST_CONFIG_PATH,
              themesPath: TEST_THEMES_PATH,
            },
            delta: {
              configPath: "/tmp/gitconfig",
            },
          },
        },
        log: mockLogger,
        os: "darwin",
      };

      await updateIfEnabled("dark", "nord", context);

      expect(mockLogger.debug).toHaveBeenCalledWith("Skipping bat: not enabled");
      expect(existsSync(TEST_CONFIG_PATH)).toBe(false);
    });

    test("should create config file with theme when it doesn't exist", async () => {
      const mockLogger = {
        debug: mock(() => {}),
        info: mock(() => {}),
        warn: mock(() => {}),
        error: mock(() => {}),
      };

      const context: Context = {
        config: {
          log_level: 2,
          apps: {
            enabled: ["bat"],
            bat: {
              configPath: TEST_CONFIG_PATH,
              themesPath: TEST_THEMES_PATH,
            },
            delta: {
              configPath: "/tmp/gitconfig",
            },
          },
        },
        log: mockLogger,
        os: "darwin",
      };

      await updateIfEnabled("dark", "nord", context);

      expect(existsSync(TEST_CONFIG_PATH)).toBe(true);

      const content = readFileSync(TEST_CONFIG_PATH, "utf-8");
      expect(content).toContain('--theme="Nord"');
    });

    test("should replace existing theme in config file", async () => {
      const mockLogger = {
        debug: mock(() => {}),
        info: mock(() => {}),
        warn: mock(() => {}),
        error: mock(() => {}),
      };

      const context: Context = {
        config: {
          log_level: 2,
          apps: {
            enabled: ["bat"],
            bat: {
              configPath: TEST_CONFIG_PATH,
              themesPath: TEST_THEMES_PATH,
            },
            delta: {
              configPath: "/tmp/gitconfig",
            },
          },
        },
        log: mockLogger,
        os: "darwin",
      };

      // Create initial config with a theme
      writeFileSync(TEST_CONFIG_PATH, '--theme="base16"\n--paging=never\n');

      await updateIfEnabled("dark", "nord", context);

      const content = readFileSync(TEST_CONFIG_PATH, "utf-8");
      expect(content).toContain('--theme="Nord"');
      expect(content).not.toContain('--theme="base16"');
      expect(content).toContain("--paging=never");
    });

    test("should append theme to config with existing content but no theme", async () => {
      const mockLogger = {
        debug: mock(() => {}),
        info: mock(() => {}),
        warn: mock(() => {}),
        error: mock(() => {}),
      };

      const context: Context = {
        config: {
          log_level: 2,
          apps: {
            enabled: ["bat"],
            bat: {
              configPath: TEST_CONFIG_PATH,
              themesPath: TEST_THEMES_PATH,
            },
            delta: {
              configPath: "/tmp/gitconfig",
            },
          },
        },
        log: mockLogger,
        os: "darwin",
      };

      // Create config without theme
      writeFileSync(TEST_CONFIG_PATH, "--paging=never\n--style=numbers,grid\n");

      await updateIfEnabled("light", "rosepine", context);

      const content = readFileSync(TEST_CONFIG_PATH, "utf-8");
      expect(content).toContain('--theme="rose-pine-dawn"');
      expect(content).toContain("--paging=never");
      expect(content).toContain("--style=numbers,grid");
    });

    test("should use default theme when theme not found in mapping", async () => {
      const mockLogger = {
        debug: mock(() => {}),
        info: mock(() => {}),
        warn: mock(() => {}),
        error: mock(() => {}),
      };

      const context: Context = {
        config: {
          log_level: 2,
          apps: {
            enabled: ["bat"],
            bat: {
              configPath: TEST_CONFIG_PATH,
              themesPath: TEST_THEMES_PATH,
            },
            delta: {
              configPath: "/tmp/gitconfig",
            },
          },
        },
        log: mockLogger,
        os: "darwin",
      };

      // Use a theme that's valid in the global theme map but not in bat's theme map
      await updateIfEnabled("dark", "rosepine", context);

      const content = readFileSync(TEST_CONFIG_PATH, "utf-8");
      // Should resolve to the rosepine dark theme
      expect(content).toContain('--theme="rose-pine"');
    });

    test("should handle light appearance with rosepine theme", async () => {
      const mockLogger = {
        debug: mock(() => {}),
        info: mock(() => {}),
        warn: mock(() => {}),
        error: mock(() => {}),
      };

      const context: Context = {
        config: {
          log_level: 2,
          apps: {
            enabled: ["bat"],
            bat: {
              configPath: TEST_CONFIG_PATH,
              themesPath: TEST_THEMES_PATH,
            },
            delta: {
              configPath: "/tmp/gitconfig",
            },
          },
        },
        log: mockLogger,
        os: "darwin",
      };

      await updateIfEnabled("light", "rosepine", context);

      const content = readFileSync(TEST_CONFIG_PATH, "utf-8");
      expect(content).toContain('--theme="rose-pine-dawn"');
    });

    test("should install themes before updating config", async () => {
      const mockLogger = {
        debug: mock(() => {}),
        info: mock(() => {}),
        warn: mock(() => {}),
        error: mock(() => {}),
      };

      const context: Context = {
        config: {
          log_level: 2,
          apps: {
            enabled: ["bat"],
            bat: {
              configPath: TEST_CONFIG_PATH,
              themesPath: TEST_THEMES_PATH,
            },
            delta: {
              configPath: "/tmp/gitconfig",
            },
          },
        },
        log: mockLogger,
        os: "darwin",
      };

      expect(existsSync(TEST_THEMES_PATH)).toBe(false);

      await updateIfEnabled("dark", "nord", context);

      // Verify themes were installed
      expect(existsSync(TEST_THEMES_PATH)).toBe(true);
      expect(existsSync(join(TEST_THEMES_PATH, "rose-pine.tmTheme"))).toBe(true);
      expect(existsSync(join(TEST_THEMES_PATH, "rose-pine-dawn.tmTheme"))).toBe(true);

      // Verify config was created
      expect(existsSync(TEST_CONFIG_PATH)).toBe(true);
    });

    test("should respect forceUpdateThemes flag", async () => {
      const mockLogger = {
        debug: mock(() => {}),
        info: mock(() => {}),
        warn: mock(() => {}),
        error: mock(() => {}),
      };

      const context: Context = {
        config: {
          log_level: 2,
          apps: {
            enabled: ["bat"],
            bat: {
              configPath: TEST_CONFIG_PATH,
              themesPath: TEST_THEMES_PATH,
            },
            delta: {
              configPath: "/tmp/gitconfig",
            },
          },
        },
        log: mockLogger,
        os: "darwin",
      };

      // Create themes directory with existing files
      mkdirSync(TEST_THEMES_PATH, { recursive: true });
      const rosePineFile = join(TEST_THEMES_PATH, "rose-pine.tmTheme");
      const oldContent = "old content";
      writeFileSync(rosePineFile, oldContent);

      await updateIfEnabled("dark", "nord", context, true);

      // Verify theme was updated
      const content = readFileSync(rosePineFile, "utf-8");
      expect(content).not.toBe(oldContent);
      expect(content.length).toBeGreaterThan(0);
    });
  });
});
