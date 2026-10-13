import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireTenant, json, apiError } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const item = await db.menuItem.findUnique({ where: { id } });
  if (!item) return apiError("Not found", 404);
  const ctx = await requireTenant(item.tenantId, "menu.view");
  if (!ctx) return apiError("Forbidden", 403);
  const full = await db.menuItem.findUnique({
    where: { id },
    include: { variants: { orderBy: { sortOrder: "asc" } }, addOns: { orderBy: { sortOrder: "asc" } } },
  });
  return json({ item: full });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const existing = await db.menuItem.findUnique({ where: { id } });
  if (!existing) return apiError("Not found", 404);
  const ctx = await requireTenant(existing.tenantId, "menu.edit");
  if (!ctx) return apiError("Forbidden", 403);

  const body = await request.json();
  const data: Record<string, unknown> = {};

  for (const k of ["nameFa", "nameEn", "descFa", "descEn", "imageUrl", "sku", "tags"]) {
    if (k in body) data[k] = body[k] === "" ? (k.startsWith("desc") || ["imageUrl", "sku", "tags"].includes(k) ? null : body[k]) : body[k];
  }
  if ("categoryId" in body) {
    const category = await db.category.findFirst({ where: { id: body.categoryId, tenantId: existing.tenantId } });
    if (!category) return apiError("Category not found", 404);
    data.categoryId = body.categoryId;
  }
  if ("basePrice" in body) {
    const price = Number(body.basePrice);
    if (Number.isNaN(price) || price < 0) return apiError("Invalid price");
    data.basePrice = price;
  }
  if ("compareAtPrice" in body) {
    data.compareAtPrice = body.compareAtPrice === null || body.compareAtPrice === "" ? null : Number(body.compareAtPrice);
  }
  if ("status" in body) {
    if (!["AVAILABLE", "UNAVAILABLE", "HIDDEN"].includes(body.status)) return apiError("Invalid status");
    data.status = body.status;
  }
  for (const k of ["featured", "isVegetarian", "isVegan", "isSpicy", "isHalal", "isGlutenFree", "containsNuts", "containsDairy", "containsEgg"]) {
    if (k in body) data[k] = Boolean(body[k]);
  }
  if ("availableFrom" in body) data.availableFrom = body.availableFrom === null || body.availableFrom === "" ? null : Number(body.availableFrom);
  if ("availableTo" in body) data.availableTo = body.availableTo === null || body.availableTo === "" ? null : Number(body.availableTo);
  if ("sortOrder" in body) data.sortOrder = Number(body.sortOrder) || 0;

  // Replace variants / add-ons wholesale when provided
  if (Array.isArray(body.variants)) {
    await db.variant.deleteMany({ where: { itemId: id } });
    if (body.variants.length > 0) {
      await db.variant.createMany({
        data: body.variants.map((v: Record<string, unknown>, i: number) => ({
          itemId: id,
          nameFa: String(v.nameFa || v.nameEn || "").trim() || String(v.nameEn || "").trim(),
          nameEn: String(v.nameEn || v.nameFa || "").trim() || String(v.nameFa || "").trim(),
          price: Number(v.price) || 0,
          isAvailable: v.isAvailable !== false,
          sortOrder: i,
        })),
      });
    }
  }
  if (Array.isArray(body.addOns)) {
    await db.addOn.deleteMany({ where: { itemId: id } });
    if (body.addOns.length > 0) {
      await db.addOn.createMany({
        data: body.addOns.map((a: Record<string, unknown>, i: number) => ({
          itemId: id,
          nameFa: String(a.nameFa || a.nameEn || "").trim() || String(a.nameEn || "").trim(),
          nameEn: String(a.nameEn || a.nameFa || "").trim() || String(a.nameFa || "").trim(),
          price: Number(a.price) || 0,
          isRequired: Boolean(a.isRequired),
          isAvailable: a.isAvailable !== false,
          sortOrder: i,
        })),
      });
    }
  }

  if (Object.keys(data).length > 0) {
    await db.menuItem.update({ where: { id }, data });
  }
  const item = await db.menuItem.findUnique({
    where: { id },
    include: { variants: { orderBy: { sortOrder: "asc" } }, addOns: { orderBy: { sortOrder: "asc" } } },
  });
  return json({ item });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const existing = await db.menuItem.findUnique({ where: { id } });
  if (!existing) return apiError("Not found", 404);
  const ctx = await requireTenant(existing.tenantId, "menu.edit");
  if (!ctx) return apiError("Forbidden", 403);
  await db.menuItem.delete({ where: { id } });
  return json({ ok: true });
}
