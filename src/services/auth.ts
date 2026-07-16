import { User } from "../types";

const BASE = "/api/auth";

export function getStoredToken(): string | null {
  return localStorage.getItem("kostel_token");
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem("kostel_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem("kostel_token");
  localStorage.removeItem("kostel_user");
}

export function saveAuth(token: string, user: User) {
  localStorage.setItem("kostel_token", token);
  localStorage.setItem("kostel_user", JSON.stringify(user));
}

export async function login(
  email: string,
  password: string
): Promise<{ token: string; user: User }> {
  const res = await fetch(`${BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Login failed" }));
    throw new Error(err.message || "Login failed");
  }
  const data = await res.json();
  return { token: data.accessToken, user: data.user as User };
}

export async function register(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: "tenant" | "owner";
}): Promise<void> {
  const res = await fetch(`${BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Registration failed" }));
    throw new Error(err.message || "Registration failed");
  }
}

export async function getMe(token: string): Promise<User> {
  const res = await fetch(`${BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Session expired");
  return res.json();
}

export function openGoogleLogin(role: "tenant" | "owner" = "tenant") {
  const url = `${window.location.origin}/api/auth/google?role=${role}`;
  const w = 500;
  const h = 600;
  const left = window.screenX + (window.outerWidth - w) / 2;
  const top = window.screenY + (window.outerHeight - h) / 2;
  window.open(
    url,
    "google-oauth",
    `width=${w},height=${h},left=${left},top=${top},popup=1`
  );
}
