import path from "node:path";
import os from "node:os";
import { existsSync } from "node:fs";
import browserThemes from "./themes/themes";
import type { Appearance, Themes } from "../themes";
import type { Context } from "../context";
import type { Logger } from "../logger";

const SOCKET = "/tmp/themecontrol.sock";

const nativeManifestPath = path.join(
  os.homedir(),
  "Library",
  "Application Support",
  "Mozilla",
  "NativeMessagingHosts",
  "themecontrol.json",
);

const nativeAppPath = path.join(
  os.homedir(),
  ".theme-control",
  "theme-control-helper",
);

const storedThemePath = path.join(os.homedir(), ".theme-control", "theme.json");

const baseManifest = {
  name: "themecontrol",
  description:
    "A pipe for sending theme data to browsers from the Theme Control application",
  path: nativeAppPath,
  type: "stdio",
  allowed_extensions: ["themecontrol@ext"],
};

export async function installNativeManifest() {
  if (existsSync(nativeManifestPath)) return;
  await Bun.write(nativeManifestPath, JSON.stringify(baseManifest));
}

async function sendTheme(theme: string, log: Logger) {
  try {
    await Bun.connect({
      unix: SOCKET,
      socket: {
        open(socket) {
          socket.end(theme);
        },
        drain() {
          log.error(
            "Backpressure when communicating to theme control browser extension helper",
          );
          process.exit(1);
        },
        error() {
          log.error(
            "An unknown error occurred during connection to unix socket",
          );
          process.exit(2);
        },
      },
    });
  } catch (err) {
    log.debug("Did not connect to socket");
  }
}

export async function update<A extends Appearance>(
  appearance: A,
  theme: Themes<A>,
  context: Context,
) {
  const { log } = context;
  if (!existsSync(SOCKET)) {
    log.debug("No browser helpers listening for an update");
    return;
  }

  const browserTheme = browserThemes[theme][appearance];

  if (!browserTheme) {
    log.debug(`No matching browser theme for ${appearance} and ${theme}`);
    return;
  }

  const stringifiedTheme = JSON.stringify(browserTheme);

  await Promise.all([
    Bun.write(storedThemePath, stringifiedTheme),
    sendTheme(stringifiedTheme, log),
  ]);
}
