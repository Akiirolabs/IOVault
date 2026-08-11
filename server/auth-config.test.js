// @vitest-environment node
import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import jwt from "jsonwebtoken";
import { afterEach, describe, expect, it } from "vitest";
import { DEVELOPMENT_JWT_SECRET, resolveJwtSecret } from "./auth-config.js";
import { signToken, verifyToken } from "./auth.js";

const originalEnvironment = { NODE_ENV: process.env.NODE_ENV, JWT_SECRET: process.env.JWT_SECRET };

afterEach(() => {
  if (originalEnvironment.NODE_ENV === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalEnvironment.NODE_ENV;
  if (originalEnvironment.JWT_SECRET === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalEnvironment.JWT_SECRET;
});

describe("JWT configuration", () => {
  it("uses the documented fallback only outside production", () => {
    expect(resolveJwtSecret({ NODE_ENV: "development" })).toBe(DEVELOPMENT_JWT_SECRET);
    expect(resolveJwtSecret({ NODE_ENV: "test" })).toBe(DEVELOPMENT_JWT_SECRET);
  });

  it.each([undefined, "change-me", DEVELOPMENT_JWT_SECRET, "short-production-secret", "a".repeat(64), "please-change-me-before-production-2026"])(
    "rejects missing, placeholder, or weak production configuration (%s)",
    (JWT_SECRET) => {
      expect(() => resolveJwtSecret({ NODE_ENV: "production", JWT_SECRET })).toThrow(/JWT_SECRET/);
    },
  );

  it("fails a realistic production server startup before listening when the secret is absent", () => {
    const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
    const isolatedWorkingDirectory = mkdtempSync(path.join(tmpdir(), "iovault-auth-startup-"));
    const result = spawnSync(process.execPath, [path.join(repositoryRoot, "server/index.js")], {
      cwd: isolatedWorkingDirectory,
      env: {
        ...process.env,
        NODE_ENV: "production",
        JWT_SECRET: "",
        DATABASE_FILE: path.join(isolatedWorkingDirectory, "iovault.db"),
      },
      encoding: "utf8",
      timeout: 10_000,
    });

    expect(result.status).not.toBe(0);
    expect(`${result.stdout}\n${result.stderr}`).toMatch(/JWT_SECRET is required/);
    expect(result.stdout).not.toContain("IO Vault API running");
  });

  it("uses a configured production secret and rejects tokens signed with the fallback", () => {
    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET = "a-production-signing-key-with-strong-length-2026";
    const user = { id: "configured-user", email: "configured@example.com" };
    const configuredToken = signToken(user);
    const fallbackToken = jwt.sign({ sub: user.id, email: user.email }, DEVELOPMENT_JWT_SECRET);

    expect(verifyToken(configuredToken)).toMatchObject({ sub: user.id });
    expect(verifyToken(fallbackToken)).toBeNull();
  });
});
