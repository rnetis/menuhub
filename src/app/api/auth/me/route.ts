import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/api-helpers";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ user: null });
  const memberships = await db.membership.findMany({
    where: { userId: user.id },
    include: { tenant: { select: { id: true, slug: true, name: true, logoUrl: true, plan: true, status: true, defaultLanguage: true } } },
  });
  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, isPlatformAdmin: user.isPlatformAdmin },
    tenants: memberships.map((m) => ({ ...m.tenant, role: m.role })),
  });
}
