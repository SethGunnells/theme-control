import { homedir } from "os";
import { join } from "path";
import { existsSync } from "fs";
import { resolveConfig as resolveBatConfig } from "./apps/bat.ts";
import type { BatAppConfig } from "./apps/bat.ts";
import { resolveConfig as resolveDeltaConfig } from "./apps/delta.ts";
import type { DeltaAppConfig } from "./apps/delta.ts";
import { resolveConfig as resolveHelixConfig } from "./apps/helix.ts";
import type { HelixAppConfig } from "./apps/helix.ts";

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
  "bat",
  "delta",
  "helix",
  "kitty",
  ...supportedBrowsers,
] as const;

type SupportedApp = (typeof SUPPORTED_APPS)[number];

interface ResolvedAppsConfig {
  enabled: SupportedApp[];
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
  enabled?: SupportedApp[];
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

function getAppConfigPath(config: ResolvedConfig, app: SupportedApp): string {
  if (app === "bat") {
    return config.apps.bat.configPath;
  }
  if (app === "delta") {
    return config.apps.delta.configPath;
  }
  if (app === "helix") {
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
