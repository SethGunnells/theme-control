import type { Themes, ThemeMap, Appearance } from "../themes";
import type { Context } from "../context";

export const APP_NAME = "kitty";

const themes: ThemeMap = {
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

  context.log.info(`✓ Updated ${APP_NAME} theme`);
}
