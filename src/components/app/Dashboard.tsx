"use client";

import * as React from "react";
import { useApp, navigate, api, type TenantSummary } from "./store";
import { Logo, Spinner, StatCard, BarChart, HBar, EmptyState } from "./ui-bits";
import { makeT, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  LayoutDashboard, UtensilsCrossed, QrCode, Palette, Network, BarChart3, Users, CreditCard,
  Settings, FileDown, ExternalLink, Languages, LogOut, Plus, Eye, ScanLine, Trophy, CheckCircle2, Circle, Globe,
} from "lucide-react";

const SECTIONS = [
  { id: "overview", icon: LayoutDashboard, key: "nav.overview" },
  { id: "menu", icon: UtensilsCrossed, key: "nav.menu" },
  { id: "qr", icon: QrCode, key: "nav.qr" },
  { id: "branding", icon: Palette, key: "nav.branding" },
  { id: "branches", icon: Network, key: "nav.branches" },
  { id: "analytics", icon: BarChart3, key: "nav.analytics" },
  { id: "team", icon: Users, key: "nav.team" },
  { id: "importexport", icon: FileDown, key: "nav.importExport" },
  { id: "subscription", icon: CreditCard, key: "nav.subscription" },
  { id: "settings", icon: Settings, key: "nav.settings" },
];

interface AnalyticsData {
  overview: { viewsToday: number; viewsWeek: number; totalViews: number; qrScans: number; topItem: string | null; topCategory: string | null; langSplit: { fa: number; en: number } };
  byDay: { day: string; views: number }[];
  byLang: { key: string; count: number }[];
  topItems: { name: string; count: number }[];
}

export default function Dashboard({ section }: { section: string }) {
  const { user, tenants, loaded, dashLocale, setDashLocale, logout, refresh } = useApp();
  const t = makeT(dashLocale);
  const fa = dashLocale === "fa";

  const [activeTenant, setActiveTenant] = React.useState<TenantSummary | null>(null);

  React.useEffect(() => {
    if (!loaded) return;
    if (!user) navigate("#/login");
  }, [user, loaded]);

  React.useEffect(() => {
    if (tenants.length > 0 && !activeTenant) {
      setActiveTenant(tenants[0]);
    }
  }, [tenants, activeTenant]);

  if (!loaded || (!user && !loaded)) {
    return <div className="flex min-h-screen items-center justify-center"><Spinner /></div>;
  }
  if (!user) return null;

  if (tenants.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center font-vazir">
        <Logo size={40} />
        <p className="font-bold">{fa ? "هنوز رستورانی نساخته‌اید" : "You don't have a restaurant yet"}</p>
        <Button onClick={() => navigate("#/onboarding")} className="bg-teal-700 font-bold hover:bg-teal-800">
          <Plus className="h-4 w-4" /> {fa ? "ساخت رستوران" : "Create restaurant"}
        </Button>
      </div>
    );
  }

  if (!activeTenant) return <div className="flex min-h-screen items-center justify-center"><Spinner /></div>;

  const role = activeTenant.role || "VIEWER";

  const switchTenant = async (id: string) => {
    setActiveTenant(tenants.find((x) => x.id === id) || null);
  };

  const sidebar = (
    <aside className="flex h-full w-60 flex-col border-e bg-white" dir="ltr">
      <div className="flex h-16 items-center border-b px-4" dir="ltr">
        <button onClick={() => navigate("#/")} aria-label="Home"><Logo size={28} /></button>
      </div>
      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="space-y-0.5" aria-label="Dashboard sections">
          {SECTIONS.map((s) => {
            const active = section === s.id;
            return (
              <button
                key={s.id}
                onClick={() => navigate(`#/dashboard/${s.id}`)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-bold transition",
                  active ? "bg-teal-700 text-white shadow-sm" : "text-stone-600 hover:bg-stone-100"
                )}
                aria-current={active ? "page" : undefined}
              >
                <s.icon className="h-4.5 w-4.5" />
                <span dir="auto">{t(s.key)}</span>
              </button>
            );
          })}
        </nav>
        {user.isPlatformAdmin && (
          <button
            onClick={() => navigate("#/admin")}
            className="mt-3 flex w-full items-center gap-2.5 rounded-lg border border-dashed border-stone-300 px-3 py-2.5 text-sm font-bold text-stone-500 hover:bg-stone-50"
          >
            <Globe className="h-4.5 w-4.5" /> {t("nav.platform")}
          </button>
        )}
      </ScrollArea>
      <div className="border-t p-3" dir="ltr">
        <Button variant="outline" size="sm" className="mb-2 w-full justify-start gap-2" onClick={() => window.open(`#/m/${activeTenant.slug}`, "_blank")}>
          <ExternalLink className="h-4 w-4 text-teal-700" />
          <span className="truncate">{t("nav.viewMenu")}</span>
        </Button>
        <div className="flex items-center gap-2 rounded-lg bg-stone-50 p-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-xs font-black text-white">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold">{user.name}</p>
            <p className="truncate text-[10px] text-muted-foreground">{role}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={async () => { await logout(); navigate("#/"); }} aria-label={t("auth.logout")}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );

  return (
    <div dir={fa ? "rtl" : "ltr"} className="flex min-h-screen bg-[#F7F6F2] font-vazir">
      {/* Desktop sidebar */}
      <div className="fixed inset-y-0 hidden lg:block" style={{ [fa ? "right" : "left"]: 0 }}>
        {sidebar}
      </div>

      <div className="flex min-h-screen w-full flex-col lg:ps-60">
        {/* Top bar */}
        <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
          <div className="flex h-14 items-center gap-3 px-4">
            <div className="lg:hidden"><Logo size={26} /></div>
            <div className="ms-auto flex items-center gap-2">
              <Select value={activeTenant.id} onValueChange={switchTenant}>
                <SelectTrigger className="h-9 w-[180px] text-sm font-bold" aria-label="Switch restaurant">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tt) => (
                    <SelectItem key={tt.id} value={tt.id}>{tt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setDashLocale(fa ? "en" : "fa")} aria-label="Toggle dashboard language">
                <Languages className="h-4 w-4" />
                <span className="text-xs font-black">{fa ? "EN" : "فا"}</span>
              </Button>
            </div>
          </div>
          {/* Mobile section nav */}
          <div className="nice-scroll flex gap-1 overflow-x-auto border-t px-3 py-1.5 lg:hidden">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => navigate(`#/dashboard/${s.id}`)}
                className={cn("flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold", section === s.id ? "bg-teal-700 text-white" : "bg-stone-100 text-stone-600")}
              >
                <s.icon className="h-3.5 w-3.5" />{t(s.key)}
              </button>
            ))}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <div className="mx-auto max-w-5xl">
            {section === "overview" && <Overview tenant={activeTenant} locale={dashLocale} />}
            {section !== "overview" && <SectionLoader section={section} tenant={activeTenant} role={role} locale={dashLocale} onTenantChange={refresh} />}
          </div>
        </main>
      </div>
    </div>
  );
}

// Lazy-load sections (kept in separate files)
import { lazy, Suspense } from "react";
const MenuEditor = lazy(() => import("./MenuEditor"));
const QrPage = lazy(() => import("./QrPage"));
const BrandingPage = lazy(() => import("./BrandingPage"));
const BranchesPage = lazy(() => import("./BranchesPage"));
const AnalyticsPage = lazy(() => import("./AnalyticsPage"));
const TeamPage = lazy(() => import("./TeamPage"));
const SubscriptionPage = lazy(() => import("./SubscriptionPage"));
const SettingsPage = lazy(() => import("./SettingsPage"));
const ImportExportPage = lazy(() => import("./ImportExportPage"));

function SectionLoader({ section, tenant, role, locale, onTenantChange }: { section: string; tenant: TenantSummary; role: string; locale: Locale; onTenantChange: () => Promise<void> }) {
  const Cmp =
    section === "menu" ? MenuEditor :
    section === "qr" ? QrPage :
    section === "branding" ? BrandingPage :
    section === "branches" ? BranchesPage :
    section === "analytics" ? AnalyticsPage :
    section === "team" ? TeamPage :
    section === "subscription" ? SubscriptionPage :
    section === "settings" ? SettingsPage :
    section === "importexport" ? ImportExportPage : null;
  if (!Cmp) return <EmptyState emoji="🚧" title="Coming soon" />;
  return (
    <Suspense fallback={<Spinner />}>
      <Cmp tenant={tenant} role={role} locale={locale} onTenantChange={onTenantChange} />
    </Suspense>
  );
}

// ─── Overview ───
function Overview({ tenant, locale }: { tenant: TenantSummary; locale: Locale }) {
  const t = makeT(locale);
  const fa = locale === "fa";
  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [menuStats, setMenuStats] = React.useState<{ cats: number; items: number; hasFa: number; hasEn: number } | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const [a, cats, items] = await Promise.all([
          api<AnalyticsData>(`/api/tenants/${tenant.id}/analytics`),
          api<{ categories: { _count: { items: number } }[] }>(`/api/tenants/${tenant.id}/categories`),
          api<{ items: { nameFa: string; nameEn: string }[] }>(`/api/tenants/${tenant.id}/items`),
        ]);
        setData(a);
        setMenuStats({
          cats: cats.categories.length,
          items: items.items.length,
          hasFa: items.items.filter((i) => i.nameFa && /[\u0600-\u06FF]/.test(i.nameFa)).length,
          hasEn: items.items.filter((i) => i.nameEn && /[a-zA-Z]/.test(i.nameEn)).length,
        });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    })();
  }, [tenant.id]);

  if (!data) return <Spinner />;

  const ov = data.overview;
  const week = data.byDay.map((d) => ({ label: new Date(d.day + "T00:00:00").toLocaleDateString(fa ? "fa-IR" : "en-US", { weekday: "short" }), value: d.views }));
  const checklist = [
    { done: menuStats !== null && menuStats.cats > 0, label: t("ov.guideCat") },
    { done: menuStats !== null && menuStats.items > 0, label: t("ov.guideItem") },
    { done: menuStats !== null && menuStats.hasFa > 0, label: t("ov.guideItemFa") },
    { done: menuStats !== null && menuStats.hasEn > 0, label: t("ov.guideItemEn") },
    { done: data.overview.totalViews > 0, label: t("ov.guidePublish") },
  ];
  const doneCount = checklist.filter((c) => c.done).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">{t("ov.hello")}</h1>
          <p className="text-sm text-muted-foreground">{tenant.name} · menuhub.app/m/{tenant.slug}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="gap-1.5 bg-teal-700 font-bold hover:bg-teal-800" onClick={() => navigate("#/dashboard/menu")}>
            <Plus className="h-4 w-4" /> {t("ov.addItem")}
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 font-bold" onClick={() => navigate("#/dashboard/qr")}>
            <QrCode className="h-4 w-4" /> {t("ov.share")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("ov.viewsToday")} value={ov.viewsToday.toLocaleString(fa ? "fa-IR" : "en-US")} icon={<Eye className="h-4 w-4" />} />
        <StatCard label={t("ov.viewsWeek")} value={ov.viewsWeek.toLocaleString(fa ? "fa-IR" : "en-US")} icon={<BarChart3 className="h-4 w-4" />} accent="sky" />
        <StatCard label={t("ov.qrScans")} value={ov.qrScans.toLocaleString(fa ? "fa-IR" : "en-US")} icon={<ScanLine className="h-4 w-4" />} accent="amber" sub="7 days" />
        <StatCard label={t("ov.topItem")} value={<span className="truncate text-base">{ov.topItem || "—"}</span>} icon={<Trophy className="h-4 w-4" />} accent="rose" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-4 shadow-sm lg:col-span-2">
          <p className="mb-3 font-bold">{t("ov.weekly")}</p>
          <BarChart data={week} />
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="mb-3 font-bold">{t("ov.langSplit")}</p>
          <div className="flex items-center gap-4">
            <Donut fa={ov.langSplit.fa} en={ov.langSplit.en} />
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 font-bold"><span className="h-3 w-3 rounded-sm bg-teal-600" /> فارسی <span className="font-black" dir="ltr">{ov.langSplit.fa}%</span></p>
              <p className="flex items-center gap-2 font-bold"><span className="h-3 w-3 rounded-sm bg-amber-400" /> English <span className="font-black" dir="ltr">{ov.langSplit.en}%</span></p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="mb-3 font-bold">{t("ov.guide")} <span className="text-xs font-semibold text-muted-foreground" dir="ltr">({doneCount}/5)</span></p>
          <ul className="space-y-2.5">
            {checklist.map((c) => (
              <li key={c.label} className={cn("flex items-center gap-2.5 text-sm font-medium", c.done ? "text-stone-400 line-through" : "")}>
                {c.done ? <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-500" /> : <Circle className="h-4.5 w-4.5 shrink-0 text-stone-300" />}
                {c.label}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="mb-3 font-bold">{t("ov.topItems")}</p>
          {data.topItems.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("ov.noData")}</p>
          ) : (
            <div className="space-y-2.5">
              {data.topItems.slice(0, 5).map((i, idx) => (
                <HBar key={i.name} label={i.name} value={i.count} max={data.topItems[0].count} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Donut({ fa, en }: { fa: number; en: number }) {
  const size = 92;
  const faPct = Math.min(fa / Math.max(fa + en, 1) * 100, 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} dir="ltr">
      <div
        className="h-full w-full rounded-full"
        style={{ background: `conic-gradient(#0F766E 0% ${faPct}%, #FBBF24 ${faPct}% 100%)` }}
        role="img"
        aria-label={`Persian ${fa}%, English ${en}%`}
      />
      <div className="absolute inset-[10px] flex items-center justify-center rounded-full bg-card">
        <span className="text-xs font-black" dir="ltr">{fa + en > 0 ? "100%" : "—"}</span>
      </div>
    </div>
  );
}
