import type { Themes, ThemeMap, Appearance } from "../themes";
import type { Context } from "../context";
import { $ } from "bun";

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
  if (!context.config.apps.enabled.includes("kitty")) {
    context.log.debug("Skipping kitty: not enabled");
    return;
  }

  context.log.debug("Updating kitty theme");

  const resolvedTheme = themes[appearance][theme] ?? themes[appearance].default;
  context.log.debug(`Resolved theme: ${resolvedTheme}`);

  try {
    // Use kitten theme command to change the theme
    const { stderr, exitCode } =
      await $`kitten theme ${resolvedTheme} --reload-in=all`;

    if (exitCode !== 0) {
      throw new Error(
        `kitten theme command failed with exit code ${exitCode}: ${stderr.toString()}`,
      );
    }

    context.log.debug("Applied theme using kitten command");
  } catch (error) {
    throw new Error(
      `Failed to apply kitty theme: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  context.log.info("✓ Updated kitty theme");
}
