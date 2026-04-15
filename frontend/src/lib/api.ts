const BASE = "/api";

function getToken(): string | null {
  return localStorage.getItem("token");
}

export function setAuth(token: string, user: any) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getUser(): any | null {
  const u = localStorage.getItem("user");
  return u ? JSON.parse(u) : null;
}

export async function api<T = any>(
  path: string,
  opts: { method?: string; body?: any; auth?: boolean } = {}
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.auth !== false) {
    const t = getToken();
    if (t) headers["Authorization"] = `Bearer ${t}`;
  }
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Xəta baş verdi" }));
    let msg: string;
    if (Array.isArray(err.detail)) {
      msg = err.detail.map((e: any) => e.msg || JSON.stringify(e)).join("; ");
    } else if (typeof err.detail === "string") {
      msg = err.detail;
    } else {
      msg = "Xəta baş verdi";
    }
    throw new Error(msg);
  }
  return res.json();
}
