const DEVELOPMENT_JWT_SECRET = "iovault-dev-secret-change-me";
const MINIMUM_PRODUCTION_SECRET_LENGTH = 32;

function isPlaceholderSecret(secret) {
  const normalized = secret.toLowerCase().replace(/[^a-z0-9]/g, "");
  return secret === DEVELOPMENT_JWT_SECRET
    || /^(secret|password|changeme|replace(me)?|your(key|secret|token)(here)?)$/.test(normalized)
    || normalized.includes("changeme")
    || normalized.includes("replaceme")
    || normalized.includes("example")
    || normalized.includes("placeholder");
}

export function resolveJwtSecret(environment = process.env) {
  const configured = String(environment.JWT_SECRET || "").trim();
  const production = environment.NODE_ENV === "production";

  if (!production) return configured || DEVELOPMENT_JWT_SECRET;
  if (!configured) {
    throw new Error("JWT_SECRET is required when NODE_ENV=production.");
  }
  if (configured.length < MINIMUM_PRODUCTION_SECRET_LENGTH || new Set(configured).size < 12 || isPlaceholderSecret(configured)) {
    throw new Error(`JWT_SECRET must be a non-placeholder value of at least ${MINIMUM_PRODUCTION_SECRET_LENGTH} characters in production.`);
  }
  return configured;
}

export function assertJwtConfiguration(environment = process.env) {
  resolveJwtSecret(environment);
}

export { DEVELOPMENT_JWT_SECRET, MINIMUM_PRODUCTION_SECRET_LENGTH };
