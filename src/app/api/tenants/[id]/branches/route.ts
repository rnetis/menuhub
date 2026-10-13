import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireTenant, json, apiError } from "@/lib/api-helpers";
import { entitlementsFor } from "@/lib/plans";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await requireTenant(id, "menu.view");
  if (!ctx) return apiError("Forbidden", 403);
  const branches = await db.branch.findMany({ where: { tenantId: id }, orderBy: { sortOrder: "asc" } });
  return json({ branches });
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await requireTenant(id, "branches.edit");
  if (!ctx) return apiError("Forbidden", 403);

  const tenant = await db.tenant.findUnique({ where: { id } });
  const ent = entitlementsFor(tenant?.plan || "FREE");
  const count = await db.branch.count({ where: { tenantId: id } });
  if (count >= ent.maxBranches) {
    return apiError(`Plan limit reached: ${ent.maxBranches} branch(es) on your plan`, 402);
  }

  const body = await request.json();
  const name = String(body.name || "").trim();
  if (!name) return apiError("Branch name is required");
  const max = await db.branch.aggregate({ where: { tenantId: id }, _max: { sortOrder: true } });

  const branch = await db.branch.create({
    data: {
      tenantId: id,
      name,
      nameEn: body.nameEn || null,
      address: body.address || null,
      phone: body.phone || null,
      openHour: clampHour(body.openHour, 9),
      openMin: clampMin(body.openMin),
      closeHour: clampHour(body.closeHour, 23),
      closeMin: clampMin(body.closeMin),
      isClosed: Boolean(body.isClosed),
      sortOrder: (max._max.sortOrder ?? -1) + 1,
    },
  });
  return json({ branch }, 201);
}

function clampHour(v: unknown, fallback: number): number {
  const n = Number(v);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(Math.round(n), 0), 23);
}
function clampMin(v: unknown): number {
  const n = Number(v);
  if (Number.isNaN(n)) return 0;
  return Math.min(Math.max(Math.round(n), 0), 59);
}
