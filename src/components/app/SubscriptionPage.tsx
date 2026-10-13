"use client";

import * as React from "react";
import { api } from "./store";
import { makeT } from "@/lib/i18n";
import { PLANS, type Plan } from "@/lib/plans";
import type { TenantSummary } from "./store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Sparkles, CreditCard } from "lucide-react";

interface SubTenant extends TenantSummary { planRenewsAt?: string }

export default function SubscriptionPage({ tenant, locale, onTenantChange }: { tenant: SubTenant; role: string; locale: "fa" | "en"; onTenantChange: () => Promise<void> }) {
  const t = makeT(locale);
  const fa = locale === "fa";
  const [current, setCurrent] = React.useState(tenant.plan || "FREE");
  const [busy, setBusy] = React.useState<string | null>(null);

  React.useEffect(() => setCurrent(tenant.plan || "FREE"), [tenant.plan]);

  const switchPlan = async (plan: Plan) => {
    setBusy(plan);
    try {
      await api(`/api/tenants/${tenant.id}/subscription`, { method: "POST", json: { plan } });
      setCurrent(plan);
      await onTenantChange();
      toast.success(fa ? `پلن به ${PLANS[plan].nameFa} تغییر کرد` : `Plan switched to ${PLANS[plan].name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5" dir={fa ? "rtl" : "ltr"}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black">{t("sb.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("sb.note")}</p>
        </div>
        <Badge className="gap-1 bg-teal-700 text-white hover:bg-teal-700">
          <CreditCard className="h-3.5 w-3.5" /> {t("sb.current")}: {fa ? PLANS[current as Plan]?.nameFa : PLANS[current as Plan]?.name}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(Object.keys(PLANS) as Plan[]).map((p) => {
          const plan = PLANS[p];
          const isCurrent = current === p;
          const popular = p === "STARTER";
          return (
            <div
              key={p}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-5 shadow-sm transition",
                isCurrent && "border-teal-600 ring-2 ring-teal-600/25",
                popular && !isCurrent && "border-amber-300"
              )}
            >
              {popular && (
                <span className="absolute -top-2.5 start-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-0.5 text-[10px] font-black text-stone-900 rtl:translate-x-1/2">
                  <Sparkles className="me-1 inline h-3 w-3" />{fa ? "پیشنهاد" : "POPULAR"}
                </span>
              )}
              <p className="font-black">{fa ? plan.nameFa : plan.name}</p>
              <p className="mt-1" dir="ltr">
                <span className="text-3xl font-black tracking-tight">${plan.price}</span>
                <span className="text-sm text-muted-foreground">{t("sb.perMonth")}</span>
              </p>
              <ul className="mb-4 mt-4 flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs font-medium text-stone-600">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                disabled={isCurrent || busy === p}
                onClick={() => switchPlan(p)}
                className={cn(
                  "font-bold",
                  isCurrent ? "" : popular ? "bg-amber-400 text-stone-900 hover:bg-amber-300" : "bg-teal-700 hover:bg-teal-800"
                )}
                variant={isCurrent ? "outline" : "default"}
              >
                {isCurrent ? <>✓ {t("sb.active")}</> : busy === p ? "…" : t("sb.choose")}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
        <p className="font-bold text-foreground">{fa ? "چه چیزی محدود می‌شود؟" : "How entitlements work"}</p>
        <p className="mt-1">
          {fa
            ? "سقف دسته‌ها/آیتم‌ها، تعداد شعبه و اعضای تیم، تم‌های پیشرفته، برندینگ اختصاصی و ورود/خروج داده بر اساس پلن فعلی کنترل می‌شوند (سیستم Entitlements)."
            : "Category/item limits, branches, team size, advanced themes, custom branding and import/export are enforced by the entitlements engine based on the current plan."}
        </p>
      </div>
    </div>
  );
}
