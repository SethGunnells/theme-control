import pc from "picocolors";
import { homedir } from "os";
import { join } from "path";
import { existsSync } from "fs";

declare module "bun" {
  interface Env {
    TC_LOG_LEVEL: string | undefined;
    TC_CONFIG_PATH: string | undefined;
  }
}

const DEFAULT_CONFIG_PATH = join(homedir(), ".config", "theme-control", "config.toml");

interface Config {
  log_level?: number;
  [key: string]: any;
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
