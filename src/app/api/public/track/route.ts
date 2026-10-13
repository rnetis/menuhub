import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, apiError, deviceFromUA } from "@/lib/api-helpers";

// Fire-and-forget analytics events from the public menu (ITEM_VIEW, SEARCH, SHARE, LANGUAGE_SWITCH)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const slug = String(body.slug || "");
    const type = String(body.type || "");
    if (!slug || !["ITEM_VIEW", "SEARCH", "SHARE", "LANGUAGE_SWITCH", "MENU_VIEW", "QR_SCAN"].includes(type)) {
      return apiError("Invalid event");
    }
    const tenant = await db.tenant.findUnique({ where: { slug }, select: { id: true } });
    if (!tenant) return apiError("Not found", 404);

    await db.analyticsEvent.create({
      data: {
        tenantId: tenant.id,
        type,
        locale: ["fa", "en"].includes(body.locale) ? body.locale : "fa",
        itemId: body.itemId ? String(body.itemId) : null,
        itemName: body.itemName ? String(body.itemName).slice(0, 120) : null,
        category: body.category ? String(body.category).slice(0, 120) : null,
        device: deviceFromUA(request.headers.get("user-agent")),
        referrer: request.headers.get("referer") || null,
        source: String(body.source || "direct").slice(0, 40),
      },
    });
    return json({ ok: true });
  } catch {
    return json({ ok: true }); // never fail on analytics
  }
}
