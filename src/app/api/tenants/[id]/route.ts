import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireTenant, json, apiError, slugify } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

// GET single tenant (with membership check) — used to hydrate dashboard
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await requireTenant(id);
  if (!ctx) return apiError("Forbidden", 403);
  const tenant = await db.tenant.findUnique({
    where: { id },
    include: {
      categories: { orderBy: { sortOrder: "asc" } },
      branches: { orderBy: { sortOrder: "asc" } },
      _count: { select: { items: true } },
    },
  });
  return json({ tenant, role: ctx.role });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  // Settings changes need settings.edit; branding fields need branding.edit.
  // We resolve context once and decide per-field-group.
  const ctx = await requireTenant(id);
  if (!ctx) return apiError("Forbidden", 403);
  const { can } = await import("@/lib/rbac");

  const data: Record<string, unknown> = {};

  // Branding group
  if (
    ["logoUrl", "coverUrl", "primaryColor", "secondaryColor", "theme", "radius", "taglineFa", "taglineEn"].some(
      (k) => k in body
    )
  ) {
    if (!can(ctx.role, "branding.edit")) return apiError("Insufficient permissions for branding", 403);
    for (const k of ["logoUrl", "coverUrl", "taglineFa", "taglineEn"]) {
      if (k in body) data[k] = body[k] ? String(body[k]).trim().slice(0, 500) : null;
    }
    for (const k of ["primaryColor", "secondaryColor"]) {
      if (k in body) {
        if (!/^#[0-9a-fA-F]{6}$/.test(body[k])) return apiError("Invalid color format");
        data[k] = body[k];
      }
    }
    if ("theme" in body) {
      const { availableThemes } = await import("@/lib/plans");
      const tenant = await db.tenant.findUnique({ where: { id } });
      if (!availableThemes(tenant?.plan || "FREE").includes(body.theme)) {
        return apiError("This theme requires a higher plan", 402);
      }
      data.theme = body.theme;
    }
    if ("radius" in body) {
      if (!["none", "sm", "md", "lg", "xl"].includes(body.radius)) return apiError("Invalid radius");
      data.radius = body.radius;
    }
  }

  // Settings group
  if (
    ["name", "slug", "currency", "defaultLanguage", "fallbackLanguage", "phone", "address", "showPrices", "showPlatformBrand"].some(
      (k) => k in body
    )
  ) {
    if (!can(ctx.role, "settings.edit")) return apiError("Insufficient permissions for settings", 403);
    if ("name" in body) {
      const name = String(body.name || "").trim();
      if (!name) return apiError("Name cannot be empty");
      data.name = name;
    }
    if ("slug" in body) {
      const slug = slugify(String(body.slug || ""));
      if (!slug) return apiError("Invalid slug");
      const existing = await db.tenant.findUnique({ where: { slug } });
      if (existing && existing.id !== id) return apiError("This slug is already taken", 409);
      data.slug = slug;
    }
    if ("currency" in body) data.currency = String(body.currency).toUpperCase().slice(0, 3);
    if ("defaultLanguage" in body && ["fa", "en"].includes(body.defaultLanguage)) data.defaultLanguage = body.defaultLanguage;
    if ("fallbackLanguage" in body && ["fa", "en"].includes(body.fallbackLanguage)) data.fallbackLanguage = body.fallbackLanguage;
    if ("phone" in body) data.phone = body.phone ? String(body.phone).slice(0, 40) : null;
    if ("address" in body) data.address = body.address ? String(body.address).slice(0, 300) : null;
    if ("showPrices" in body) data.showPrices = Boolean(body.showPrices);
    if ("showPlatformBrand" in body) data.showPlatformBrand = Boolean(body.showPlatformBrand);
  }

  if (Object.keys(data).length === 0) return apiError("Nothing to update");

  const tenant = await db.tenant.update({ where: { id }, data });
  return json({ tenant });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await requireTenant(id, "tenant.delete");
  if (!ctx) return apiError("Forbidden", 403);
  await db.tenant.delete({ where: { id } });
  return json({ ok: true });
}
