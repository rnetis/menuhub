import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireTenant, json, apiError } from "@/lib/api-helpers";
import { PLANS, Plan } from "@/lib/plans";

type Params = { params: Promise<{ id: string }> };

// Demo-mode plan switching (no payment processing in MVP per PRD §49)
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await requireTenant(id, "billing.manage");
  if (!ctx) return apiError("Forbidden", 403);

  const body = await request.json();
  const plan = String(body.plan || "");
  if (!Object.keys(PLANS).includes(plan)) return apiError("Invalid plan");

  const tenant = await db.tenant.update({
    where: { id },
    data: {
      plan: plan as Plan,
      planRenewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      showPlatformBrand: plan === "FREE" ? true : tenant_showBrand(plan),
    },
  });
  return json({ tenant });
}

function tenant_showBrand(plan: string): boolean {
  return plan === "FREE";
}
