import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireTenant, json, apiError } from "@/lib/api-helpers";
import { entitlementsFor } from "@/lib/plans";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await requireTenant(id, "menu.view");
  if (!ctx) return apiError("Forbidden", 403);
  const categoryId = new URL(request.url).searchParams.get("categoryId") || undefined;

  const items = await db.menuItem.findMany({
    where: { tenantId: id, ...(categoryId ? { categoryId } : {}) },
    orderBy: { sortOrder: "asc" },
    include: { variants: { orderBy: { sortOrder: "asc" } }, addOns: { orderBy: { sortOrder: "asc" } } },
  });
  return json({ items });
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await requireTenant(id, "menu.edit");
  if (!ctx) return apiError("Forbidden", 403);

  const tenant = await db.tenant.findUnique({ where: { id } });
  const ent = entitlementsFor(tenant?.plan || "FREE");
  const count = await db.menuItem.count({ where: { tenantId: id } });
  if (ent.maxItems !== null && count >= ent.maxItems) {
    return apiError(`Plan limit reached: ${ent.maxItems} items on your plan`, 402);
  }

  const body = await request.json();
  const nameFa = String(body.nameFa || "").trim();
  const nameEn = String(body.nameEn || "").trim();
  if (!nameFa && !nameEn) return apiError("Name is required (Persian or English)");
  if (!body.categoryId) return apiError("Category is required");

  const category = await db.category.findFirst({ where: { id: body.categoryId, tenantId: id } });
  if (!category) return apiError("Category not found", 404);

  const max = await db.menuItem.aggregate({ where: { tenantId: id }, _max: { sortOrder: true } });

  const price = Number(body.basePrice);
  if (Number.isNaN(price) || price < 0) return apiError("Invalid price");
  if (body.compareAtPrice != null && body.compareAtPrice !== "") {
    const cmp = Number(body.compareAtPrice);
    if (Number.isNaN(cmp) || cmp < 0) return apiError("Invalid compare-at price");
  }

  const status = ["AVAILABLE", "UNAVAILABLE", "HIDDEN"].includes(body.status) ? body.status : "AVAILABLE";

  const item = await db.menuItem.create({
    data: {
      tenantId: id,
      categoryId: body.categoryId,
      nameFa: nameFa || nameEn,
      nameEn: nameEn || nameFa,
      descFa: body.descFa || null,
      descEn: body.descEn || null,
      imageUrl: body.imageUrl || null,
      sku: body.sku || null,
      basePrice: price,
      compareAtPrice: body.compareAtPrice != null && body.compareAtPrice !== "" ? Number(body.compareAtPrice) : null,
      currency: tenant?.currency || "EUR",
      status,
      featured: Boolean(body.featured),
      isVegetarian: Boolean(body.isVegetarian),
      isVegan: Boolean(body.isVegan),
      isSpicy: Boolean(body.isSpicy),
      isHalal: Boolean(body.isHalal),
      isGlutenFree: Boolean(body.isGlutenFree),
      containsNuts: Boolean(body.containsNuts),
      containsDairy: Boolean(body.containsDairy),
      containsEgg: Boolean(body.containsEgg),
      tags: String(body.tags || ""),
      availableFrom: body.availableFrom != null && body.availableFrom !== "" ? Number(body.availableFrom) : null,
      availableTo: body.availableTo != null && body.availableTo !== "" ? Number(body.availableTo) : null,
      sortOrder: (max._max.sortOrder ?? -1) + 1,
    },
  });
  return json({ item }, 201);
}
