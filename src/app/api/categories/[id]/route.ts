import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireTenant, json, apiError } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

async function getCategoryWithAccess(id: string, permission: "menu.view" | "menu.edit" | "branding.edit" | "analytics.view" | "team.manage" | "billing.manage" | "tenant.delete" | "settings.edit" | "branches.edit" | "import.export") {
  const category = await db.category.findUnique({ where: { id } });
  if (!category) return null;
  const ctx = await requireTenant(category.tenantId, permission);
  if (!ctx) return null;
  return { category, ctx };
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const found = await getCategoryWithAccess(id, "menu.edit");
  if (!found) return apiError("Forbidden", 403);
  const body = await request.json();

  const data: Record<string, unknown> = {};
  for (const k of ["nameFa", "nameEn", "descFa", "descEn", "icon", "imageUrl"]) {
    if (k in body) data[k] = body[k] === "" ? null : body[k];
  }
  if ("nameFa" in body && !data.nameFa && !found.category.nameEn) return apiError("Name cannot be empty");
  if ("nameEn" in body && !data.nameEn && !found.category.nameFa) return apiError("Name cannot be empty");
  if ("isActive" in body) data.isActive = Boolean(body.isActive);
  if ("sortOrder" in body) data.sortOrder = Number(body.sortOrder) || 0;

  const category = await db.category.update({ where: { id }, data });
  return json({ category });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const found = await getCategoryWithAccess(id, "menu.edit");
  if (!found) return apiError("Forbidden", 403);
  await db.category.delete({ where: { id } });
  return json({ ok: true });
}
