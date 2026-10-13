"use client";

import * as React from "react";
import { useApp, navigate, api } from "./store";
import { Logo, Spinner } from "./ui-bits";
import { makeT, CURRENCIES } from "@/lib/i18n";
import { MENU_THEMES } from "@/lib/menu-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Building2, Coffee, Croissant, CupSoda, Pizza, UtensilsCrossed } from "lucide-react";

const TYPES = [
  { id: "restaurant", icon: UtensilsCrossed, fa: "رستوران", en: "Restaurant" },
  { id: "cafe", icon: Coffee, fa: "کافه", en: "Café" },
  { id: "fastfood", icon: Pizza, fa: "فست‌فود", en: "Fast Food" },
  { id: "bakery", icon: Croissant, fa: "نانوایی", en: "Bakery" },
  { id: "juice", icon: CupSoda, fa: "آبمیوه‌باری", en: "Juice Bar" },
  { id: "catering", icon: Building2, fa: "کترینگ", en: "Catering" },
];

export default function Onboarding() {
  const { user, refresh, dashLocale, setDashLocale } = useApp();
  const t = makeT(dashLocale);
  const fa = dashLocale === "fa";
  const [step, setStep] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [type, setType] = React.useState("restaurant");
  const [currency, setCurrency] = React.useState("EUR");
  const [theme, setTheme] = React.useState("classic");
  const [slugTouched, setSlugTouched] = React.useState(false);

  const ArrowNext = fa ? ArrowLeft : ArrowRight;
  const ArrowBack = fa ? ArrowRight : ArrowLeft;

  React.useEffect(() => {
    if (!slugTouched && name) {
      setSlug(
        name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
      );
    }
  }, [name, slugTouched]);

  React.useEffect(() => {
    if (user === null) navigate("#/login");
  }, [user]);

  if (!user) return null;

  const slugValid = /^[a-z0-9][a-z0-9-]{1,58}$/.test(slug);

  const create = async () => {
    if (!name.trim()) return toast.error(fa ? "نام رستوران لازم است" : "Restaurant name is required");
    if (!slugValid) return toast.error(fa ? "آدرس منو معتبر نیست" : "Menu address is not valid (a-z, 0-9, dashes)");
    setBusy(true);
    try {
      await api("/api/tenants", {
        method: "POST",
        json: { name: name.trim(), slug, businessType: type, currency, theme, defaultLanguage: "fa" },
      });
      await refresh();
      toast.success(fa ? "منوی شما ساخته شد 🎉" : "Your menu is live 🎉");
      navigate("#/dashboard/overview");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
      setBusy(false);
    }
  };

  const steps = [
    // Step 0 — identity
    <div key="s0" className="space-y-4">
      <div className="space-y-1.5">
        <Label>{t("onb.name")}</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={fa ? "مثلاً: کافه نُوا" : "e.g. Cafe Nova"} className="h-11 text-base" dir="auto" />
      </div>
      <div className="space-y-1.5">
        <Label>{t("onb.type")}</Label>
        <div className="grid grid-cols-3 gap-2">
          {TYPES.map((ty) => (
            <button
              key={ty.id}
              type="button"
              onClick={() => setType(ty.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-bold transition",
                type === ty.id ? "border-teal-600 bg-teal-600/5 text-teal-800 ring-2 ring-teal-600/20" : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
              )}
            >
              <ty.icon className="h-5 w-5" />
              {fa ? ty.fa : ty.en}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{t("onb.currency")}</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CURRENCIES).map(([code, c]) => (
                <SelectItem key={code} value={code}>{code} — {fa ? c.nameFa : c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t("onb.lang")}</Label>
          <Select value={dashLocale} onValueChange={(v) => setDashLocale(v as "fa" | "en")}>
            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fa">فارسی (RTL)</SelectItem>
              <SelectItem value="en">English (LTR)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>{t("onb.slug")}</Label>
        <div dir="ltr" className="flex items-center overflow-hidden rounded-md border">
          <span className="border-e bg-muted px-3 py-2.5 text-sm text-muted-foreground">menuhub.app/m/</span>
          <input
            value={slug}
            onChange={(e) => { setSlugTouched(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")); }}
            className="w-full px-3 py-2.5 text-sm outline-none"
            placeholder="cafe-nova"
          />
        </div>
        {slug && !slugValid && <p className="text-xs font-medium text-destructive">{fa ? "فقط حروف انگلیسی کوچک، عدد و خط تیره" : "Lowercase letters, numbers and dashes only"}</p>}
      </div>
    </div>,

    // Step 1 — theme
    <div key="s1" className="space-y-3">
      <p className="text-sm text-muted-foreground">{fa ? "بعداً از بخش برندینگ می‌توانید تغییرش دهید" : "You can change this later in Branding"}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.values(MENU_THEMES).map((th) => (
          <button
            key={th.id}
            type="button"
            onClick={() => setTheme(th.id)}
            className={cn(
              "overflow-hidden rounded-xl border-2 text-start shadow-sm transition hover:-translate-y-0.5",
              theme === th.id ? "border-teal-600 ring-2 ring-teal-600/25" : "border-stone-200"
            )}
          >
            <div className="flex h-16 items-end gap-1 p-2" style={{ background: th.swatch[0] }}>
              <span className="h-6 w-6 rounded-md" style={{ background: th.swatch[1] }} />
              <span className="h-3.5 w-3.5 rounded-md" style={{ background: th.swatch[2] }} />
            </div>
            <div className="bg-white px-2 py-1.5 text-xs font-bold text-stone-700">{fa ? th.nameFa : th.name}</div>
          </button>
        ))}
      </div>
    </div>,
  ];

  return (
    <div dir={fa ? "rtl" : "ltr"} className="flex min-h-screen items-center justify-center bg-[#FDFBF7] p-4 font-vazir">
      <Card className="w-full max-w-xl shadow-xl shadow-stone-200/50">
        <CardContent className="p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <button onClick={() => navigate("#/")} aria-label="Home"><Logo size={30} /></button>
            <span className="rounded-full bg-teal-600/10 px-3 py-1 text-xs font-bold text-teal-800">
              {t("onb.step")} {step + 1}/{steps.length}
            </span>
          </div>
          <h1 className="text-xl font-black text-stone-900 sm:text-2xl">{t("onb.title")}</h1>
          <p className="mb-5 mt-1 text-sm text-muted-foreground">{t("onb.sub")}</p>

          {steps[step]}

          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" onClick={() => (step > 0 ? setStep(step - 1) : navigate("#/dashboard/overview"))} className="gap-1.5">
              <ArrowBack className="h-4 w-4" /> {t("common.back")}
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={() => setStep(step + 1)} className="gap-1.5 bg-teal-700 font-bold hover:bg-teal-800">
                {fa ? "بعدی" : "Next"} <ArrowNext className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={create} disabled={busy} className="gap-2 bg-teal-700 font-bold hover:bg-teal-800">
                {busy && <Spinner className="py-0" />}
                {t("onb.create")} 🚀
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
