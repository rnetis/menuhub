import { db } from "@/lib/db";
import { currentUser, json, apiError } from "@/lib/api-helpers";
import { PLANS } from "@/lib/plans";

export async function GET() {
  const user = await currentUser();
  if (!user || !user.isPlatformAdmin) return apiError("Forbidden", 403);

  const tenants = await db.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { items: true, categories: true, memberships: true, events: true } },
      memberships: { where: { role: "OWNER" }, include: { user: { select: { email: true, name: true } } } },
    },
  });

  const mrr = tenants.reduce((sum, t) => sum + (PLANS[t.plan as keyof typeof PLANS]?.price || 0), 0);

  return json({
    tenants: tenants.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      plan: t.plan,
      status: t.status,
      createdAt: t.createdAt,
      counts: t._count,
      owner: t.memberships[0]?.user?.email || null,
    })),
    stats: {
      totalTenants: tenants.length,
      activeTenants: tenants.filter((t) => t.status === "ACTIVE").length,
      totalItems: tenants.reduce((s, t) => s + t._count.items, 0),
      totalEvents: tenants.reduce((s, t) => s + t._count.events, 0),
      mrr,
    },
    plans: PLANS,
  });
}
