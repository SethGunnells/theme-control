import { homedir } from "os";
import { join } from "path";
import { existsSync } from "fs";
import {
  APP_NAME as BAT_APP_NAME,
  resolveConfig as resolveBatConfig,
} from "./apps/bat.ts";
import type { BatAppConfig } from "./apps/bat.ts";

declare module "bun" {
  interface Env {
    TC_LOG_LEVEL: string | undefined;
    TC_CONFIG_PATH: string | undefined;
  }
}

const DEFAULT_CONFIG_PATH = join(
  homedir(),
  ".config",
  "theme-control",
  "config.toml",
);

const SUPPORTED_APPS = [BAT_APP_NAME] as const;

interface ResolvedAppsConfig {
  enabled: string[];
  bat: BatAppConfig;
}

interface ResolvedConfig {
  log_level: number;
  apps: ResolvedAppsConfig;
}

interface PartialAppConfig {
  configPath?: string;
  themesPath?: string;
}

interface PartialAppsConfig {
  enabled?: string[];
  bat?: PartialAppConfig;
}

interface PartialConfig {
  log_level?: number;
  apps?: PartialAppsConfig;
}

const DEFAULT_LOG_LEVEL = 2;

async function loadConfig(
  configPath: string = process.env.TC_CONFIG_PATH ?? DEFAULT_CONFIG_PATH,
): Promise<ResolvedConfig> {
  let partialConfig: PartialConfig = {};

  try {
    if (existsSync(configPath)) {
      const file = Bun.file(configPath);
      const config = await file.text();
      partialConfig = Bun.TOML.parse(config) as PartialConfig;
    }
  } catch (error) {
    console.error(`Failed to load config from ${configPath}:`, error);
  }

  const enabledApps = partialConfig.apps?.enabled ?? [...SUPPORTED_APPS];

  return {
    log_level: Number(
      process.env.TC_LOG_LEVEL ?? partialConfig.log_level ?? DEFAULT_LOG_LEVEL,
    ),
    apps: {
      enabled: enabledApps,
      bat: resolveBatConfig(partialConfig.apps?.bat),
    },
  };
}

function getEnabledApps(config: ResolvedConfig): string[] {
  return config.apps.enabled;
}

function getAppConfigPath(config: ResolvedConfig, app: string): string {
  if (app === BAT_APP_NAME) {
    return config.apps.bat.configPath;
  }
  return "";
}

export {
  loadConfig,
  getEnabledApps,
  getAppConfigPath,
  SUPPORTED_APPS,
  DEFAULT_LOG_LEVEL,
};
export type { ResolvedConfig, ResolvedAppsConfig };
