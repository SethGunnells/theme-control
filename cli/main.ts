import { platform } from "os";
import { loadConfig } from "./config.ts";
import { createLogger } from "./logger.ts";
import * as bat from "./apps/bat.ts";
import * as delta from "./apps/delta.ts";
import * as helix from "./apps/helix.ts";
import * as macos from "./apps/macos.ts";
import { assertTheme } from "./themes.ts";

const config = await loadConfig();
const log = createLogger(config.log_level);

const currentOS = platform();
const SUPPORTED_OS = ["darwin"];

if (!SUPPORTED_OS.includes(currentOS)) {
  log.error(
    `Unsupported operating system: ${currentOS}. Supported operating systems: macOS`,
  );
  process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
let forceUpdateThemes = false;
let appearance: string | undefined;
let theme: string | undefined;

// Check for --update-themes flag
const updateThemesIndex = args.indexOf("--update-themes");
if (updateThemesIndex !== -1) {
  forceUpdateThemes = true;
  args.splice(updateThemesIndex, 1);
}

[appearance, theme] = args;

if (!appearance || !theme) {
  log.error("Usage: bun run main.ts <appearance> <theme> [--update-themes]");
  log.error("  appearance: light | dark");
  log.error("  theme: (light: rosepine) | (dark: nord | rosepine)");
  log.error("  --update-themes: Force update bat themes");
  process.exit(1);
}

if (appearance !== "light" && appearance !== "dark") {
  log.error(`Invalid appearance: ${appearance}. Must be 'light' or 'dark'.`);
  process.exit(1);
}

try {
  assertTheme(appearance, theme);
  const context = { config, log, os: currentOS };
  await macos.updateIfEnabled(appearance, context);
  await bat.updateIfEnabled(appearance, theme, context, forceUpdateThemes);
  await delta.updateIfEnabled(appearance, theme, context, forceUpdateThemes);
  await helix.updateIfEnabled(appearance, theme, context);
} catch (error) {
  log.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
