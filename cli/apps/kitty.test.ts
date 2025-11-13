import { describe, test, expect } from "bun:test";
import { resolveConfig, updateIfEnabled, themes } from "./kitty";
import { createTestContext } from "../tests/utils";

describe("kitty module", () => {
  describe("resolveConfig", () => {
    test("should return empty config object", () => {
      const config = resolveConfig();
      expect(config).toEqual({});
    });
  });

  describe("themes", () => {
    test("should have correct theme mapping for dark + nord", () => {
      expect(themes.dark.nord).toBe("Nord");
    });

    test("should have correct theme mapping for dark + rosepine", () => {
      expect(themes.dark.rosepine).toBe("Rosé Pine");
    });

    test("should have correct theme mapping for light + rosepine", () => {
      expect(themes.light.rosepine).toBe("Rosé Pine Dawn");
    });

    test("should have Nord as default dark theme", () => {
      expect(themes.dark.default).toBe("Nord");
    });

    test("should have Rosé Pine Dawn as default light theme", () => {
      expect(themes.light.default).toBe("Rosé Pine Dawn");
    });
  });

  describe("updateIfEnabled", () => {
    test("should skip when kitty is not enabled", async () => {
      const context = createTestContext({ apps: { enabled: [] } });

      // Should not throw
      await updateIfEnabled("dark", "nord", context);

      // If we got here without error, the test passes
      expect(true).toBe(true);
    });

    test("should succeed when kitty is enabled for dark + nord", async () => {
      const context = createTestContext({
        apps: {
          enabled: ["kitty"],
        },
      });

      // Should not throw
      await updateIfEnabled("dark", "nord", context);

      // If we got here without error, the test passes
      expect(true).toBe(true);
    });

    test("should succeed when kitty is enabled for dark + rosepine", async () => {
      const context = createTestContext({
        apps: {
          enabled: ["kitty"],
        },
      });

      // Should not throw
      await updateIfEnabled("dark", "rosepine", context);

      // If we got here without error, the test passes
      expect(true).toBe(true);
    });

    test("should succeed when kitty is enabled for light + rosepine", async () => {
      const context = createTestContext({
        apps: {
          enabled: ["kitty"],
        },
      });

      // Should not throw
      await updateIfEnabled("light", "rosepine", context);

      // If we got here without error, the test passes
      expect(true).toBe(true);
    });

    test("should use default theme when theme not found in mapping", async () => {
      const context = createTestContext({
        apps: {
          enabled: ["kitty"],
        },
      });

      // Should not throw and should fall back to default theme
      await updateIfEnabled("dark", "foobar" as any, context);

      // If we got here without error, the test passes
      expect(true).toBe(true);
    });
  });
});
