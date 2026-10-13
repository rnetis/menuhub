import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireTenant, apiError } from "@/lib/api-helpers";
import { entitlementsFor } from "@/lib/plans";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await requireTenant(id, "import.export");
  if (!ctx) return apiError("Forbidden", 403);

  const tenant = await db.tenant.findUnique({ where: { id } });
  const ent = entitlementsFor(tenant?.plan || "FREE");
  if (!ent.importExport) return apiError("Export is available on Starter plan and above", 402);

  const format = new URL(request.url).searchParams.get("format") || "csv";
  const categories = await db.category.findMany({ where: { tenantId: id }, orderBy: { sortOrder: "asc" } });
  const items = await db.menuItem.findMany({
    where: { tenantId: id },
    orderBy: { sortOrder: "asc" },
    include: { category: true, variants: true, addOns: true },
  });

  const catById = new Map(categories.map((c) => [c.id, c]));

  if (format === "json") {
    const payload = {
      exportedAt: new Date().toISOString(),
      tenant: { name: tenant?.name, slug: tenant?.slug, currency: tenant?.currency, theme: tenant?.theme },
      categories: categories.map((c) => ({ nameFa: c.nameFa, nameEn: c.nameEn, icon: c.icon, sortOrder: c.sortOrder })),
      items: items.map((it) => ({
        category: it.category.nameEn,
        nameFa: it.nameFa,
        nameEn: it.nameEn,
        descFa: it.descFa,
        descEn: it.descEn,
        price: it.basePrice,
        currency: it.currency,
        status: it.status,
        variants: it.variants.map((v) => ({ nameFa: v.nameFa, nameEn: v.nameEn, price: v.price })),
        addOns: it.addOns.map((a) => ({ nameFa: a.nameFa, nameEn: a.nameEn, price: a.price, required: a.isRequired })),
      })),
    };
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${tenant?.slug || "menu"}-backup.json"`,
      },
    });
  }

  // CSV export (BOM for Excel Persian support)
  const esc = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = "category,name_fa,name_en,description_fa,description_en,price,compare_at_price,currency,status,variants,addons";
  const lines = items.map((it) =>
    [
      esc(it.category.nameEn),
      esc(it.nameFa),
      esc(it.nameEn),
      esc(it.descFa),
      esc(it.descEn),
      esc(it.basePrice),
      esc(it.compareAtPrice ?? ""),
      esc(it.currency),
      esc(it.status),
      esc(it.variants.map((v) => `${v.nameEn}:${v.price}`).join(" | ")),
      esc(it.addOns.map((a) => `${a.nameEn}:+${a.price}`).join(" | ")),
    ].join(",")
  );
  const csv = "\uFEFF" + [header, ...lines].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${catById.size ? tenant?.slug || "menu" : "menu"}-export.csv"`,
    },
  });
}
