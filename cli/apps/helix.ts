import { homedir } from "os";
import { join } from "path";
import { existsSync } from "fs";
import { mkdir } from "fs/promises";
import type { Themes, ThemeMap, Appearance } from "../themes";
import type { Context } from "../context";
import { $ } from "bun";

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

export async function updateIfEnabled<A extends Appearance>(
  appearance: A,
  theme: Themes<A>,
  context: Context,
): Promise<void> {
  if (!context.config.apps.enabled.includes("helix")) {
    context.log.debug("Skipping helix: not enabled");
    return;
  }

  const configPath = context.config.apps.helix.configPath;
  context.log.debug(`Updating helix config at ${configPath}`);

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

  // Simple search and replace for the theme key
  const themePattern = /^theme\s*=\s*"[^"]*"/m;
  const newThemeLine = `theme = "${resolvedTheme}"`;

  if (themePattern.test(content)) {
    content = content.replace(themePattern, newThemeLine);
    context.log.debug("Replaced existing theme in helix config");
  } else {
    content = content.trim()
      ? `${newThemeLine}\n${content.trim()}\n`
      : `${newThemeLine}\n`;
    context.log.debug("Added theme to helix config");
  }

  await Bun.write(configPath, content);
  context.log.info("✓ Updated helix config");

  // Send USR1 signal to all running hx processes
  if (process.env.NODE_ENV === "test") return;

  try {
    const { exitCode } = await $`pkill -USR1 hx`;

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
