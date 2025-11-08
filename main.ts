import { platform } from "os";
import { loadConfig } from "./config.ts";
import { createLogger } from "./logger.ts";
import * as bat from "./apps/bat.ts";
import { assertTheme } from "./themes.ts";

const config = await loadConfig(process.env.TC_CONFIG_PATH);
const log = createLogger(config.log_level);

const currentOS = platform();
const SUPPORTED_OS = ["darwin"];

if (!SUPPORTED_OS.includes(currentOS)) {
  log.error(
    `Unsupported operating system: ${currentOS}. Supported operating systems: macOS`,
  );
  process.exit(1);
}

const [appearance, theme] = process.argv.slice(2);

if (!appearance || !theme) {
  log.error("Usage: bun run main.ts <appearance> <theme>");
  log.error("  appearance: light | dark");
  log.error("  theme: (light: rosepine) | (dark: nord | rosepine)");
  process.exit(1);
}

if (appearance !== "light" && appearance !== "dark") {
  log.error(`Invalid appearance: ${appearance}. Must be 'light' or 'dark'.`);
  process.exit(1);
}

try {
  assertTheme(appearance, theme);
  await bat.updateIfEnabled(appearance, theme, config, log);
} catch (error) {
  log.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
