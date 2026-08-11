import dotenv from "dotenv";

/** Load local files as defaults without replacing deployment-controlled environment values. */
export function loadEnvironment() {
  dotenv.config({ path: ".env.local", override: false });
  dotenv.config({ override: false });
}
