import { appendFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

// TODO: send theme to browser on startup

const SOCKET = "/tmp/themecontrol.sock";

const themeDir = path.join(os.homedir(), ".config", "theme-control");
const storedThemeFile = path.join(os.homedir(), ".theme-control", "theme.json");

function log(message: string) {
  const dt = new Date().toISOString();
  const filename = path.join(themeDir, "app.log");
  appendFile(filename, `[${dt}] - ${message}\n`);
}

function send(x: Record<string, any>) {
  const message = JSON.stringify(x);
  const header = Buffer.alloc(4);
  header.writeUint32LE(message.length, 0);
  process.stdout.write(header);
  process.stdout.write(message);
}

async function sendStoredTheme() {
  const theme = await Bun.file(storedThemeFile).text();
  send({ colors: JSON.parse(theme) });
}

function main() {
  sendStoredTheme();
  Bun.listen({
    unix: SOCKET,
    socket: {
      data(_, theme) {
        log("Receiving theme.");
        send({ colors: JSON.parse(theme.toString()) });
      },
      close() {
        log("Closing socket.");
      },
      open() {
        log("Opening socket.");
      },
    },
  });
}

// Handle CTRL+C (SIGINT) or `kill <pid>` (SIGTERM)
process.on("SIGINT", () => {
  log("Received SIGINT. Cleaning up.");
  process.exit(0);
});

process.on("SIGTERM", () => {
  log("Received SIGTERM. Cleaning up.");
  process.exit(0);
});

main();
