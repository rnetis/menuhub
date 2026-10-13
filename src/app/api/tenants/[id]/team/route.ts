import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireTenant, json, apiError } from "@/lib/api-helpers";
import { entitlementsFor } from "@/lib/plans";
import { ROLE_LABELS, Role } from "@/lib/rbac";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await requireTenant(id, "menu.view");
  if (!ctx) return apiError("Forbidden", 403);
  const members = await db.membership.findMany({
    where: { tenantId: id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });
  const tenant = await db.tenant.findUnique({ where: { id }, select: { plan: true } });
  return json({
    members: members.map((m) => ({
      id: m.id,
      role: m.role,
      user: m.user,
      createdAt: m.createdAt,
    })),
    maxTeam: entitlementsFor(tenant?.plan || "FREE").maxTeam,
    roleLabels: ROLE_LABELS,
  });
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await requireTenant(id, "team.manage");
  if (!ctx) return apiError("Forbidden", 403);

  const tenant = await db.tenant.findUnique({ where: { id } });
  const ent = entitlementsFor(tenant?.plan || "FREE");
  const count = await db.membership.count({ where: { tenantId: id } });
  if (count >= ent.maxTeam) {
    return apiError(`Plan limit reached: ${ent.maxTeam} team member(s) on your plan`, 402);
  }

  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();
  const role = String(body.role || "VIEWER");
  if (!["ADMIN", "MANAGER", "EDITOR", "VIEWER"].includes(role)) return apiError("Invalid role");
  if (role === "ADMIN" && ctx.role !== "OWNER") return apiError("Only the owner can grant Admin access", 403);

  const user = await db.user.findUnique({ where: { email } });
  if (!user) return apiError("No user found with this email — ask them to register first", 404);

  const existing = await db.membership.findUnique({ where: { userId_tenantId: { userId: user.id, tenantId: id } } });
  if (existing) return apiError("This user is already a member", 409);

  const membership = await db.membership.create({
    data: { userId: user.id, tenantId: id, role: role as Role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return json({ member: membership }, 201);
}
