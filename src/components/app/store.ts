"use client";

import { create } from "zustand";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  isPlatformAdmin: boolean;
}

export interface TenantSummary {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string | null;
  plan?: string;
  status?: string;
  defaultLanguage?: string;
  role?: string;
}

interface AppState {
  user: SessionUser | null;
  tenants: TenantSummary[];
  loaded: boolean;
  dashLocale: "fa" | "en";
  setSession: (user: SessionUser | null, tenants: TenantSummary[]) => void;
  setDashLocale: (l: "fa" | "en") => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useApp = create<AppState>((set) => ({
  user: null,
  tenants: [],
  loaded: false,
  dashLocale: "en",
  setSession: (user, tenants) => set({ user, tenants, loaded: true }),
  setDashLocale: (dashLocale) => set({ dashLocale }),
  refresh: async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      set({ user: data.user || null, tenants: data.tenants || [], loaded: true });
    } catch {
      set({ user: null, tenants: [], loaded: true });
    }
  },
  logout: async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    set({ user: null, tenants: [] });
  },
}));

// ── hash router ──
export type Route =
  | { name: "landing" }
  | { name: "login" }
  | { name: "register" }
  | { name: "onboarding" }
  | { name: "dash"; section: string }
  | { name: "menu"; slug: string }
  | { name: "admin" };

export function parseHash(hash: string): Route {
  const h = hash.replace(/^#/, "");
  const parts = h.split("/").filter(Boolean);
  if (parts.length === 0) return { name: "landing" };
  switch (parts[0]) {
    case "login":
      return { name: "login" };
    case "register":
      return { name: "register" };
    case "onboarding":
      return { name: "onboarding" };
    case "dashboard":
      return { name: "dash", section: parts[1] || "overview" };
    case "m":
      return { name: "menu", slug: parts[1] || "" };
    case "admin":
      return { name: "admin" };
    default:
      return { name: "landing" };
  }
}

export function navigate(to: string) {
  if (typeof window !== "undefined") {
    window.location.hash = to;
  }
}

// shared fetch helper
export async function api<T = unknown>(url: string, options?: RequestInit & { json?: unknown }): Promise<T> {
  const { json: bodyJson, ...rest } = options || {};
  const res = await fetch(url, {
    ...rest,
    headers: { "Content-Type": "application/json", ...(rest.headers || {}) },
    body: bodyJson !== undefined ? JSON.stringify(bodyJson) : rest.body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}
