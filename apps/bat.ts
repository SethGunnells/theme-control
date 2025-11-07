import { homedir } from "os";
import { join } from "path";

// Default config path for bat
export const DEFAULT_BAT_CONFIG_PATH = join(homedir(), ".config", "bat", "config");

export const APP_NAME = "bat";

// Add any bat-specific logic here
export function initBat() {
  // Placeholder for bat-specific initialization logic
}
