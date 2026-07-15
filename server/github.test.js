// @vitest-environment node
import { describe, expect, it } from "vitest";
import { validRepositoryPath } from "./github.js";

describe("GitHub path validation", () => {
  it("allows normal repository paths", () => {
    expect(validRepositoryPath("src/components/Card.tsx")).toBe(true);
  });
  it("rejects traversal, absolute paths, and env files", () => {
    expect(validRepositoryPath("../secret.txt")).toBe(false);
    expect(validRepositoryPath("/etc/passwd")).toBe(false);
    expect(validRepositoryPath(".env.local")).toBe(false);
  });
});
