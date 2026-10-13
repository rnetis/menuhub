import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, apiError, deviceFromUA } from "@/lib/api-helpers";

type Params = { params: Promise<{ slug: string }> };

function isOpenNow(branch: { isClosed: boolean; openHour: number; openMin: number; closeHour: number; closeMin: number }): boolean {
  if (branch.isClosed) return false;
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const start = branch.openHour * 60 + branch.openMin;
  const end = branch.closeHour * 60 + branch.closeMin;
  if (end <= start) return minutes >= start || minutes < end; // spans midnight
  return minutes >= start && minutes < end;
}

// Public, cacheable menu payload per PRD §44
export async function GET(request: NextRequest, { params }: Params) {
  const { slug } = await params;
  const tenant = await db.tenant.findUnique({ where: { slug } });
  if (!tenant || tenant.status === "SUSPENDED") {
    return apiError("Menu not found", 404);
  }

  const [categories, items, branches] = await Promise.all([
    db.category.findMany({ where: { tenantId: tenant.id, isActive: true }, orderBy: { sortOrder: "asc" } }),
    db.menuItem.findMany({
      where: { tenantId: tenant.id, status: { not: "HIDDEN" } },
      orderBy: { sortOrder: "asc" },
      include: { variants: { orderBy: { sortOrder: "asc" } }, addOns: { orderBy: { sortOrder: "asc" } } },
    }),
    db.branch.findMany({ where: { tenantId: tenant.id }, orderBy: { sortOrder: "asc" } }),
  ]);

  // Record a menu view (lightweight, no PII per PRD §37)
  const ua = request.headers.get("user-agent");
  const source = new URL(request.url).searchParams.get("src");
  try {
    await db.analyticsEvent.create({
      data: {
        tenantId: tenant.id,
        type: source === "qr" ? "QR_SCAN" : "MENU_VIEW",
        locale: new URL(request.url).searchParams.get("locale") || tenant.defaultLanguage,
        device: deviceFromUA(ua),
        referrer: request.headers.get("referer") || null,
        source: source || "direct",
      },
    });
  } catch {
    // analytics must never break the menu
  }

  const now = Date.now();
  const visibleItems = items.filter((it) => {
    if (it.availableFrom != null && it.availableTo != null) {
      const h = new Date(now).getHours();
      if (it.availableFrom <= it.availableTo) {
        if (h < it.availableFrom || h >= it.availableTo) return false;
      } else if (h < it.availableFrom && h >= it.availableTo) return false;
    }
    return true;
  });

  return json(
    {
      restaurant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        taglineFa: tenant.taglineFa,
        taglineEn: tenant.taglineEn,
        logoUrl: tenant.logoUrl,
        coverUrl: tenant.coverUrl,
        phone: tenant.phone,
        address: tenant.address,
        defaultLanguage: tenant.defaultLanguage,
        fallbackLanguage: tenant.fallbackLanguage,
        currency: tenant.currency,
        showPrices: tenant.showPrices,
        showPlatformBrand: tenant.showPlatformBrand,
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor,
        theme: tenant.theme,
        radius: tenant.radius,
      },
      categories: categories.map((c) => ({
        id: c.id,
        nameFa: c.nameFa,
        nameEn: c.nameEn,
        descFa: c.descFa,
        descEn: c.descEn,
        icon: c.icon,
      })),
      items: visibleItems.map((it) => ({
        id: it.id,
        categoryId: it.categoryId,
        nameFa: it.nameFa,
        nameEn: it.nameEn,
        descFa: it.descFa,
        descEn: it.descEn,
        imageUrl: it.imageUrl,
        basePrice: it.basePrice,
        compareAtPrice: it.compareAtPrice,
        currency: it.currency,
        status: it.status,
        featured: it.featured,
        attributes: {
          vegetarian: it.isVegetarian,
          vegan: it.isVegan,
          spicy: it.isSpicy,
          halal: it.isHalal,
          glutenFree: it.isGlutenFree,
          nuts: it.containsNuts,
          dairy: it.containsDairy,
          egg: it.containsEgg,
        },
        tags: it.tags ? it.tags.split(",").map((s) => s.trim()).filter(Boolean) : [],
        variants: it.variants.filter((v) => v.isAvailable).map((v) => ({ id: v.id, nameFa: v.nameFa, nameEn: v.nameEn, price: v.price })),
        addOns: it.addOns.filter((a) => a.isAvailable).map((a) => ({ id: a.id, nameFa: a.nameFa, nameEn: a.nameEn, price: a.price, isRequired: a.isRequired })),
      })),
      branches: branches.map((b) => ({
        id: b.id,
        name: b.name,
        nameEn: b.nameEn,
        address: b.address,
        phone: b.phone,
        open: isOpenNow(b),
        hoursText: `${String(b.openHour).padStart(2, "0")}:${String(b.openMin).padStart(2, "0")} - ${String(b.closeHour).padStart(2, "0")}:${String(b.closeMin).padStart(2, "0")}`,
      })),
    },
    200
  );
}
