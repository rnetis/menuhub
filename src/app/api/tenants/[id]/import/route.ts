import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireTenant, json, apiError } from "@/lib/api-helpers";
import { entitlementsFor } from "@/lib/plans";

type Params = { params: Promise<{ id: string }> };

interface ImportRow {
  category: string;
  name_fa: string;
  name_en: string;
  description_fa?: string;
  description_en?: string;
  price?: string;
  currency?: string;
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await requireTenant(id, "import.export");
  if (!ctx) return apiError("Forbidden", 403);

  const tenant = await db.tenant.findUnique({ where: { id } });
  const ent = entitlementsFor(tenant?.plan || "FREE");
  if (!ent.importExport) return apiError("Import is available on Starter plan and above", 402);

  const body = await request.json();
  const rows: ImportRow[] = Array.isArray(body.rows) ? body.rows : [];
  if (rows.length === 0) return apiError("No rows to import");

  const currentCount = await db.menuItem.count({ where: { tenantId: id } });
  if (ent.maxItems !== null && currentCount + rows.length > ent.maxItems) {
    return apiError(`Plan limit: your plan allows ${ent.maxItems} items total`, 402);
  }

  // Group rows by category, create categories as needed
  const existingCategories = await db.category.findMany({ where: { tenantId: id } });
  const catByName = new Map<string, string>();
  for (const c of existingCategories) {
    catByName.set(c.nameEn.toLowerCase(), c.id);
    catByName.set(c.nameFa, c.id);
  }

  let createdCategories = 0;
  let maxCatSort = (await db.category.aggregate({ where: { tenantId: id }, _max: { sortOrder: true } }))._max.sortOrder ?? -1;
  let maxItemSort = (await db.menuItem.aggregate({ where: { tenantId: id }, _max: { sortOrder: true } }))._max.sortOrder ?? -1;

  let created = 0;
  for (const row of rows) {
    const catName = String(row.category || "Menu").trim();
    let categoryId = catByName.get(catName) || catByName.get(catName.toLowerCase());
    if (!categoryId) {
      maxCatSort += 1;
      const cat = await db.category.create({
        data: {
          tenantId: id,
          nameFa: catName,
          nameEn: catName,
          icon: "🍽️",
          sortOrder: maxCatSort,
        },
      });
      catByName.set(catName, cat.id);
      catByName.set(catName.toLowerCase(), cat.id);
      categoryId = cat.id;
      createdCategories++;
    }
    maxItemSort += 1;
    await db.menuItem.create({
      data: {
        tenantId: id,
        categoryId,
        nameFa: String(row.name_fa || row.name_en || "").trim() || "بدون نام",
        nameEn: String(row.name_en || row.name_fa || "").trim() || "Unnamed",
        descFa: row.description_fa || null,
        descEn: row.description_en || null,
        basePrice: Number(row.price) || 0,
        currency: String(row.currency || tenant?.currency || "EUR").toUpperCase().slice(0, 3),
        sortOrder: maxItemSort,
      },
    });
    created++;
  }

  return json({ imported: created, createdCategories });
}
