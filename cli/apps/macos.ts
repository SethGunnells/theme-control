import type { Appearance } from "../themes";
import type { Context } from "../context";

export const APP_NAME = "macos";

export interface MacOSAppConfig {
  enabled: boolean;
}

interface PartialMacOSAppConfig {
  enabled?: boolean;
}

export function resolveConfig(
  partialConfig?: PartialMacOSAppConfig,
): MacOSAppConfig {
  return {
    enabled: partialConfig?.enabled ?? true,
  };
}

export async function updateIfEnabled<A extends Appearance>(
  appearance: A,
  context: Context,
): Promise<void> {
  if (!context.config.apps.enabled.includes(APP_NAME)) {
    context.log.debug(`Skipping ${APP_NAME}: not enabled`);
    return;
  }

  // Only support macOS
  if (context.os !== "darwin") {
    context.log.debug(`Skipping ${APP_NAME}: only supported on macOS`);
    return;
  }

  context.log.debug(`Updating ${APP_NAME} system appearance to ${appearance}`);

  // Skip actual system command in test environment
  if (process.env.NODE_ENV === "test") {
    context.log.info(
      `✓ Updated ${APP_NAME} system appearance to ${appearance}`,
    );
    return;
  }

  try {
    if (appearance === "dark") {
      // Set dark mode
      const proc = Bun.spawn(
        ["defaults", "write", "-g", "AppleInterfaceStyle", "Dark"],
        {
          stdout: "pipe",
          stderr: "pipe",
        },
      );

      const exitCode = await proc.exited;

      if (exitCode !== 0) {
        const stderr = await new Response(proc.stderr).text();
        context.log.warn(`Failed to set system appearance to dark: ${stderr}`);
        return;
      }
    } else {
      // Set light mode by removing the Dark value
      const proc = Bun.spawn(
        ["defaults", "delete", "-g", "AppleInterfaceStyle"],
        {
          stdout: "pipe",
          stderr: "pipe",
        },
      );

      const exitCode = await proc.exited;

      // Exit code 1 is OK if the key doesn't exist (already in light mode)
      if (exitCode !== 0 && exitCode !== 1) {
        const stderr = await new Response(proc.stderr).text();
        context.log.warn(`Failed to set system appearance to light: ${stderr}`);
        return;
      }
    }

    context.log.info(
      `✓ Updated ${APP_NAME} system appearance to ${appearance}`,
    );
  } catch (error) {
    context.log.warn(
      `Failed to update system appearance: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
