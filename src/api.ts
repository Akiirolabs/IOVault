/** Same-origin API wrapper; unsafe methods include the cookie-session CSRF header. */
export async function apiFetch(path: string, options: RequestInit = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) headers["X-IOVault-CSRF"] = "1";
  return fetch(path, { ...options, credentials: "same-origin", headers });
}
