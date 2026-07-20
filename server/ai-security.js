const DEFAULT_WINDOW_MS = 60_000;

export class FixedWindowLimiter {
  constructor({ limit, windowMs = DEFAULT_WINDOW_MS, now = () => Date.now() }) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.now = now;
    this.entries = new Map();
  }

  consume(key) {
    const now = this.now();
    const current = this.entries.get(key);
    const entry = !current || current.resetAt <= now
      ? { count: 0, resetAt: now + this.windowMs }
      : current;
    entry.count += 1;
    this.entries.set(key, entry);
    return {
      allowed: entry.count <= this.limit,
      retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  cleanup() {
    const now = this.now();
    for (const [key, entry] of this.entries) {
      if (entry.resetAt <= now) this.entries.delete(key);
    }
  }

  reset() {
    this.entries.clear();
  }
}

export function createAiRateLimiter({
  userLimit = 10,
  ipLimit = 30,
  windowMs = DEFAULT_WINDOW_MS,
  now,
} = {}) {
  const users = new FixedWindowLimiter({ limit: userLimit, windowMs, now });
  const ips = new FixedWindowLimiter({ limit: ipLimit, windowMs, now });

  function middleware(request, response, next) {
    const userResult = users.consume(String(request.userId));
    const ipResult = ips.consume(request.ip || request.socket?.remoteAddress || "unknown");
    if (!userResult.allowed || !ipResult.allowed) {
      const retryAfter = Math.max(userResult.retryAfter, ipResult.retryAfter);
      response.set("Retry-After", String(retryAfter));
      response.status(429).json({ error: "Too many AI requests. Try again shortly." });
      return;
    }
    next();
  }

  return { middleware, reset: () => { users.reset(); ips.reset(); }, cleanup: () => { users.cleanup(); ips.cleanup(); } };
}

export function validateAgentRequest(body) {
  if (typeof body?.message !== "string" || !body.message.trim()) {
    return { status: 400, error: "Message is required." };
  }
  const message = body.message.trim();
  if (message.length > 8_000) {
    return { status: 413, error: "Message must be 8,000 characters or fewer." };
  }

  const context = body?.context ?? null;
  let serializedContext = null;
  try {
    if (context !== null) serializedContext = JSON.stringify(context);
  } catch {
    return { status: 400, error: "Selected context must be valid JSON." };
  }
  const contextBytes = serializedContext === null ? 0 : Buffer.byteLength(serializedContext, "utf8");
  if (contextBytes > 64 * 1024) {
    return { status: 413, error: "Selected context must be 64 KB or smaller." };
  }
  return { message, context, serializedContext, contextBytes };
}
