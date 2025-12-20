import { homedir } from "os";
import { join } from "path";
import { existsSync } from "fs";
import {
  APP_NAME as BAT_APP_NAME,
  resolveConfig as resolveBatConfig,
} from "./apps/bat.ts";
import type { BatAppConfig } from "./apps/bat.ts";
import {
  APP_NAME as DELTA_APP_NAME,
  resolveConfig as resolveDeltaConfig,
} from "./apps/delta.ts";
import type { DeltaAppConfig } from "./apps/delta.ts";
import {
  APP_NAME as HELIX_APP_NAME,
  resolveConfig as resolveHelixConfig,
} from "./apps/helix.ts";
import type { HelixAppConfig } from "./apps/helix.ts";
import { APP_NAME as KITTY_APP_NAME } from "./apps/kitty.ts";

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

const supportedBrowsers = ["Firefox Developer Edition"] as const;

const SUPPORTED_APPS = [
  BAT_APP_NAME,
  DELTA_APP_NAME,
  HELIX_APP_NAME,
  KITTY_APP_NAME,
  ...supportedBrowsers,
] as const;

interface ResolvedAppsConfig {
  enabled: (typeof SUPPORTED_APPS)[number][];
  bat: BatAppConfig;
  delta: DeltaAppConfig;
  helix: HelixAppConfig;
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
  enabled?: (typeof SUPPORTED_APPS)[number][];
  bat?: PartialAppConfig;
  delta?: Omit<PartialAppConfig, "themesPath">;
  helix?: Omit<PartialAppConfig, "themesPath">;
}

export interface PartialConfig {
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
    // FIXME use logger
    console.error(`Failed to load config from ${configPath}:`, error);
    process.exit(1);
  }

  return resolveConfig(partialConfig);
}

export function resolveConfig(partialConfig: PartialConfig): ResolvedConfig {
  const enabledApps = partialConfig.apps?.enabled ?? [...SUPPORTED_APPS];

  // Resolve bat config first
  const batConfig = resolveBatConfig(partialConfig.apps?.bat);

  return {
    log_level: Number(
      process.env.TC_LOG_LEVEL ?? partialConfig.log_level ?? DEFAULT_LOG_LEVEL,
    ),
    apps: {
      enabled: enabledApps,
      bat: batConfig,
      delta: resolveDeltaConfig(partialConfig.apps?.delta),
      helix: resolveHelixConfig(partialConfig.apps?.helix),
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
  if (app === DELTA_APP_NAME) {
    return config.apps.delta.configPath;
  }
  if (app === HELIX_APP_NAME) {
    return config.apps.helix.configPath;
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
