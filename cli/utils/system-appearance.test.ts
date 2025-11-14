import { describe, test, expect } from "bun:test";
import { updateSystemAppearance } from "./system-appearance";
import { createTestContext } from "../tests/utils";

describe("system-appearance", () => {
  describe("updateSystemAppearance", () => {
    test("should update system appearance to dark for darwin OS", async () => {
      const context = createTestContext();

      // Should not throw in test environment
      await updateSystemAppearance("dark", context);
    });

    test("should update system appearance to light for darwin OS", async () => {
      const context = createTestContext();

      // Should not throw in test environment
      await updateSystemAppearance("light", context);
    });

    test("should skip gracefully on non-darwin OS", async () => {
      const context = createTestContext();
      context.os = "linux";

      // Should not throw
      await updateSystemAppearance("dark", context);
    });
  });
});
