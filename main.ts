import pc from "picocolors";
import { platform } from "os";
import { loadConfig } from "./config.ts";

const config = await loadConfig(process.env.TC_CONFIG_PATH);
const TC_LOG_LEVEL = Number(
  config.log_level ?? process.env.TC_LOG_LEVEL ?? "2",
);

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
    `Unsupported operating system: ${currentOS}. Supported operating systems: macOS`,
  );
  process.exit(1);
}
