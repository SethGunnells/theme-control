import { homedir } from "os";
import { join } from "path";
import { installThemes } from "./bat.ts";
import type { Themes, ThemeMap, Appearance } from "../themes";
import type { Context } from "../context";
import type { Logger } from "../logger";

export const APP_NAME = "delta";

const DEFAULT_CONFIG_PATH = join(homedir(), ".gitconfig");

export interface DeltaAppConfig {
  configPath: string;
  themesPath: string;
}

interface PartialDeltaAppConfig {
  configPath?: string;
  themesPath?: string;
}

// Delta uses the same themes as bat
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
  partialConfig?: PartialDeltaAppConfig,
  batThemesPath?: string,
): DeltaAppConfig {
  return {
    configPath: partialConfig?.configPath ?? DEFAULT_CONFIG_PATH,
    // Delta uses bat's themes by default
    themesPath: partialConfig?.themesPath ?? batThemesPath ?? join(homedir(), ".config", "bat", "themes"),
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
  await installThemes(context.config.apps.delta.themesPath, forceUpdateThemes, context.log);

  const configPath = context.config.apps.delta.configPath;
  context.log.debug(`Updating ${APP_NAME} config at ${configPath}`);

  const resolvedTheme = themes[appearance][theme] ?? themes[appearance].default;
  context.log.debug(`Resolved theme: ${resolvedTheme}`);

  // Use git config to set the delta syntax-theme
  try {
    const proc = Bun.spawn(
      ["git", "config", "--file", configPath, "delta.syntax-theme", resolvedTheme],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    const exitCode = await proc.exited;

    if (exitCode === 0) {
      context.log.info(`✓ Updated ${APP_NAME} config`);
    } else {
      const stderr = await new Response(proc.stderr).text();
      context.log.error(`Failed to update ${APP_NAME} config: ${stderr}`);
    }
  } catch (error) {
    context.log.error(
      `Failed to update ${APP_NAME} config: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
