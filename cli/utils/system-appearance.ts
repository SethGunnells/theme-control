import type { Appearance } from "../themes";
import type { Context } from "../context";

/**
 * Updates the system appearance based on the current OS.
 * Currently supports macOS. Other operating systems will be skipped gracefully.
 */
export async function updateSystemAppearance(
  appearance: Appearance,
  context: Context,
): Promise<void> {
  // Skip actual system command in test environment
  if (process.env.NODE_ENV === "test") {
    context.log.info(`✓ Updated system appearance to ${appearance}`);
    return;
  }

  // Handle based on OS
  if (context.os === "darwin") {
    await updateMacOSAppearance(appearance, context);
  } else {
    context.log.debug(
      `System appearance update not supported on ${context.os}`,
    );
  }
}

/**
 * Updates macOS system appearance using the defaults command.
 */
async function updateMacOSAppearance(
  appearance: Appearance,
  context: Context,
): Promise<void> {
  context.log.debug(`Updating system appearance to ${appearance}`);

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

    context.log.info(`✓ Updated system appearance to ${appearance}`);
  } catch (error) {
    context.log.warn(
      `Failed to update system appearance: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
