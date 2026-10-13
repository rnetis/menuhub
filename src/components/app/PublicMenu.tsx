"use client";

import * as React from "react";
import { api } from "./store";
import { Spinner, PriceTag, AttributeChips, ItemThumb } from "./ui-bits";
import { makeT, type Locale } from "@/lib/i18n";
import { themeOf, RADIUS_MAP } from "@/lib/menu-themes";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { matchesSearch } from "@/lib/search";
import { Clock, MapPin, Phone, Search, Share2, Star, X, Globe } from "lucide-react";

interface PubItem {
  id: string; categoryId: string; nameFa: string; nameEn: string; descFa?: string | null; descEn?: string | null;
  imageUrl?: string | null; basePrice: number; compareAtPrice?: number | null; currency: string;
  status: "AVAILABLE" | "UNAVAILABLE" | "HIDDEN"; featured: boolean;
  attributes: Record<string, boolean>; tags: string[];
  variants: { id: string; nameFa: string; nameEn: string; price: number }[];
  addOns: { id: string; nameFa: string; nameEn: string; price: number; isRequired: boolean }[];
}
interface PubCategory { id: string; nameFa: string; nameEn: string; icon: string; }
interface PubBranch { id: string; name: string; nameEn?: string | null; address?: string | null; phone?: string | null; open: boolean; hoursText: string; }
interface PubPayload {
  restaurant: {
    name: string; slug: string; taglineFa?: string | null; taglineEn?: string | null; logoUrl?: string | null; coverUrl?: string | null;
    phone?: string | null; address?: string | null; defaultLanguage: string; currency: string; showPrices: boolean;
    showPlatformBrand: boolean; primaryColor: string; secondaryColor: string; theme: string; radius: string;
  };
  categories: PubCategory[]; items: PubItem[]; branches: PubBranch[];
}

export default function PublicMenu({ slug, srcParam }: { slug: string; srcParam?: string }) {
  const [data, setData] = React.useState<PubPayload | null>(null);
  const [notFound, setNotFound] = React.useState(false);
  const [locale, setLocale] = React.useState<Locale | null>(null);
  const [activeCat, setActiveCat] = React.useState<string>("all");
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<PubItem | null>(null);
  const [loading, setLoading] = React.useState(true);

  // initial load
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await api<PubPayload>(`/api/public/menus/${encodeURIComponent(slug)}${srcParam ? `?src=${srcParam}` : ""}`);
        if (cancelled) return;
        setData(d);
        const initial: Locale = (new URLSearchParams(window.location.hash.split("?")[1] || "").get("lang") as Locale) ||
          (d.restaurant.defaultLanguage === "en" ? "en" : "fa");
        setLocale(initial);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug, srcParam]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#FAF7F1]"><Spinner /></div>;
  }

  if (notFound || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#FAF7F1] p-6 text-center font-vazir" dir="rtl">
        <span className="text-5xl">🍽️</span>
        <h1 className="text-xl font-black text-stone-800">منو پیدا نشد</h1>
        <p className="text-sm text-stone-500">Menu not found — the link may be wrong or the restaurant is unavailable.</p>
      </div>
    );
  }

  return (
    <MenuBody
      data={data}
      initialLocale={locale || "fa"}
      query={query}
      setQuery={setQuery}
      activeCat={activeCat}
      setActiveCat={setActiveCat}
      selected={selected}
      setSelected={setSelected}
      onLocaleChange={(l) => {
        setLocale(l);
        api("/api/public/track", { method: "POST", json: { slug, type: "LANGUAGE_SWITCH", locale: l } }).catch(() => {});
      }}
      locale={locale || "fa"}
    />
  );
}

function MenuBody({
  data, initialLocale, query, setQuery, activeCat, setActiveCat, selected, setSelected, onLocaleChange, locale,
}: {
  data: PubPayload; initialLocale: Locale; query: string; setQuery: (s: string) => void;
  activeCat: string; setActiveCat: (s: string) => void; selected: PubItem | null; setSelected: (i: PubItem | null) => void;
  onLocaleChange: (l: Locale) => void; locale: Locale;
}) {
  const t = makeT(locale);
  const fa = locale === "fa";
  const r = data.restaurant;
  const theme = themeOf(r.theme);
  const radius = RADIUS_MAP[r.radius] ?? RADIUS_MAP.md;

  const nameOf = (i: { nameFa: string; nameEn: string }) => (fa ? i.nameFa || i.nameEn : i.nameEn || i.nameFa);
  const descOf = (i: { descFa?: string | null; descEn?: string | null }) => (fa ? i.descFa || i.descEn : i.descEn || i.descFa);

  // language fallback per PRD §10 (handled via nameOf/descOf — missing EN falls back to FA and vice versa)

  const featured = data.items.filter((i) => i.featured && i.status === "AVAILABLE");
  const visibleItems = data.items.filter((i) => {
    if (activeCat === "featured") return i.featured;
    if (activeCat !== "all" && i.categoryId !== activeCat) return false;
    return true;
  }).filter((i) => matchesSearch([i.nameFa, i.nameEn, i.descFa, i.descEn, i.tags.join(",")], query));

  const anyOpen = data.branches.some((b) => b.open);
  const catName = (c: PubCategory) => (fa ? c.nameFa : c.nameEn);

  const trackItem = (item: PubItem) => {
    setSelected(item);
    api("/api/public/track", {
      method: "POST",
      json: { slug: r.slug, type: "ITEM_VIEW", locale, itemId: item.id, itemName: fa ? item.nameFa : item.nameEn, category: data.categories.find((c) => c.id === item.categoryId)?.nameEn },
    }).catch(() => {});
  };

  const share = async () => {
    const url = window.location.href.split("?")[0];
    api("/api/public/track", { method: "POST", json: { slug: r.slug, type: "SHARE", locale } }).catch(() => {});
    if (navigator.share) {
      try { await navigator.share({ title: r.name, url }); } catch { /* dismissed */ }
    } else {
      navigator.clipboard?.writeText(url).catch(() => {});
    }
  };

  return (
    <div
      dir={fa ? "rtl" : "ltr"}
      className="menu-fade min-h-screen font-vazir"
      style={{ background: theme.bg, color: theme.text, ["--pm-accent" as string]: r.primaryColor, ["--pm-accent2" as string]: r.secondaryColor, ["--pm-radius" as string]: radius }}
      lang={fa ? "fa" : "en"}
    >
      {/* Cover header */}
      <header className="relative">
        <div className="relative h-44 overflow-hidden sm:h-56" style={{ background: `linear-gradient(135deg, ${r.primaryColor}, ${shade(r.primaryColor, -30)})` }}>
          {r.coverUrl && (
             
            <img src={r.coverUrl} alt="" className="h-full w-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
          )}
          <div className="absolute inset-0" style={{ background: theme.headerOverlay }} />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
            <div className="flex items-center gap-1.5 rounded-full bg-black/35 px-3 py-1.5 backdrop-blur">
              <Globe className="h-3.5 w-3.5 text-white/80" />
              <div className="flex gap-1" role="group" aria-label="Language">
                {(["fa", "en"] as Locale[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => onLocaleChange(l)}
                    className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold transition", locale === l ? "bg-white text-stone-900 shadow" : "text-white/75 hover:text-white")}
                  >
                    {l === "fa" ? "فارسی" : "EN"}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={share}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/50"
              aria-label={t("pm.share")}
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mx-auto -mt-12 max-w-3xl px-4">
          <div className="rounded-2xl border p-4 shadow-lg" style={{ background: theme.surface, borderColor: theme.border, borderRadius: radius }}>
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl text-3xl shadow-inner" style={{ background: `linear-gradient(135deg, ${r.primaryColor}22, ${r.secondaryColor}33)`, borderRadius: `calc(${radius} - 4px)` }}>
                {r.logoUrl ? (
                   
                  <img src={r.logoUrl} alt={r.name} className="h-full w-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
                ) : (
                  "🍽️"
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-xl font-black sm:text-2xl">{r.name}</h1>
                <p className="truncate text-sm" style={{ color: theme.muted }}>{fa ? r.taglineFa || r.taglineEn : r.taglineEn || r.taglineFa}</p>
              </div>
              <span
                className={cn("flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold")}
                style={{
                  background: anyOpen ? "#27AE6022" : "#E74C3C22",
                  color: anyOpen ? "#27AE60" : "#E74C3C",
                }}
              >
                <span className={cn("h-2 w-2 rounded-full", anyOpen ? "bg-emerald-500" : "bg-red-500")} />
                {anyOpen ? t("pm.open") : t("pm.closed")}
              </span>
            </div>
            {(r.address || r.phone) && (
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: theme.muted }}>
                {r.address && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{r.address}</span>}
                {r.phone && <span className="inline-flex items-center gap-1" dir="ltr"><Phone className="h-3.5 w-3.5" />{r.phone}</span>}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="mx-auto max-w-3xl px-4 pt-4">
        <div className="relative">
          <Search className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: theme.muted }} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("pm.search")}
            className="h-11 border ps-10 text-base shadow-sm"
            style={{ borderColor: theme.border, borderRadius: radius, background: theme.chipBg, color: theme.text }}
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-black/5" aria-label="Clear">
              <X className="h-4 w-4" style={{ color: theme.muted }} />
            </button>
          )}
        </div>
      </div>

      {/* Category chips */}
      <nav className="sticky top-0 z-30 mt-3 border-b shadow-sm backdrop-blur" style={{ background: `${theme.surface}E6`, borderColor: theme.border }} aria-label="Categories">
        <div className="nice-scroll mx-auto flex max-w-3xl gap-2 overflow-x-auto px-4 py-2.5">
          <Chip active={activeCat === "all"} onClick={() => setActiveCat("all")} theme={theme} radius={radius} accent={r.primaryColor} activeText={theme.chipActiveText}>
            ✨ {t("pm.all")}
          </Chip>
          {featured.length > 0 && (
            <Chip active={activeCat === "featured"} onClick={() => setActiveCat("featured")} theme={theme} radius={radius} accent={r.primaryColor} activeText={theme.chipActiveText}>
              <Star className="h-3.5 w-3.5 fill-current" /> {t("pm.featured")}
            </Chip>
          )}
          {data.categories.map((c) => (
            <Chip key={c.id} active={activeCat === c.id} onClick={() => setActiveCat(c.id)} theme={theme} radius={radius} accent={r.primaryColor} activeText={theme.chipActiveText}>
              <span aria-hidden>{c.icon}</span> {catName(c)}
            </Chip>
          ))}
        </div>
      </nav>

      {/* Items */}
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-4">
        {query && <p className="mb-3 text-sm" style={{ color: theme.muted }}>{visibleItems.length} {fa ? "نتیجه" : "results"}</p>}

        {visibleItems.length === 0 ? (
          <div className="py-16 text-center">
            <span className="text-4xl" aria-hidden>🔍</span>
            <p className="mt-3 font-bold">{t("pm.noResults")}</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {visibleItems.map((item) => {
              const unavailable = item.status === "UNAVAILABLE";
              const minPrice = item.variants.length > 0 ? Math.min(item.basePrice, ...item.variants.map((v) => v.price)) : item.basePrice;
              const maxPrice = item.variants.length > 0 ? Math.max(item.basePrice, ...item.variants.map((v) => v.price)) : item.basePrice;
              return (
                <button
                  key={item.id}
                  onClick={() => trackItem(item)}
                  className="group flex gap-3 border p-3 text-start shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-default disabled:opacity-60 disabled:hover:translate-y-0"
                  style={{ background: theme.surface, borderColor: theme.border, borderRadius: radius }}
                  disabled={false}
                >
                  <ItemThumb url={item.imageUrl} fallback="🍽️" name={nameOf(item)} className="h-24 w-24 shrink-0 sm:h-20 sm:w-20" rounded={radius} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start gap-2">
                      <h3 className="min-w-0 flex-1 font-extrabold leading-snug">{nameOf(item)}</h3>
                      {item.featured && (
                        <Badge className="shrink-0 border-0 bg-amber-400/90 text-[10px] font-black text-stone-900 hover:bg-amber-400">
                          <Star className="me-0.5 h-3 w-3 fill-current" />{t("pm.featured")}
                        </Badge>
                      )}
                    </div>
                    {descOf(item) && <p className="clamp-2 mt-0.5 text-xs leading-relaxed" style={{ color: theme.muted }}>{descOf(item)}</p>}
                    <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                      {r.showPrices && (
                        <div className="flex flex-wrap items-baseline gap-1.5">
                          {item.compareAtPrice && (
                            <PriceTag amount={item.compareAtPrice} currency={item.currency} locale={locale} strike className="text-xs" />
                          )}
                          <PriceTag
                            amount={minPrice}
                            currency={item.currency}
                            locale={locale}
                            className="text-base"
                          />
                          {maxPrice > minPrice && (
                            <span className="text-xs font-medium" style={{ color: theme.muted }} dir="ltr">
                              – {new Intl.NumberFormat(fa ? "fa-IR" : "en-US", { maximumFractionDigits: 2 }).format(maxPrice)}
                            </span>
                          )}
                        </div>
                      )}
                      {unavailable && (
                        <Badge variant="outline" className="shrink-0 border-red-200 bg-red-50 text-[10px] font-bold text-red-600">{t("pm.unavailable")}</Badge>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Branches / hours */}
        {data.branches.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 font-black">{fa ? "شعبه‌ها و ساعات کاری" : "Branches & hours"}</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {data.branches.map((b) => (
                <div key={b.id} className="flex items-center gap-3 border p-3" style={{ background: theme.surface, borderColor: theme.border, borderRadius: radius }}>
                  <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", b.open ? "bg-emerald-500" : "bg-red-400")} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{fa ? b.name : b.nameEn || b.name}</p>
                    <p className="flex items-center gap-1 text-xs" style={{ color: theme.muted }} dir="ltr">
                      <Clock className="h-3 w-3" />{b.hoursText}
                    </p>
                  </div>
                  <span className="text-xs font-bold" style={{ color: b.open ? "#27AE60" : "#E74C3C" }}>{b.open ? t("pm.open") : t("pm.closed")}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-12 border-t pt-6 text-center text-xs" style={{ borderColor: theme.border, color: theme.muted }}>
          {r.showPlatformBrand && (
            <p className="mb-2">
              <a href="#/" className="font-bold" style={{ color: r.primaryColor }}>
                {t("pm.poweredBy")} MenuHub
              </a>
            </p>
          )}
          <p>© {new Date().getFullYear()} {r.name}</p>
        </footer>
      </main>

      {/* Item detail drawer */}
      <Drawer open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DrawerContent className="mx-auto max-w-lg" style={{ background: theme.surface }} dir={fa ? "rtl" : "ltr"}>
          {selected && (
            <div className="max-h-[82vh] overflow-y-auto nice-scroll px-4 pb-8">
              <DrawerHeader className="p-0 pb-2">
                <DrawerItemCover item={selected} radius={radius} />
                <DrawerTitle className="pt-3 text-xl font-black">{nameOf(selected)}</DrawerTitle>
              </DrawerHeader>
              {descOf(selected) && <p className="px-0 pb-3 text-sm leading-relaxed" style={{ color: theme.muted }}>{descOf(selected)}</p>}
              <AttributeChips attributes={selected.attributes} locale={locale} />

              {r.showPrices && (
                <div className="mt-4 space-y-2">
                  {selected.variants.length > 0 ? (
                    <>
                      <p className="text-sm font-black">{t("pm.variants")}</p>
                      {selected.variants.map((v) => (
                        <div key={v.id} className="flex items-center justify-between border p-3 text-sm" style={{ borderColor: theme.border, borderRadius: radius }}>
                          <span className="font-bold">{fa ? v.nameFa : v.nameEn}</span>
                          <PriceTag amount={v.price} currency={selected.currency} locale={locale} style={{ color: r.primaryColor }} />
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="flex items-center justify-between border p-3" style={{ borderColor: theme.border, borderRadius: radius }}>
                      <span className="text-sm font-bold">{fa ? "قیمت" : "Price"}</span>
                      <PriceTag amount={selected.basePrice} currency={selected.currency} locale={locale} className="text-lg" />
                    </div>
                  )}
                </div>
              )}

              {selected.addOns.length > 0 && (
                <>
                  <Separator className="my-4" style={{ background: theme.border }} />
                  <p className="mb-2 text-sm font-black">{t("pm.addons")}</p>
                  <div className="space-y-1.5">
                    {selected.addOns.map((a) => (
                      <div key={a.id} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          {fa ? a.nameFa : a.nameEn}
                          {a.isRequired && <Badge variant="outline" className="h-4 border-0 bg-red-100 px-1.5 text-[9px] font-bold text-red-600">{fa ? "الزامی" : "required"}</Badge>}
                        </span>
                        <span className="font-semibold" style={{ color: r.primaryColor }} dir="ltr">+<PriceTag amount={a.price} currency={selected.currency} locale={locale} className="text-xs font-bold" /></span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function Chip({ active, onClick, children, theme, radius, accent, activeText }: {
  active: boolean; onClick: () => void; children: React.ReactNode; theme: ReturnType<typeof themeOf>; radius: string; accent: string; activeText: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn("flex shrink-0 items-center gap-1.5 whitespace-nowrap border px-3.5 py-2 text-sm font-bold transition")}
      style={{
        borderRadius: `calc(${radius} + 999px)`,
        background: active ? accent : theme.chipBg,
        color: active ? activeText : theme.text,
        borderColor: active ? accent : theme.border,
      }}
    >
      {children}
    </button>
  );
}

function DrawerItemCover({ item, radius }: { item: PubItem; radius: string }) {
  const [err, setErr] = React.useState(false);
  return (
    <div className="relative -mx-4 -mt-2 h-44 overflow-hidden bg-gradient-to-br from-teal-50 via-amber-50 to-orange-100" style={{ borderRadius: `calc(${radius} + 2px) calc(${radius} + 2px) 0 0` }}>
      {item.imageUrl && !err ? (
         
        <img src={item.imageUrl} alt="" className="h-full w-full object-cover" onError={() => setErr(true)} />
      ) : (
        <div className="flex h-full items-center justify-center text-6xl" aria-hidden>🍽️</div>
      )}
    </div>
  );
}

function shade(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(Math.max((num >> 16) + amt, 0), 255);
  const G = Math.min(Math.max(((num >> 8) & 0xff) + amt, 0), 255);
  const B = Math.min(Math.max((num & 0xff) + amt, 0), 255);
  return `#${((R << 16) | (G << 8) | B).toString(16).padStart(6, "0")}`;
}
