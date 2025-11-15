import { describe, test, expect, mock, beforeEach } from "bun:test";
import { updateSystemAppearance } from "./system-appearance";
import { createTestContext } from "../tests/utils";

describe("system-appearance", () => {
  describe("updateSystemAppearance", () => {
    let spawnMock: ReturnType<typeof mock>;

    beforeEach(() => {
      // Reset mock before each test
      spawnMock = mock(() => ({
        exited: Promise.resolve(0),
        stderr: {
          text: () => Promise.resolve(""),
        },
      }));
      // @ts-ignore - Mocking Bun.spawn
      global.Bun.spawn = spawnMock;
    });

    test("should call defaults write for dark mode on darwin", async () => {
      const context = createTestContext();

      await updateSystemAppearance("dark", context);

      expect(spawnMock).toHaveBeenCalledTimes(1);
      expect(spawnMock).toHaveBeenCalledWith(
        ["defaults", "write", "-g", "AppleInterfaceStyle", "Dark"],
        expect.objectContaining({
          stdout: "pipe",
          stderr: "pipe",
        }),
      );
    });

    test("should call defaults delete for light mode on darwin", async () => {
      const context = createTestContext();

      await updateSystemAppearance("light", context);

      expect(spawnMock).toHaveBeenCalledTimes(1);
      expect(spawnMock).toHaveBeenCalledWith(
        ["defaults", "delete", "-g", "AppleInterfaceStyle"],
        expect.objectContaining({
          stdout: "pipe",
          stderr: "pipe",
        }),
      );
    });

    test("should skip gracefully on non-darwin OS", async () => {
      const context = createTestContext();
      context.os = "linux";

      await updateSystemAppearance("dark", context);

      expect(spawnMock).not.toHaveBeenCalled();
    });

    test("should handle spawn failure for dark mode", async () => {
      spawnMock = mock(() => ({
        exited: Promise.resolve(1),
        stderr: {
          text: () => Promise.resolve("Error message"),
        },
      }));
      // @ts-ignore - Mocking Bun.spawn
      global.Bun.spawn = spawnMock;

      const context = createTestContext();

      await updateSystemAppearance("dark", context);

      expect(spawnMock).toHaveBeenCalledTimes(1);
    });

    test("should handle spawn failure for light mode with exit code 1", async () => {
      spawnMock = mock(() => ({
        exited: Promise.resolve(1),
        stderr: {
          text: () => Promise.resolve("Domain does not exist"),
        },
      }));
      // @ts-ignore - Mocking Bun.spawn
      global.Bun.spawn = spawnMock;

      const context = createTestContext();

      // Exit code 1 is acceptable for light mode (key might not exist)
      await updateSystemAppearance("light", context);

      expect(spawnMock).toHaveBeenCalledTimes(1);
    });

    test("should handle spawn failure for light mode with exit code > 1", async () => {
      spawnMock = mock(() => ({
        exited: Promise.resolve(2),
        stderr: {
          text: () => Promise.resolve("Error message"),
        },
      }));
      // @ts-ignore - Mocking Bun.spawn
      global.Bun.spawn = spawnMock;

      const context = createTestContext();

      await updateSystemAppearance("light", context);

      expect(spawnMock).toHaveBeenCalledTimes(1);
    });
  });
});
