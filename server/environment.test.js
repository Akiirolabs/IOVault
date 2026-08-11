// @vitest-environment node
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

const serverDirectory = path.resolve(import.meta.dirname);
const environmentModule = pathToFileURL(path.join(serverDirectory, "environment.js")).href;
const authConfigModule = pathToFileURL(path.join(serverDirectory, "auth-config.js")).href;

describe("environment precedence", () => {
  it("does not let .env.local downgrade production or replace its external JWT secret", () => {
    const workingDirectory = mkdtempSync(path.join(tmpdir(), "iovault-hostile-env-"));
    writeFileSync(path.join(workingDirectory, ".env.local"), [
      "NODE_ENV=development",
      "JWT_SECRET=iovault-dev-secret-change-me",
      "OPENAI_API_KEY=local-file-default",
    ].join("\n"));
    const externalSecret = "external-production-key-with-strong-diversity-2026";
    const probe = `
      import { loadEnvironment } from ${JSON.stringify(environmentModule)};
      import { resolveJwtSecret } from ${JSON.stringify(authConfigModule)};
      loadEnvironment();
      console.log(JSON.stringify({
        production: process.env.NODE_ENV === "production",
        externalSecretPreserved: resolveJwtSecret() === ${JSON.stringify(externalSecret)},
      }));
    `;
    const result = spawnSync(process.execPath, ["--input-type=module", "--eval", probe], {
      cwd: workingDirectory,
      env: { ...process.env, NODE_ENV: "production", JWT_SECRET: externalSecret },
      encoding: "utf8",
      timeout: 10_000,
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain(JSON.stringify({ production: true, externalSecretPreserved: true }));
  });

  it("keeps production enforcement active when a local file supplies only the public fallback", () => {
    const workingDirectory = mkdtempSync(path.join(tmpdir(), "iovault-hostile-env-fallback-"));
    writeFileSync(path.join(workingDirectory, ".env.local"), "NODE_ENV=development\nJWT_SECRET=iovault-dev-secret-change-me\n");
    const probe = `
      import { loadEnvironment } from ${JSON.stringify(environmentModule)};
      import { resolveJwtSecret } from ${JSON.stringify(authConfigModule)};
      loadEnvironment();
      try { resolveJwtSecret(); process.exitCode = 2; }
      catch (error) { console.log(JSON.stringify({ production: process.env.NODE_ENV === "production", rejected: /JWT_SECRET/.test(error.message) })); }
    `;
    const result = spawnSync(process.execPath, ["--input-type=module", "--eval", probe], {
      cwd: workingDirectory,
      env: { ...process.env, NODE_ENV: "production", JWT_SECRET: "" },
      encoding: "utf8",
      timeout: 10_000,
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain(JSON.stringify({ production: true, rejected: true }));
  });
});
