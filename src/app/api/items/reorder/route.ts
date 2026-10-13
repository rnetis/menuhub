import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireTenant, json, apiError } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const tenantId = String(body.tenantId || "");
  const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
  if (!tenantId || ids.length === 0) return apiError("tenantId and ids required");

  const ctx = await requireTenant(tenantId, "menu.edit");
  if (!ctx) return apiError("Forbidden", 403);

  await db.$transaction(
    ids.map((id, index) =>
      db.menuItem.updateMany({ where: { id, tenantId }, data: { sortOrder: index } })
    )
  );
  return json({ ok: true });
}
