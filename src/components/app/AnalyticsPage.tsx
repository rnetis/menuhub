"use client";

import * as React from "react";
import { api } from "./store";
import { Spinner, StatCard, BarChart, HBar, EmptyState } from "./ui-bits";
import { makeT } from "@/lib/i18n";
import type { TenantSummary } from "./store";
import { Eye, ScanLine, Globe, Smartphone, Monitor, Tablet, QrCode as QrIcon, Link2, Share2 } from "lucide-react";

interface AnalyticsFull {
  overview: { viewsToday: number; viewsWeek: number; totalViews: number; qrScans: number; topItem: string | null; topCategory: string | null; langSplit: { fa: number; en: number } };
  byDay: { day: string; views: number }[];
  byHour: { hour: number; views: number }[];
  byLang: { key: string; count: number }[];
  byDevice: { key: string; count: number }[];
  bySource: { key: string; count: number }[];
  topItems: { name: string; count: number }[];
  topCategories: { name: string; count: number }[];
}

const DEVICE_ICON: Record<string, React.ReactNode> = { mobile: <Smartphone className="h-3.5 w-3.5" />, desktop: <Monitor className="h-3.5 w-3.5" />, tablet: <Tablet className="h-3.5 w-3.5" /> };
const SOURCE_ICON: Record<string, React.ReactNode> = { qr: <QrIcon className="h-3.5 w-3.5" />, direct: <Link2 className="h-3.5 w-3.5" />, social: <Share2 className="h-3.5 w-3.5" /> };

export default function AnalyticsPage({ tenant, locale }: { tenant: TenantSummary; role: string; locale: "fa" | "en" }) {
  const t = makeT(locale);
  const fa = locale === "fa";
  const [data, setData] = React.useState<AnalyticsFull | null>(null);

  React.useEffect(() => {
    api<AnalyticsFull>(`/api/tenants/${tenant.id}/analytics`).then(setData).catch(() => setData(null));
  }, [tenant.id]);

  if (!data) return <Spinner />;

  const dayLabels = data.byDay.map((d) => new Date(d.day + "T00:00:00").toLocaleDateString(fa ? "fa-IR" : "en-US", { weekday: "short" }));
  const hourData = data.byHour.map((h) => ({ label: h.hour % 3 === 0 ? String(h.hour) : "", value: h.views }));
  const maxLang = Math.max(...data.byLang.map((x) => x.count), 1);
  const maxDev = Math.max(...data.byDevice.map((x) => x.count), 1);
  const maxSrc = Math.max(...data.bySource.map((x) => x.count), 1);
  const maxCat = Math.max(...data.topCategories.map((x) => x.count), 1);

  return (
    <div className="space-y-5" dir={fa ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-black">{t("an.title")}</h1>
        <p className="text-sm text-muted-foreground">{tenant.name} · {fa ? "۳۰ روز گذشته" : "last 30 days"}</p>
      </div>

      {data.overview.totalViews === 0 ? (
        <EmptyState emoji="📈" title={t("ov.noData")} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label={t("an.totalViews")} value={data.overview.totalViews.toLocaleString(fa ? "fa-IR" : "en-US")} icon={<Eye className="h-4 w-4" />} />
            <StatCard label={t("ov.viewsWeek")} value={data.overview.viewsWeek.toLocaleString(fa ? "fa-IR" : "en-US")} icon={<Eye className="h-4 w-4" />} accent="sky" />
            <StatCard label={t("an.scan")} value={data.overview.qrScans.toLocaleString(fa ? "fa-IR" : "en-US")} icon={<ScanLine className="h-4 w-4" />} accent="amber" />
            <StatCard label={t("ov.topItem")} value={<span className="truncate text-base">{data.overview.topItem || "—"}</span>} icon={<Globe className="h-4 w-4" />} accent="rose" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <p className="mb-3 font-bold">{t("an.byDay")} ({fa ? "۷ روز" : "7d"})</p>
              <BarChart data={data.byDay.map((d, i) => ({ label: dayLabels[i], value: d.views }))} />
            </div>
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <p className="mb-3 font-bold">{t("an.byHour")}</p>
              <BarChart data={hourData} />
            </div>
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <p className="mb-3 font-bold">{t("an.byLang")}</p>
              <div className="space-y-2.5">
                {data.byLang.map((l) => (
                  <HBar key={l.key} label={l.key === "fa" ? "فارسی" : "English"} value={l.count} max={maxLang} />
                ))}
              </div>
            </div>
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <p className="mb-3 font-bold">{t("an.byDevice")}</p>
              <div className="space-y-2.5">
                {data.byDevice.map((d) => (
                  <HBar key={d.key} label={<span className="inline-flex items-center gap-1.5">{DEVICE_ICON[d.key] || <Smartphone className="h-3.5 w-3.5" />}{d.key}</span>} value={d.count} max={maxDev} />
                ))}
              </div>
            </div>
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <p className="mb-3 font-bold">{t("an.bySource")}</p>
              <div className="space-y-2.5">
                {data.bySource.map((s) => (
                  <HBar key={s.key} label={<span className="inline-flex items-center gap-1.5">{SOURCE_ICON[s.key] || <Link2 className="h-3.5 w-3.5" />}{s.key}</span>} value={s.count} max={maxSrc} />
                ))}
              </div>
            </div>
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <p className="mb-3 font-bold">{t("an.topCategories")}</p>
              <div className="space-y-2.5">
                {data.topCategories.map((c) => (
                  <HBar key={c.name} label={c.name} value={c.count} max={maxCat} />
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <p className="mb-3 font-bold">{t("an.topItems")}</p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {data.topItems.map((i) => (
                <HBar key={i.name} label={i.name} value={i.count} max={data.topItems[0].count} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
