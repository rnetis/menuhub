import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, apiError } from "@/lib/api-helpers";
import { requireTenant } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  const membership = await db.membership.findUnique({ where: { id } });
  if (!membership) return apiError("Not found", 404);
  const myCtx = await requireTenant(membership.tenantId, "team.manage");
  if (!myCtx) return apiError("Forbidden", 403);

  if (membership.role === "OWNER") return apiError("The owner role cannot be changed");
  if ("role" in body) {
    if (!["ADMIN", "MANAGER", "EDITOR", "VIEWER"].includes(body.role)) return apiError("Invalid role");
    if (body.role === "ADMIN" && myCtx.role !== "OWNER") return apiError("Only the owner can grant Admin access", 403);
    await db.membership.update({ where: { id }, data: { role: body.role } });
  }
  return json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const membership = await db.membership.findUnique({ where: { id } });
  if (!membership) return apiError("Not found", 404);
  const ctx = await requireTenant(membership.tenantId, "team.manage");
  if (!ctx) return apiError("Forbidden", 403);
  if (membership.role === "OWNER") return apiError("The owner cannot be removed", 400);
  await db.membership.delete({ where: { id } });
  return json({ ok: true });
}
