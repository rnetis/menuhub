import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { currentUser, json, apiError, slugify } from "@/lib/api-helpers";

export async function GET() {
  const user = await currentUser();
  if (!user) return apiError("Unauthorized", 401);
  const memberships = await db.membership.findMany({
    where: { userId: user.id },
    include: { tenant: true },
    orderBy: { createdAt: "asc" },
  });
  return json({ tenants: memberships.map((m) => ({ ...m.tenant, role: m.role })) });
}

export async function POST(request: NextRequest) {
  const user = await currentUser();
  if (!user) return apiError("Unauthorized", 401);

  const body = await request.json();
  const name = String(body.name || "").trim();
  if (!name) return apiError("Restaurant name is required");

  let slug = slugify(String(body.slug || name)) || `menu-${Date.now().toString(36)}`;
  // ensure unique slug
  let candidate = slug;
  let i = 1;
  while (await db.tenant.findUnique({ where: { slug: candidate } })) {
    candidate = `${slug}-${i++}`;
  }
  slug = candidate;

  const theme = ["classic", "modern", "minimal", "dark", "luxury", "cafe", "fastfood"].includes(body.theme)
    ? body.theme
    : "classic";

  const tenant = await db.tenant.create({
    data: {
      name,
      slug,
      businessType: String(body.businessType || "restaurant"),
      defaultLanguage: body.defaultLanguage === "en" ? "en" : "fa",
      currency: String(body.currency || "EUR"),
      theme,
      taglineFa: String(body.taglineFa || "").trim() || null,
      taglineEn: String(body.taglineEn || "").trim() || null,
      planRenewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      memberships: { create: { userId: user.id, role: "OWNER" } },
      branches: {
        create: { name: name, nameEn: name, openHour: 9, closeHour: 23 },
      },
    },
  });

  return json({ tenant }, 201);
}
