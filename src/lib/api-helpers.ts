import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "./db";
import { getUserFromToken, SESSION_COOKIE } from "./auth";
import { can, Permission, Role } from "./rbac";
import type { User, Membership } from "@prisma/client";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function currentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return getUserFromToken(token);
}

export interface TenantContext {
  user: User;
  membership: Membership;
  role: Role;
}

/** Resolve the current user + their membership/role for a tenant. */
export async function requireTenant(tenantId: string, permission?: Permission): Promise<TenantContext | null> {
  const user = await currentUser();
  if (!user) return null;
  const membership = await db.membership.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId } },
  });
  if (!membership) return null;
  if (permission && !can(membership.role as Role, permission)) return null;
  return { user, membership, role: membership.role as Role };
}

/** Find tenant by slug for public access, ensuring it is active. */
export async function publicTenantBySlug(slug: string) {
  return db.tenant.findUnique({ where: { slug } });
}

export function getIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "0.0.0.0"
  );
}

export function deviceFromUA(ua: string | null): string {
  if (!ua) return "mobile";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  if (/mobile|iphone|android/i.test(ua)) return "mobile";
  return "desktop";
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}
