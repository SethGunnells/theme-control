import type { ResolvedConfig } from "./config";
import type { Logger } from "./logger";

export interface Context {
  config: ResolvedConfig;
  log: Logger;
  os: string;
}
