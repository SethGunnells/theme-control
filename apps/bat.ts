import { homedir } from "os";
import { join } from "path";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import type { Themes, ThemeMap, Appearance } from "../themes";
import type { ResolvedConfig } from "../config";
import type { Logger } from "../logger";

export const APP_NAME = "bat";

const DEFAULT_CONFIG_PATH = join(homedir(), ".config", "bat", "config");
const DEFAULT_THEMES_PATH = join(homedir(), ".config", "bat", "themes");

// Import embedded theme files using Bun.file
// These will be embedded in the compiled binary
const rosePineTheme = await Bun.file(new URL("../bat-themes/rose-pine.tmTheme", import.meta.url)).text();
const rosePineDawnTheme = await Bun.file(new URL("../bat-themes/rose-pine-dawn.tmTheme", import.meta.url)).text();

// Embedded theme files
const EMBEDDED_THEMES = {
  "rose-pine.tmTheme": rosePineTheme,
  "rose-pine-dawn.tmTheme": rosePineDawnTheme,
};

export interface BatAppConfig {
  configPath: string;
  themesPath: string;
}

interface PartialBatAppConfig {
  configPath?: string;
  themesPath?: string;
}

const themes: ThemeMap = {
  light: {
    default: "base16",
    rosepine: "rose-pine-dawn",
  },
  dark: {
    default: "base16",
    nord: "Nord",
    rosepine: "rose-pine",
  },
};

/**
 * Install bat theme files if they are missing or if forceUpdate is true.
 * After installation or update, rebuilds the bat cache.
 */
export async function installThemes(
  themesPath: string,
  forceUpdate: boolean,
  log: Logger,
): Promise<void> {
  log.debug(`Checking bat themes at ${themesPath}`);

  // Create themes directory if it doesn't exist
  if (!existsSync(themesPath)) {
    log.debug(`Creating themes directory at ${themesPath}`);
    await mkdir(themesPath, { recursive: true });
  }

  // Check if themes need to be installed or updated
  let themesUpdated = false;

  for (const [themeFile, themeContent] of Object.entries(EMBEDDED_THEMES)) {
    const destPath = join(themesPath, themeFile);
    const themeExists = existsSync(destPath);

    if (!themeExists || forceUpdate) {
      log.debug(`${forceUpdate ? "Updating" : "Installing"} theme: ${themeFile}`);
      await writeFile(destPath, themeContent, "utf-8");
      themesUpdated = true;
    }
  }

  // Rebuild bat cache if themes were installed or updated
  if (themesUpdated || forceUpdate) {
    log.debug("Rebuilding bat cache...");
    try {
      const proc = Bun.spawn(["bat", "cache", "--build"], {
        stdout: "pipe",
        stderr: "pipe",
      });
      
      const exitCode = await proc.exited;
      
      if (exitCode === 0) {
        log.info("✓ Bat cache rebuilt successfully");
      } else {
        const stderr = await new Response(proc.stderr).text();
        log.warn(`Failed to rebuild bat cache: ${stderr}`);
      }
    } catch (error) {
      log.warn(`Failed to rebuild bat cache: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    log.debug("All themes are already installed");
  }
}


export function resolveConfig(
  partialConfig?: PartialBatAppConfig,
): BatAppConfig {
  return {
    configPath: partialConfig?.configPath ?? DEFAULT_CONFIG_PATH,
    themesPath: partialConfig?.themesPath ?? DEFAULT_THEMES_PATH,
  };
}

export async function updateIfEnabled<A extends Appearance>(
  appearance: A,
  theme: Themes<A>,
  config: ResolvedConfig,
  log: Logger,
  forceUpdateThemes: boolean = false,
): Promise<void> {
  if (!config.apps.enabled.includes(APP_NAME)) {
    log.debug(`Skipping ${APP_NAME}: not enabled`);
    return;
  }

  // Install themes if needed
  await installThemes(config.apps.bat.themesPath, forceUpdateThemes, log);

  const path = config.apps.bat.configPath;
  log.debug(`Updating ${APP_NAME} config at ${path}`);

  const resolvedTheme = themes[appearance][theme] ?? themes[appearance].default;
  log.debug(`Resolved theme: ${resolvedTheme}`);

  let content = "";
  if (existsSync(path)) {
    const file = Bun.file(path);
    content = await file.text();
  }

  const themePattern = /--theme="[^"]*"/;
  const newThemeLine = `--theme="${resolvedTheme}"`;

  if (themePattern.test(content)) {
    content = content.replace(themePattern, newThemeLine);
    log.debug(`Replaced existing theme in ${APP_NAME} config`);
  } else {
    content = content.trim()
      ? `${content.trim()}\n${newThemeLine}\n`
      : `${newThemeLine}\n`;
    log.debug(`Added theme to ${APP_NAME} config`);
  }

  await Bun.write(path, content);
  log.info(`✓ Updated ${APP_NAME} config`);
}
