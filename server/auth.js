/**
 * Auth helpers for IO Vault: password hashing (bcrypt) and JWT sessions.
 *
 * JWT_SECRET should be provided via env in production. A stable dev fallback is
 * used locally so sign-in works out of the box; see docs/server-and-auth.md.
 */

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "iovault-dev-secret-change-me";
const TOKEN_TTL = "30d";

export function newId() {
  return crypto.randomUUID();
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/** Express middleware: requires a valid Bearer token, sets request.userId. */
export function requireAuth(request, response, next) {
  const header = request.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const payload = token ? verifyToken(token) : null;

  if (!payload) {
    response.status(401).json({ error: "Not authenticated." });
    return;
  }

  request.userId = payload.sub;
  request.userEmail = payload.email;
  next();
}
