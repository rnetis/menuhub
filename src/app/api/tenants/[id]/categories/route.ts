import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireTenant, json, apiError } from "@/lib/api-helpers";
import { entitlementsFor } from "@/lib/plans";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await requireTenant(id, "menu.view");
  if (!ctx) return apiError("Forbidden", 403);
  const categories = await db.category.findMany({
    where: { tenantId: id },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { items: true } } },
  });
  return json({ categories });
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await requireTenant(id, "menu.edit");
  if (!ctx) return apiError("Forbidden", 403);

  const ent = entitlementsFor(ctx.membership ? (await db.tenant.findUnique({ where: { id } }))?.plan || "FREE" : "FREE");
  const count = await db.category.count({ where: { tenantId: id } });
  if (ent.maxCategories !== null && count >= ent.maxCategories) {
    return apiError(`Plan limit reached: ${ent.maxCategories} categories on your plan`, 402);
  }

  const body = await request.json();
  const nameFa = String(body.nameFa || "").trim();
  const nameEn = String(body.nameEn || "").trim();
  if (!nameFa && !nameEn) return apiError("Name is required (Persian or English)");

  const max = await db.category.aggregate({ where: { tenantId: id }, _max: { sortOrder: true } });

  const category = await db.category.create({
    data: {
      tenantId: id,
      nameFa: nameFa || nameEn,
      nameEn: nameEn || nameFa,
      descFa: body.descFa || null,
      descEn: body.descEn || null,
      icon: String(body.icon || "🍽️").slice(0, 8),
      imageUrl: body.imageUrl || null,
      sortOrder: (max._max.sortOrder ?? -1) + 1,
      isActive: body.isActive !== false,
    },
  });
  return json({ category }, 201);
}
