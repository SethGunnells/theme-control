import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import { updateIfEnabled } from "./kitty";
import { createTestContext } from "../tests/utils";

describe("kitty module", () => {
  let spawnMock: any;

  beforeEach(() => {
    // Mock Bun.spawn to avoid actually running kitten command
    spawnMock = mock(() => ({
      exited: Promise.resolve(0),
      stdout: { read: () => null },
      stderr: { read: () => null },
    }));
    global.Bun.spawn = spawnMock as any;
  });

  afterEach(() => {
    spawnMock.mockRestore?.();
  });

  describe("updateIfEnabled", () => {
    test("should skip when kitty is not enabled", async () => {
      const context = createTestContext({ apps: { enabled: [] } });

      await updateIfEnabled("dark", "nord", context);

      expect(spawnMock).not.toHaveBeenCalled();
    });

    test("should call kitten theme command for dark + nord", async () => {
      const context = createTestContext({
        apps: {
          enabled: ["kitty"],
        },
      });

      await updateIfEnabled("dark", "nord", context);

      expect(spawnMock).toHaveBeenCalledWith(
        ["kitten", "theme", "Nord", "--reload-in=all"],
        expect.any(Object),
      );
    });

    test("should call kitten theme command for dark + rosepine", async () => {
      const context = createTestContext({
        apps: {
          enabled: ["kitty"],
        },
      });

      await updateIfEnabled("dark", "rosepine", context);

      expect(spawnMock).toHaveBeenCalledWith(
        ["kitten", "theme", "Rosé Pine", "--reload-in=all"],
        expect.any(Object),
      );
    });

    test("should call kitten theme command for light + rosepine", async () => {
      const context = createTestContext({
        apps: {
          enabled: ["kitty"],
        },
      });

      await updateIfEnabled("light", "rosepine", context);

      expect(spawnMock).toHaveBeenCalledWith(
        ["kitten", "theme", "Rosé Pine Dawn", "--reload-in=all"],
        expect.any(Object),
      );
    });

    test("should use default theme when theme not found in mapping", async () => {
      const context = createTestContext({
        apps: {
          enabled: ["kitty"],
        },
      });

      await updateIfEnabled("dark", "foobar" as any, context);

      // Should fall back to default dark theme (Nord)
      expect(spawnMock).toHaveBeenCalledWith(
        ["kitten", "theme", "Nord", "--reload-in=all"],
        expect.any(Object),
      );
    });

    test("should throw error when kitten command fails", async () => {
      spawnMock.mockImplementation(() => ({
        exited: Promise.resolve(1),
        stderr: new Response("Error message"),
      }));

      const context = createTestContext({
        apps: {
          enabled: ["kitty"],
        },
      });

      await expect(updateIfEnabled("dark", "nord", context)).rejects.toThrow(
        "kitten theme command failed",
      );
    });
  });
});
