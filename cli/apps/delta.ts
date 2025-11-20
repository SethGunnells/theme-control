import { homedir } from "os";
import { join } from "path";
import { existsSync } from "fs";
import { installThemes, themes } from "./bat.ts";
import type { Themes, Appearance } from "../themes";
import type { Context } from "../context";
import { $ } from "bun";

export const APP_NAME = "delta";

const DEFAULT_CONFIG_PATH = join(homedir(), ".gitconfig");

export interface DeltaAppConfig {
  configPath: string;
}

export interface PartialDeltaAppConfig {
  configPath?: string;
}

export function resolveConfig(
  partialConfig?: PartialDeltaAppConfig,
): DeltaAppConfig {
  return {
    configPath: partialConfig?.configPath ?? DEFAULT_CONFIG_PATH,
  };
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

  // Install bat themes if needed (delta uses bat themes)
  await installThemes(
    context.config.apps.bat.themesPath,
    forceUpdateThemes,
    context.log,
  );

  const configPath = context.config.apps.delta.configPath;
  context.log.debug(`Updating ${APP_NAME} config at ${configPath}`);

  // Create empty file if it doesn't exist
  if (!existsSync(configPath)) {
    context.log.debug(`Creating config file at ${configPath}`);
    await Bun.write(configPath, "");
  }

  const resolvedTheme = themes[appearance][theme] ?? themes[appearance].default;
  context.log.debug(`Resolved theme: ${resolvedTheme}`);

  // Use git config to set the delta syntax-theme
  try {
    const { stderr, exitCode } =
      await $`git config --file ${configPath} delta.syntax-theme ${resolvedTheme}`;

    if (exitCode === 0) {
      context.log.info(`✓ Updated ${APP_NAME} config`);
    } else {
      const stderrText = stderr.toString();
      context.log.error(`Failed to update ${APP_NAME} config: ${stderrText}`);
    }
  } catch (error) {
    context.log.error(
      `Failed to update ${APP_NAME} config: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
