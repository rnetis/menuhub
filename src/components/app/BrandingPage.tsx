"use client";

import * as React from "react";
import { api } from "./store";
import { makeT } from "@/lib/i18n";
import { MENU_THEMES, RADIUS_MAP } from "@/lib/menu-themes";
import type { TenantSummary } from "./store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, Lock, Palette } from "lucide-react";

interface FullTenant {
  id: string; name: string; slug: string; logoUrl?: string | null; coverUrl?: string | null;
  primaryColor: string; secondaryColor: string; theme: string; radius: string;
  taglineFa?: string | null; taglineEn?: string | null; plan: string;
}

const RADIUS_LABELS: Record<string, { en: string; fa: string }> = {
  none: { en: "Sharp", fa: "تیز" },
  sm: { en: "Small", fa: "کم" },
  md: { en: "Medium", fa: "متوسط" },
  lg: { en: "Large", fa: "زیاد" },
  xl: { en: "Extra", fa: "خیلی زیاد" },
};

const PRESET_COLORS = ["#0F766E", "#B45309", "#DC2626", "#7C3AED", "#DB2777", "#2563EB", "#059669", "#D97706"];

export default function BrandingPage({ tenant, locale }: { tenant: TenantSummary; role: string; locale: "fa" | "en" }) {
  const t = makeT(locale);
  const fa = locale === "fa";
  const [form, setForm] = React.useState<Partial<FullTenant>>({});
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    api<{ tenant: FullTenant }>(`/api/tenants/${tenant.id}`).then((d) => setForm(d.tenant)).catch(() => toast.error("Failed to load"));
  }, [tenant.id]);

  const set = (k: keyof FullTenant, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setBusy(true);
    try {
      await api(`/api/tenants/${tenant.id}`, { method: "PATCH", json: form });
      toast.success(t("br.saved"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const plan = form.plan || "FREE";
  const advancedLocked = ["FREE", "STARTER"].includes(plan);

  return (
    <div className="space-y-5" dir={fa ? "rtl" : "ltr"}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">{t("br.title")}</h1>
          <p className="text-sm text-muted-foreground">{tenant.name}</p>
        </div>
        <Button onClick={save} disabled={busy} className="bg-teal-700 font-bold hover:bg-teal-800">{busy ? "…" : t("menu.save")}</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Form */}
        <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("br.logo")}</Label>
              <Input dir="ltr" value={form.logoUrl || ""} onChange={(e) => set("logoUrl", e.target.value)} placeholder="https://…/logo.png" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("br.cover")}</Label>
              <Input dir="ltr" value={form.coverUrl || ""} onChange={(e) => set("coverUrl", e.target.value)} placeholder="https://…/cover.jpg" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("br.taglineFa")}</Label>
              <Input dir="rtl" value={form.taglineFa || ""} onChange={(e) => set("taglineFa", e.target.value)} placeholder="قهوه تازه، فضای گرم" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("br.taglineEn")}</Label>
              <Input dir="ltr" value={form.taglineEn || ""} onChange={(e) => set("taglineEn", e.target.value)} placeholder="Fresh coffee, warm vibes" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("br.primary")}</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.primaryColor || "#0F766E"} onChange={(e) => set("primaryColor", e.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border" aria-label={t("br.primary")} />
                <div className="flex flex-1 flex-wrap gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button key={c} onClick={() => set("primaryColor", c)} className="flex h-7 w-7 items-center justify-center rounded-full border-2 transition hover:scale-110" style={{ background: c, borderColor: form.primaryColor === c ? "#1c1917" : "transparent" }} aria-label={`Color ${c}`}>
                      {form.primaryColor === c && <Check className="h-3.5 w-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("br.secondary")}</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.secondaryColor || "#F59E0B"} onChange={(e) => set("secondaryColor", e.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border" aria-label={t("br.secondary")} />
                <div className="flex flex-1 flex-wrap gap-1.5">
                  {["#F59E0B", "#FBBF24", "#EF4444", "#EC4899", "#8B5CF6", "#10B981"].map((c) => (
                    <button key={c} onClick={() => set("secondaryColor", c)} className="flex h-7 w-7 items-center justify-center rounded-full border-2 transition hover:scale-110" style={{ background: c, borderColor: form.secondaryColor === c ? "#1c1917" : "transparent" }} aria-label={`Color ${c}`}>
                      {form.secondaryColor === c && <Check className="h-3.5 w-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("br.radius")}</Label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(RADIUS_MAP).map((rk) => (
                <button
                  key={rk}
                  onClick={() => set("radius", rk)}
                  className={cn(
                    "flex h-14 w-14 flex-col items-center justify-center gap-1 border-2 bg-white text-[10px] font-bold transition",
                    form.radius === rk ? "border-teal-600 text-teal-800 ring-2 ring-teal-600/20" : "border-stone-200 text-stone-500"
                  )}
                  style={{ borderRadius: RADIUS_MAP[rk] }}
                >
                  <span className="h-4 w-4 border-2 border-current" style={{ borderRadius: RADIUS_MAP[rk] }} />
                  {fa ? RADIUS_LABELS[rk].fa : RADIUS_LABELS[rk].en}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Theme picker + preview */}
        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="mb-3 flex items-center gap-1.5 font-bold"><Palette className="h-4 w-4 text-teal-700" />{t("br.theme")}</p>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {Object.values(MENU_THEMES).map((th) => {
                const locked = advancedLocked && ["luxury", "cafe", "fastfood"].includes(th.id);
                return (
                  <button
                    key={th.id}
                    onClick={() => !locked && set("theme", th.id)}
                    className={cn(
                      "relative overflow-hidden rounded-xl border-2 text-start shadow-sm transition hover:-translate-y-0.5",
                      form.theme === th.id ? "border-teal-600 ring-2 ring-teal-600/25" : "border-stone-200",
                      locked && "cursor-not-allowed opacity-60 hover:translate-y-0"
                    )}
                  >
                    <div className="flex h-14 items-end gap-1 p-2" style={{ background: th.swatch[0] }}>
                      <span className="h-6 w-6 rounded-md" style={{ background: th.swatch[1] }} />
                      <span className="h-3.5 w-3.5 rounded-md" style={{ background: th.swatch[2] }} />
                    </div>
                    <div className="flex items-center justify-between bg-white px-2 py-1.5 text-[11px] font-bold text-stone-700">
                      {fa ? th.nameFa : th.name}
                      {locked && <Lock className="h-3 w-3 text-stone-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
            {advancedLocked && <p className="mt-2 text-xs text-muted-foreground">🔒 {t("br.upgradeTheme")}</p>}
          </div>

          {/* live preview */}
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="mb-3 font-bold">{t("br.preview")}</p>
            <div
              className="overflow-hidden rounded-xl border shadow-sm"
              style={{ background: MENU_THEMES[form.theme || "classic"].bg, borderColor: MENU_THEMES[form.theme || "classic"].border, borderRadius: RADIUS_MAP[form.radius || "md"] }}
            >
              <div className="h-16" style={{ background: `linear-gradient(135deg, ${form.primaryColor}, ${form.secondaryColor}55)` }} />
              <div className="p-3" style={{ color: MENU_THEMES[form.theme || "classic"].text }}>
                <div className="-mt-8 mb-2 flex h-12 w-12 items-center justify-center rounded-xl border bg-white text-xl shadow" style={{ borderRadius: `calc(${RADIUS_MAP[form.radius || "md"]} - 4px)` }}>
                  🍽️
                </div>
                <p className="font-black">{form.taglineEn ? tenant.name : tenant.name}</p>
                <p className="text-xs opacity-60">{fa ? form.taglineFa || "…" : form.taglineEn || "…"}</p>
                <div className="mt-3 flex gap-1.5">
                  <span className="px-3 py-1.5 text-xs font-bold text-white" style={{ background: form.primaryColor, borderRadius: `calc(${RADIUS_MAP[form.radius || "md"]} + 999px)` }}>
                    {fa ? "همه" : "All"}
                  </span>
                  <span className="border px-3 py-1.5 text-xs font-bold" style={{ borderColor: MENU_THEMES[form.theme || "classic"].border, borderRadius: `calc(${RADIUS_MAP[form.radius || "md"]} + 999px)` }}>
                    🍔
                  </span>
                </div>
                <div className="mt-3 flex gap-3 rounded-xl border p-2.5" style={{ borderColor: MENU_THEMES[form.theme || "classic"].border, borderRadius: RADIUS_MAP[form.radius || "md"], background: MENU_THEMES[form.theme || "classic"].surface }}>
                  <div className="h-11 w-11 rounded-lg bg-gradient-to-br from-teal-50 to-amber-50" />
                  <div className="flex-1">
                    <div className="h-2.5 w-3/4 rounded bg-stone-300/70" />
                    <div className="mt-1.5 h-2 w-1/2 rounded bg-stone-200/70" />
                    <div className="mt-2 h-2.5 w-10 rounded" style={{ background: form.primaryColor }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
