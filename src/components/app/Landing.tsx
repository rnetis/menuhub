"use client";

import * as React from "react";
import { useApp, navigate } from "./store";
import { Logo } from "./ui-bits";
import { makeT, type Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Languages, Zap, Palette, BarChart3, Store, ArrowLeft, ArrowRight, Check } from "lucide-react";

const PHONE_ITEMS: { emoji: string; fa: string; en: string; price: string; tag?: string }[] = [
  { emoji: "🍔", fa: "چیزبرگر", en: "Cheeseburger", price: "€12.50", tag: "پرطرفدار" },
  { emoji: "🍕", fa: "پیتزا مارگاریتا", en: "Margherita Pizza", price: "€9.50" },
  { emoji: "🥤", fa: "آب‌پرتقال طبیعی", en: "Fresh Orange Juice", price: "€4.00" },
  { emoji: "🍰", fa: "چیزکیک", en: "NY Cheesecake", price: "€5.50" },
];

export default function Landing() {
  const { user } = useApp();
  const [locale, setLocale] = React.useState<Locale>("fa");
  const t = makeT(locale);
  const fa = locale === "fa";
  const Arrow = fa ? ArrowLeft : ArrowRight;

  React.useEffect(() => {
    const nav = navigator.language.toLowerCase();
    setLocale(nav.startsWith("fa") ? "fa" : "fa"); // default fa (target market), toggle available
  }, []);

  return (
    <div dir={fa ? "rtl" : "ltr"} className="flex min-h-screen flex-col bg-[#FDFBF7] font-vazir">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-stone-200/60 bg-[#FDFBF7]/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-2">
            <Button
              variant="ghost" size="sm" onClick={() => setLocale(fa ? "en" : "fa")}
              className="gap-1.5 font-semibold"
              aria-label="Switch language"
            >
              <Languages className="h-4 w-4" />
              {fa ? "English" : "فارسی"}
            </Button>
            <Button variant="ghost" size="sm" className="hidden font-semibold sm:inline-flex" onClick={() => navigate("#/login")}>
              {t("auth.login")}
            </Button>
            <Button size="sm" className="font-bold" onClick={() => navigate(user ? "#/dashboard/overview" : "#/register")}>
              {user ? t("nav.overview") : t("landing.cta")}
            </Button>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="hero-mesh relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-24">
            <div className="menu-fade">
              <Badge variant="outline" className="mb-4 gap-1.5 border-teal-600/30 bg-teal-600/5 px-3 py-1.5 text-teal-800">
                <QrCode className="h-3.5 w-3.5" /> {t("landing.badge")}
              </Badge>
              <h1 className="text-4xl font-black leading-[1.15] tracking-tight text-stone-900 sm:text-5xl lg:text-[3.4rem]">
                {t("landing.h1a")}{" "}
                <span className="relative inline-block text-teal-700">
                  {t("landing.h1b")}
                  <svg className="absolute -bottom-2 start-0 w-full text-amber-400" viewBox="0 0 220 12" fill="none" aria-hidden>
                    <path d="M3 9C60 3 160 3 217 8" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone-600">{t("landing.sub")}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button size="lg" className="h-12 gap-2 bg-teal-700 px-7 text-base font-bold shadow-lg shadow-teal-700/25 hover:bg-teal-800" onClick={() => navigate("#/register")}>
                  {t("landing.cta")}
                  <Arrow className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="h-12 gap-2 border-stone-300 bg-white/70 px-6 text-base font-semibold" onClick={() => navigate("#/m/cafe-nova?src=demo")}>
                  <QrCode className="h-4 w-4 text-teal-700" />
                  {t("landing.cta2")}
                </Button>
              </div>
              <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-stone-500">
                {[t("landing.trust1"), t("landing.trust2"), t("landing.trust3")].map((x) => (
                  <li key={x} className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-teal-600" /> {x}
                  </li>
                ))}
              </ul>
            </div>

            {/* Phone mockup */}
            <div className="relative mx-auto hidden w-fit sm:block" aria-hidden>
              <div className="floaty phone-frame w-[290px] overflow-hidden rounded-[2.2rem] bg-white">
                <div className="relative h-36 bg-gradient-to-br from-teal-700 via-teal-600 to-teal-800 p-4 pt-6">
                  <div className="absolute inset-0 dot-grid opacity-20" />
                  <div className="relative flex items-center gap-2.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl shadow">☕</div>
                    <div>
                      <p className="text-sm font-extrabold text-white">Cafe Nova</p>
                      <p className="text-[10px] text-teal-100">Fresh coffee · homemade food</p>
                    </div>
                    <span className="ms-auto rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-black text-stone-900" dir="ltr">FA | EN</span>
                  </div>
                </div>
                <div className="flex gap-1.5 overflow-hidden border-b bg-stone-50 px-3 py-2 text-[10px] font-bold text-stone-500">
                  <span className="rounded-full bg-teal-700 px-2.5 py-1 text-white">{fa ? "همه" : "All"}</span>
                  <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-stone-200">🍔 {fa ? "برگر" : "Burgers"}</span>
                  <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-stone-200">🍕 {fa ? "پیتزا" : "Pizza"}</span>
                  <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-stone-200">🍰 {fa ? "دسر" : "Desserts"}</span>
                </div>
                <div className="space-y-2 p-3">
                  {PHONE_ITEMS.map((it, i) => (
                    <div key={i} className="flex items-center gap-2.5 rounded-xl border border-stone-100 bg-white p-2 shadow-sm">
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-amber-50 to-teal-50 text-xl">{it.emoji}</div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-stone-800" dir="auto">{fa ? it.fa : it.en}</p>
                        <p className="text-[10px] font-extrabold text-teal-700" dir="ltr">{it.price}</p>
                      </div>
                      {it.tag && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[8px] font-bold text-amber-800">{it.tag}</span>}
                    </div>
                  ))}
                </div>
              </div>
              {/* floating QR chip */}
              <div className="absolute -bottom-5 -start-8 rounded-2xl border border-stone-200 bg-white p-3 shadow-xl">
                <QrCode className="h-9 w-9 text-stone-800" />
                <p className="mt-1 text-center text-[9px] font-bold text-stone-500" dir="ltr">SCAN → MENU</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Languages, title: t("landing.f1.t"), desc: t("landing.f1.d"), c: "text-teal-700 bg-teal-600/10" },
              { icon: QrCode, title: t("landing.f2.t"), desc: t("landing.f2.d"), c: "text-amber-600 bg-amber-500/10" },
              { icon: Zap, title: t("landing.f3.t"), desc: t("landing.f3.d"), c: "text-rose-600 bg-rose-500/10" },
              { icon: Palette, title: t("landing.f4.t"), desc: t("landing.f4.d"), c: "text-violet-600 bg-violet-500/10" },
              { icon: BarChart3, title: t("landing.f5.t"), desc: t("landing.f5.d"), c: "text-sky-600 bg-sky-500/10" },
              { icon: Store, title: t("landing.f6.t"), desc: t("landing.f6.d"), c: "text-emerald-600 bg-emerald-500/10" },
            ].map((f, i) => (
              <div key={i} className="group rounded-2xl border border-stone-200/70 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <span className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl ${f.c}`}>
                  <f.icon className="h-5.5 w-5.5" />
                </span>
                <h3 className="font-extrabold text-stone-900">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Demo band */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-teal-800 via-teal-700 to-teal-900 p-6 shadow-xl sm:p-10">
            <div className="grid items-center gap-8 lg:grid-cols-2">
              <div>
                <h2 className="text-2xl font-black text-white sm:text-3xl">{t("landing.demo.t")}</h2>
                <p className="mt-3 max-w-lg leading-relaxed text-teal-100">{t("landing.demo.d")}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button size="lg" className="bg-amber-400 font-bold text-stone-900 hover:bg-amber-300" onClick={() => navigate("#/m/cafe-nova?src=demo")}>
                    {t("landing.demo.btn")}
                  </Button>
                </div>
              </div>
              <div className="rounded-2xl border border-teal-600/40 bg-teal-900/40 p-5 backdrop-blur">
                <p className="font-extrabold text-white">{t("landing.demo.owner")}</p>
                <p className="mt-1 text-sm text-teal-200">{t("landing.demo.owner.d")}</p>
                <div className="mt-4 flex items-center gap-2" dir="ltr">
                  <code className="rounded-lg bg-teal-950/60 px-3 py-2 text-sm font-bold text-amber-300">demo@menuhub.app</code>
                  <code className="rounded-lg bg-teal-950/60 px-3 py-2 text-sm font-bold text-amber-300">demo1234</code>
                  <Button size="sm" variant="secondary" className="ms-auto" onClick={() => navigate("#/login")}>
                    {t("auth.login")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t border-stone-200/70 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-stone-500 sm:flex-row sm:px-6">
          <Logo size={26} />
          <p>{t("landing.footer")}</p>
        </div>
      </footer>
    </div>
  );
}
