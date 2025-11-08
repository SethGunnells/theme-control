import pc from "picocolors";

export interface Logger {
  debug: (msg: string) => void;
  info: (msg: string) => void;
  warn: (msg: string) => void;
  error: (msg: string) => void;
}

export function createLogger(logLevel: number): Logger {
  return {
    debug: (msg: string) => {
      if (logLevel === 4) console.log(`[${pc.cyan("DEBUG")}] :: ${msg}`);
    },
    info: (msg: string) => {
      if (logLevel >= 3) console.log(`[${pc.blue("INFO")}]  :: ${msg}`);
    },
    warn: (msg: string) => {
      if (logLevel >= 2) console.error(`[WARN]  :: ${msg}`);
    },
    error: (msg: string) => {
      if (logLevel >= 1) console.error(`[ERROR] :: ${msg}`);
    },
  };
}
