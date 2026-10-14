"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatPrice, type Locale } from "@/lib/i18n";

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-16", className)} role="status" aria-label="loading">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
    </div>
  );
}

export function Logo({ size = 34, light = false }: { size?: number; light?: boolean }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <div
        className="relative flex items-center justify-center rounded-xl bg-teal-700 font-black text-amber-400 shadow-md shadow-teal-700/25"
        style={{ width: size, height: size, fontSize: size * 0.52 }}
      >
        7
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-white" />
      </div>
      <span className={cn("font-extrabold tracking-tight", light ? "text-white" : "text-stone-900")} style={{ fontSize: size * 0.55 }}>
        Menu<span className="text-teal-700">Hub</span>
      </span>
    </div>
  );
}

export function PriceTag({ amount, currency, locale, className, strike, style }: { amount: number; currency: string; locale: Locale; className?: string; strike?: boolean; style?: React.CSSProperties }) {
  return (
    <span dir="ltr" style={style} className={cn("whitespace-nowrap font-bold tabular-nums", strike && "text-muted-foreground line-through font-medium", className)}>
      {formatPrice(amount, currency, locale)}
    </span>
  );
}

const ATTR_EMOJI: Record<string, string> = {
  vegetarian: "🥗", vegan: "🌱", spicy: "🌶️", halal: "☪️",
  glutenFree: "🌾", nuts: "🥜", dairy: "🥛", egg: "🥚",
};

export function AttributeChips({ attributes, locale }: { attributes: Record<string, boolean>; locale: Locale }) {
  const active = Object.entries(attributes).filter(([, v]) => v);
  if (active.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {active.map(([key]) => (
        <span key={key} className="inline-flex items-center gap-1 rounded-full border bg-secondary/60 px-2 py-0.5 text-xs font-medium text-secondary-foreground">
          <span aria-hidden>{ATTR_EMOJI[key] || "•"}</span>
        </span>
      ))}
    </div>
  );
}

export function ItemThumb({ url, fallback, name, className, rounded = "rounded-xl" }: { url?: string | null; fallback: string; name: string; className?: string; rounded?: string }) {
  const [err, setErr] = React.useState(false);
  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-br from-teal-50 via-amber-50 to-orange-50", rounded, className)}>
      {url && !err ? (
         
        <img src={url} alt={name} loading="lazy" onError={() => setErr(true)} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center" aria-hidden>
          <span className="text-[2em] leading-none drop-shadow-sm" style={{ fontSize: "min(2.4em, 42px)" }}>{fallback}</span>
        </div>
      )}
    </div>
  );
}

export function StatCard({ label, value, sub, icon, accent = "teal" }: { label: string; value: React.ReactNode; sub?: string; icon?: React.ReactNode; accent?: "teal" | "amber" | "rose" | "sky" }) {
  const accents: Record<string, string> = {
    teal: "bg-teal-600/10 text-teal-700",
    amber: "bg-amber-500/10 text-amber-600",
    rose: "bg-rose-500/10 text-rose-600",
    sky: "bg-sky-500/10 text-sky-600",
  };
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon && <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", accents[accent])}>{icon}</span>}
      </div>
      <p className="mt-1.5 text-2xl font-extrabold tracking-tight" dir="ltr">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function BarChart({ data, max }: { data: { label: string; value: number }[]; max?: number }) {
  const maxVal = max ?? Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 pt-4" dir="ltr" style={{ height: 150 }}>
      {data.map((d, i) => {
        const barH = Math.max(Math.round((d.value / maxVal) * 100), 4);
        return (
          <div key={i} className="group flex flex-1 flex-col items-center justify-end gap-1 self-stretch">
            <span className="text-[10px] font-semibold text-muted-foreground opacity-0 transition group-hover:opacity-100">{d.value}</span>
            <div
              className="w-full max-w-10 rounded-t-md bg-gradient-to-t from-teal-600 to-teal-400 transition-all group-hover:from-teal-700 group-hover:to-teal-500"
              style={{ height: barH }}
            />
            <span className="text-[10px] text-muted-foreground">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function HBar({ label, value, max, right }: { label: React.ReactNode; value: number; max: number; right?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-sm">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-teal-600" style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }} />
      </div>
      <span className="w-12 shrink-0 text-end text-xs font-semibold tabular-nums text-muted-foreground" dir="ltr">{right ?? value}</span>
    </div>
  );
}

export function EmptyState({ emoji, title, desc, action }: { emoji: string; title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-muted/30 px-6 py-12 text-center">
      <span className="text-4xl" aria-hidden>{emoji}</span>
      <p className="font-semibold">{title}</p>
      {desc && <p className="max-w-sm text-sm text-muted-foreground">{desc}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
