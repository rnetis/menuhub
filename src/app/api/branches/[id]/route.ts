import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireTenant, json, apiError } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const branch = await db.branch.findUnique({ where: { id } });
  if (!branch) return apiError("Not found", 404);
  const ctx = await requireTenant(branch.tenantId, "branches.edit");
  if (!ctx) return apiError("Forbidden", 403);

  const body = await request.json();
  const data: Record<string, unknown> = {};
  if ("name" in body && String(body.name).trim()) data.name = String(body.name).trim();
  if ("nameEn" in body) data.nameEn = body.nameEn || null;
  if ("address" in body) data.address = body.address || null;
  if ("phone" in body) data.phone = body.phone || null;
  if ("isClosed" in body) data.isClosed = Boolean(body.isClosed);
  for (const k of ["openHour", "closeHour"]) {
    if (k in body) data[k] = Math.min(Math.max(Number(body[k]) || 0, 0), 23);
  }
  for (const k of ["openMin", "closeMin"]) {
    if (k in body) data[k] = Math.min(Math.max(Number(body[k]) || 0, 0), 59);
  }

  const updated = await db.branch.update({ where: { id }, data });
  return json({ branch: updated });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const branch = await db.branch.findUnique({ where: { id } });
  if (!branch) return apiError("Not found", 404);
  const ctx = await requireTenant(branch.tenantId, "branches.edit");
  if (!ctx) return apiError("Forbidden", 403);
  await db.branch.delete({ where: { id } });
  return json({ ok: true });
}
