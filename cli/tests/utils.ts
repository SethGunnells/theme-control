import { resolveConfig } from "../config";
import type { PartialConfig } from "../config";
import type { Context } from "../context";

// Test utility to create context with minimal required fields
export function createTestContext(overrides: PartialConfig = {}): Context {
  return {
    config: resolveConfig(overrides),
    log: {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    },
    os: "darwin",
  };
}
