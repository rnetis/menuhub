import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { currentUser, json, apiError } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

// Platform admin: suspend/activate tenant or change plan
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await currentUser();
  if (!user || !user.isPlatformAdmin) return apiError("Forbidden", 403);

  const body = await request.json();
  const data: Record<string, unknown> = {};
  if ("status" in body && ["ACTIVE", "SUSPENDED"].includes(body.status)) data.status = body.status;
  if ("plan" in body && ["FREE", "STARTER", "BUSINESS", "ENTERPRISE"].includes(body.plan)) data.plan = body.plan;
  if (Object.keys(data).length === 0) return apiError("Nothing to update");

  const tenant = await db.tenant.update({ where: { id }, data });
  return json({ tenant });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await currentUser();
  if (!user || !user.isPlatformAdmin) return apiError("Forbidden", 403);
  await db.tenant.delete({ where: { id } });
  return json({ ok: true });
}
