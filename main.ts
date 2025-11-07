import pc from "picocolors";
import { homedir, platform } from "os";
import { join } from "path";
import { existsSync } from "fs";

declare module "bun" {
  interface Env {
    TC_LOG_LEVEL: string | undefined;
    TC_CONFIG_PATH: string | undefined;
  }
}

const DEFAULT_CONFIG_PATH = join(homedir(), ".config", "theme-control", "config.toml");

// Supported applications and their default config paths
const SUPPORTED_APPS = ["bat"] as const;
const DEFAULT_APP_CONFIG_PATHS: Record<string, string> = {
  bat: join(homedir(), ".config", "bat", "config"),
};

interface AppConfig {
  configPath?: string;
}

interface AppsConfig {
  enabled?: string[];
  bat?: AppConfig;
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
  const appConfig = config.apps?.[app as keyof AppsConfig] as AppConfig | undefined;
  if (appConfig?.configPath) {
    return appConfig.configPath;
  }
  // Return default config path
  return DEFAULT_APP_CONFIG_PATHS[app] || "";
}

const config = await loadConfig(process.env.TC_CONFIG_PATH);
const TC_LOG_LEVEL = Number(config.log_level ?? process.env.TC_LOG_LEVEL ?? "2");

const log = {
  debug: (msg: string) => {
    if (TC_LOG_LEVEL === 4) console.log(`[${pc.cyan("DEBUG")}] :: ${msg}`);
  },
  info: (msg: string) => {
    if (TC_LOG_LEVEL >= 3) console.log(`[${pc.blue("INFO")}]  :: ${msg}`);
  },
  warn: (msg: string) => {
    if (TC_LOG_LEVEL >= 2) console.error(`[WARN]  :: ${msg}`);
  },
  error: (msg: string) => {
    if (TC_LOG_LEVEL >= 1) console.error(`[ERROR] :: ${msg}`);
  },
};

// Check operating system
const currentOS = platform();
const SUPPORTED_OS = ["darwin"]; // macOS

if (!SUPPORTED_OS.includes(currentOS)) {
  log.error(
    `Unsupported operating system: ${currentOS}. Supported operating systems: macOS`
  );
  process.exit(1);
}
