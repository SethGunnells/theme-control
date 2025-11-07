import { homedir } from "os";
import { join } from "path";
import { existsSync } from "fs";
import { DEFAULT_BAT_CONFIG_PATH, APP_NAME as BAT_APP_NAME } from "./apps/bat.ts";

declare module "bun" {
  interface Env {
    TC_LOG_LEVEL: string | undefined;
    TC_CONFIG_PATH: string | undefined;
  }
}

const DEFAULT_CONFIG_PATH = join(homedir(), ".config", "theme-control", "config.toml");

// Supported applications and their default config paths
const SUPPORTED_APPS = [BAT_APP_NAME] as const;
const DEFAULT_APP_CONFIG_PATHS: Record<string, string> = {
  [BAT_APP_NAME]: DEFAULT_BAT_CONFIG_PATH,
};

interface AppConfig {
  configPath?: string;
}

function isAppConfig(value: unknown): value is AppConfig {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

interface AppsConfig {
  enabled?: string[];
  [appName: string]: string[] | AppConfig | undefined;
}

interface Config {
  log_level?: number;
  apps?: AppsConfig;
}

async function loadConfig(configPath: string = DEFAULT_CONFIG_PATH): Promise<Config> {
  try {
    if (existsSync(configPath)) {
      const file = Bun.file(configPath);
      const config = await file.text();
      return Bun.TOML.parse(config) as Config;
    }
  } catch (error) {
    console.error(`Failed to load config from ${configPath}:`, error);
  }
  return {};
}

function getEnabledApps(config: Config): string[] {
  // If enabled is not specified, return all supported apps
  if (!config.apps?.enabled) {
    return [...SUPPORTED_APPS];
  }
  return config.apps.enabled;
}

function getAppConfigPath(config: Config, app: string): string {
  // Check if there's a custom config path for this app
  const appConfig = config.apps?.[app];
  if (isAppConfig(appConfig) && appConfig.configPath) {
    return appConfig.configPath;
  }
  // Return default config path
  return DEFAULT_APP_CONFIG_PATHS[app] || "";
}

export { loadConfig, getEnabledApps, getAppConfigPath, SUPPORTED_APPS, DEFAULT_APP_CONFIG_PATHS };
export type { Config, AppsConfig, AppConfig };
