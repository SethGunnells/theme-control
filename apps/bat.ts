import { homedir } from "os";
import { join } from "path";
import { existsSync } from "fs";
import type { Themes, ThemeMap, Appearance } from "../themes";
import type { ResolvedConfig } from "../config";
import type { Logger } from "../logger";

export const APP_NAME = "bat";

const DEFAULT_CONFIG_PATH = join(homedir(), ".config", "bat", "config");

export interface BatAppConfig {
  configPath: string;
}

interface PartialBatAppConfig {
  configPath?: string;
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

export function resolveConfig(
  partialConfig?: PartialBatAppConfig,
): BatAppConfig {
  return {
    configPath: partialConfig?.configPath ?? DEFAULT_CONFIG_PATH,
  };
}

export async function updateIfEnabled<A extends Appearance>(
  appearance: A,
  theme: Themes<A>,
  config: ResolvedConfig,
  log: Logger,
): Promise<void> {
  if (!config.apps.enabled.includes(APP_NAME)) {
    log.debug(`Skipping ${APP_NAME}: not enabled`);
    return;
  }

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
