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
export const SESSION_COOKIE_NAME = "iovault-session";
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

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

function parseCookies(header = "") {
  return Object.fromEntries(header.split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
    const separator = part.indexOf("=");
    if (separator < 0) return [part, ""];
    const name = part.slice(0, separator);
    const value = part.slice(separator + 1);
    try { return [name, decodeURIComponent(value)]; } catch { return [name, value]; }
  }));
}

function sessionCookie(value, maxAge) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function setSessionCookie(response, user) {
  response.setHeader("Set-Cookie", sessionCookie(signToken(user), SESSION_MAX_AGE_SECONDS));
}

export function clearSessionCookie(response) {
  response.setHeader("Set-Cookie", sessionCookie("", 0));
}

function requestTokens(request) {
  const header = request.headers.authorization || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : null;
  const cookie = parseCookies(request.headers.cookie)[SESSION_COOKIE_NAME] || null;
  return { bearer, cookie };
}

/** Requires a valid HttpOnly session cookie or API bearer token. */
export function requireAuth(request, response, next) {
  const { bearer, cookie } = requestTokens(request);
  const token = bearer || cookie;
  const payload = token ? verifyToken(token) : null;

  if (!payload) {
    response.status(401).json({ error: "Not authenticated." });
    return;
  }

  request.userId = payload.sub;
  request.userEmail = payload.email;
  next();
}

/** Cookie-authenticated mutations require a non-simple custom header to block CSRF. */
export function requireCsrf(request, response, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) { next(); return; }
  const { bearer, cookie } = requestTokens(request);
  if (bearer || !cookie || request.headers["x-iovault-csrf"] === "1") { next(); return; }
  response.status(403).json({ error: "CSRF validation failed." });
}
