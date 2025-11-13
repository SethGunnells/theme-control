import { describe, test, expect } from "bun:test";
import { resolveConfig, updateIfEnabled } from "./macos";
import { createTestContext } from "../tests/utils";

describe("macos module", () => {
  describe("resolveConfig", () => {
    test("should enable by default when no config provided", () => {
      const config = resolveConfig();
      expect(config.enabled).toBe(true);
    });

    test("should use custom enabled value when provided", () => {
      const config = resolveConfig({ enabled: false });
      expect(config.enabled).toBe(false);
    });
  });

  describe("updateIfEnabled", () => {
    test("should skip when macos is not enabled", async () => {
      const context = createTestContext({ apps: { enabled: [] } });

      // Should not throw
      await updateIfEnabled("dark", context);
    });

    test("should skip when OS is not darwin", async () => {
      const context = createTestContext({
        apps: { enabled: ["macos"] },
      });
      context.os = "linux";

      // Should not throw
      await updateIfEnabled("dark", context);
    });

    test("should update system appearance to dark for darwin OS", async () => {
      const context = createTestContext({
        apps: { enabled: ["macos"] },
      });

      // Should not throw in test environment
      await updateIfEnabled("dark", context);
    });

    test("should update system appearance to light for darwin OS", async () => {
      const context = createTestContext({
        apps: { enabled: ["macos"] },
      });

      // Should not throw in test environment
      await updateIfEnabled("light", context);
    });
  });
});
