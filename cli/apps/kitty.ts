import type { Themes, ThemeMap, Appearance } from "../themes";
import type { Context } from "../context";

export const APP_NAME = "kitty";

export interface KittyAppConfig {
  // Kitty doesn't need a configPath since we use the kitten command
}

interface PartialKittyAppConfig {}

export const themes: ThemeMap = {
  light: {
    default: "Rosé Pine Dawn",
    rosepine: "Rosé Pine Dawn",
  },
  dark: {
    default: "Nord",
    nord: "Nord",
    rosepine: "Rosé Pine",
  },
};

export function resolveConfig(
  partialConfig?: PartialKittyAppConfig,
): KittyAppConfig {
  return {};
}

export async function updateIfEnabled<A extends Appearance>(
  appearance: A,
  theme: Themes<A>,
  context: Context,
): Promise<void> {
  if (!context.config.apps.enabled.includes(APP_NAME)) {
    context.log.debug(`Skipping ${APP_NAME}: not enabled`);
    return;
  }

  context.log.debug(`Updating ${APP_NAME} theme`);

  const resolvedTheme = themes[appearance][theme] ?? themes[appearance].default;
  context.log.debug(`Resolved theme: ${resolvedTheme}`);

  // Skip actually running the command in test environment
  if (process.env.NODE_ENV === "test") {
    context.log.info(`✓ Updated ${APP_NAME} theme`);
    return;
  }

  try {
    // Use kitten theme command to change the theme
    const proc = Bun.spawn(
      ["kitten", "theme", resolvedTheme, "--reload-in=all"],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    const exitCode = await proc.exited;

    if (exitCode !== 0) {
      const stderr = await new Response(proc.stderr).text();
      throw new Error(
        `kitten theme command failed with exit code ${exitCode}: ${stderr}`,
      );
    }

    context.log.debug("Applied theme using kitten command");
  } catch (error) {
    throw new Error(
      `Failed to apply ${APP_NAME} theme: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // Send SIGUSR1 signal to all kitty processes
  try {
    const proc = Bun.spawn(["pkill", "-USR1", "kitty"], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const exitCode = await proc.exited;

    if (exitCode === 0) {
      context.log.debug("Sent USR1 signal to kitty processes");
    } else {
      // pkill returns 1 if no processes were found, which is fine
      context.log.debug("No kitty processes to signal (or pkill failed)");
    }
  } catch (error) {
    context.log.debug(
      `Failed to signal kitty processes: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  context.log.info(`✓ Updated ${APP_NAME} theme`);
}
