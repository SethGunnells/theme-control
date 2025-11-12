import { homedir } from "os";
import { join } from "path";
import { existsSync } from "fs";
import { mkdir } from "fs/promises";
import type { Themes, ThemeMap, Appearance } from "../themes";
import type { Context } from "../context";

export const APP_NAME = "helix";

const DEFAULT_CONFIG_PATH = join(homedir(), ".config", "helix", "config.toml");

export interface HelixAppConfig {
  configPath: string;
}

interface PartialHelixAppConfig {
  configPath?: string;
}

export const themes: ThemeMap = {
  light: {
    default: "rose_pine_dawn",
    rosepine: "rose_pine_dawn",
  },
  dark: {
    default: "nord",
    nord: "nord",
    rosepine: "rose_pine",
  },
};

export function resolveConfig(
  partialConfig?: PartialHelixAppConfig,
): HelixAppConfig {
  return {
    configPath: partialConfig?.configPath ?? DEFAULT_CONFIG_PATH,
  };
}

/**
 * Simple TOML serializer for the Helix config structure
 * Handles basic types and nested objects
 */
function serializeToml(obj: any, prefix = ""): string {
  const lines: string[] = [];
  const tables: string[] = [];

  // First pass: serialize top-level scalar values
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      continue;
    }

    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "object" && !Array.isArray(value)) {
      // Handle nested objects as tables
      tables.push(`[${fullKey}]`);
      const nestedContent = serializeToml(value, "");
      // Get only the non-table lines from nested content
      const nestedLines = nestedContent
        .split("\n")
        .filter((line) => line && !line.startsWith("["));
      tables.push(...nestedLines);
      tables.push(""); // Empty line after table
    } else if (Array.isArray(value)) {
      // Handle arrays
      const arrayStr = `[${value.map((v) => serializeValue(v)).join(", ")}]`;
      lines.push(`${key} = ${arrayStr}`);
    } else {
      // Handle scalar values
      lines.push(`${key} = ${serializeValue(value)}`);
    }
  }

  return [...lines, ...tables].join("\n");
}

function serializeValue(value: any): string {
  if (typeof value === "string") {
    return `"${value.replace(/"/g, '\\"')}"`;
  } else if (typeof value === "boolean") {
    return value ? "true" : "false";
  } else if (typeof value === "number") {
    return String(value);
  }
  return String(value);
}

export async function updateIfEnabled<A extends Appearance>(
  appearance: A,
  theme: Themes<A>,
  context: Context,
  forceUpdateThemes: boolean = false,
): Promise<void> {
  if (!context.config.apps.enabled.includes(APP_NAME)) {
    context.log.debug(`Skipping ${APP_NAME}: not enabled`);
    return;
  }

  const configPath = context.config.apps.helix.configPath;
  context.log.debug(`Updating ${APP_NAME} config at ${configPath}`);

  const resolvedTheme = themes[appearance][theme] ?? themes[appearance].default;
  context.log.debug(`Resolved theme: ${resolvedTheme}`);

  let content = "";
  if (existsSync(configPath)) {
    const file = Bun.file(configPath);
    content = await file.text();
  } else {
    // Create config directory if it doesn't exist
    const configDir = join(configPath, "..");
    if (!existsSync(configDir)) {
      context.log.debug(`Creating config directory at ${configDir}`);
      await mkdir(configDir, { recursive: true });
    }
  }

  // Parse existing TOML and update theme key
  let config: any = {};
  if (content.trim()) {
    try {
      config = Bun.TOML.parse(content);
    } catch (error) {
      context.log.warn(
        `Failed to parse existing config, will overwrite: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Set the theme key at top level
  config.theme = resolvedTheme;

  // Convert back to TOML - simple manual serialization
  const newContent = serializeToml(config);
  await Bun.write(configPath, newContent);
  context.log.info(`✓ Updated ${APP_NAME} config`);

  // Send USR1 signal to all running hx processes
  try {
    const proc = Bun.spawn(["pkill", "-USR1", "hx"], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const exitCode = await proc.exited;

    if (exitCode === 0) {
      context.log.debug("Sent USR1 signal to hx processes");
    } else {
      // pkill returns 1 if no processes were found, which is fine
      context.log.debug("No hx processes to signal (or pkill failed)");
    }
  } catch (error) {
    context.log.debug(
      `Failed to signal hx processes: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
