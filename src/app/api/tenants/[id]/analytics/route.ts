import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireTenant, json, apiError } from "@/lib/api-helpers";
import { entitlementsFor } from "@/lib/plans";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await requireTenant(id, "analytics.view");
  if (!ctx) return apiError("Forbidden", 403);

  const tenant = await db.tenant.findUnique({ where: { id } });
  const ent = entitlementsFor(tenant?.plan || "FREE");

  const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [viewsToday, viewsWeek, totalViews, weekEvents, allEvents, topItemsRaw, topCatsRaw, langRaw, deviceRaw, sourceRaw, hourRaw] =
    await Promise.all([
      db.analyticsEvent.count({ where: { tenantId: id, createdAt: { gte: startOfToday } } }),
      db.analyticsEvent.count({ where: { tenantId: id, createdAt: { gte: since7 } } }),
      db.analyticsEvent.count({ where: { tenantId: id } }),
      db.analyticsEvent.findMany({ where: { tenantId: id, createdAt: { gte: since7 } }, select: { type: true, locale: true, device: true, source: true, createdAt: true, itemName: true, category: true } }),
      db.analyticsEvent.findMany({ where: { tenantId: id, createdAt: { gte: since30 }, type: "ITEM_VIEW", itemName: { not: null } }, select: { itemName: true, category: true } }),
      db.analyticsEvent.groupBy({ by: ["itemName"], where: { tenantId: id, type: "ITEM_VIEW", itemName: { not: null } }, _count: { _all: true }, orderBy: { _count: { itemName: "desc" } }, take: 8 }),
      db.analyticsEvent.groupBy({ by: ["category"], where: { tenantId: id, type: "ITEM_VIEW", category: { not: null } }, _count: { _all: true }, orderBy: { _count: { category: "desc" } }, take: 6 }),
      db.analyticsEvent.groupBy({ by: ["locale"], where: { tenantId: id }, _count: { _all: true } }),
      db.analyticsEvent.groupBy({ by: ["device"], where: { tenantId: id }, _count: { _all: true } }),
      db.analyticsEvent.groupBy({ by: ["source"], where: { tenantId: id }, _count: { _all: true } }),
      db.analyticsEvent.findMany({ where: { tenantId: id }, select: { createdAt: true } }),
    ]);

  // Views by day (last 7 days)
  const byDay: { day: string; views: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const next = new Date(d.getTime() + 24 * 60 * 60 * 1000);
    byDay.push({
      day: d.toISOString().slice(0, 10),
      views: weekEvents.filter((e) => e.createdAt >= d && e.createdAt < next).length,
    });
  }

  // Views by hour of day
  const byHour = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    views: hourRaw.filter((e) => new Date(e.createdAt).getHours() === h).length,
  }));

  const qrScans = weekEvents.filter((e) => e.type === "QR_SCAN").length;
  const langCounts = Object.fromEntries(langRaw.map((l) => [l.locale || "fa", l._count._all]));
  const totalLang = Object.values(langCounts).reduce((a, b) => a + b, 0) || 1;

  return json({
    entitlements: ent,
    overview: {
      viewsToday,
      viewsWeek,
      totalViews,
      qrScans,
      topItem: topItemsRaw[0]?.itemName || null,
      topCategory: topCatsRaw[0]?.category || null,
      langSplit: {
        fa: Math.round(((langCounts.fa || 0) / totalLang) * 100),
        en: Math.round(((langCounts.en || 0) / totalLang) * 100),
      },
    },
    byDay,
    byHour,
    byLang: langRaw.map((l) => ({ key: l.locale || "fa", count: l._count._all })),
    byDevice: deviceRaw.map((d) => ({ key: d.device || "mobile", count: d._count._all })),
    bySource: sourceRaw.map((s) => ({ key: s.source || "direct", count: s._count._all })),
    topItems: topItemsRaw.map((i) => ({ name: i.itemName, count: i._count._all })),
    topCategories: topCatsRaw.map((c) => ({ name: c.category, count: c._count._all })),
  });
}
