"use client";

import * as React from "react";
import { useApp, navigate, api } from "./store";
import { Logo, Spinner } from "./ui-bits";
import { makeT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, Languages } from "lucide-react";

export default function AuthView({ mode }: { mode: "login" | "register" }) {
  const { setSession, refresh } = useApp();
  const t = makeT(mode === "login" ? "en" : "en"); // auth screens in EN with FA hint; keep simple
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const fillDemo = () => {
    setEmail("demo@menuhub.app");
    setPassword("demo1234");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "register") {
        await api("/api/auth/register", { method: "POST", json: { email, password, name } });
      }
      const data = await api<{ user: import("./store").SessionUser; tenants?: import("./store").TenantSummary[] }>("/api/auth/login", {
        method: "POST",
        json: { email, password },
      });
      const me = await fetch("/api/auth/me", { cache: "no-store" }).then((r) => r.json());
      setSession(me.user, me.tenants || []);
      toast.success(mode === "login" ? `Welcome back, ${data.user.name}!` : "Account created 🎉");
      if ((me.tenants || []).length === 0) navigate("#/onboarding");
      else navigate("#/dashboard/overview");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
      setBusy(false);
    }
    void refresh;
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FDFBF7] p-4 font-vazir" dir="ltr">
      <div className="pointer-events-none absolute -start-24 -top-24 h-72 w-72 rounded-full bg-teal-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -end-24 h-72 w-72 rounded-full bg-amber-400/15 blur-3xl" />

      <Card className="w-full max-w-md border-stone-200/80 shadow-xl shadow-stone-200/50">
        <CardHeader className="items-center text-center">
          <button onClick={() => navigate("#/")} aria-label="Home"><Logo size={38} /></button>
          <CardTitle className="mt-2 text-xl">{mode === "login" ? t("auth.login.title") : t("auth.register.title")}</CardTitle>
          <CardDescription>{mode === "login" ? t("auth.login.sub") : t("auth.register.sub")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">{t("auth.name")}</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Sara Ahmadi" autoComplete="name" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@restaurant.com" autoComplete="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input id="password" type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" autoComplete={mode === "login" ? "current-password" : "new-password"} />
            </div>
            <Button type="submit" className="w-full bg-teal-700 font-bold hover:bg-teal-800" disabled={busy}>
              {busy ? <Spinner className="py-0" /> : mode === "login" ? t("auth.login") : t("auth.register")}
            </Button>
          </form>

          {mode === "login" && (
            <Button variant="outline" className="mt-3 w-full gap-2 border-dashed" onClick={fillDemo} type="button">
              <Sparkles className="h-4 w-4 text-amber-500" />
              {t("auth.demoFill")} — demo@menuhub.app
            </Button>
          )}

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "login" ? t("auth.noAccount") : t("auth.hasAccount")}{" "}
            <button className="font-bold text-teal-700 underline-offset-4 hover:underline" onClick={() => navigate(mode === "login" ? "#/register" : "#/login")}>
              {mode === "login" ? t("auth.register") : t("auth.login")}
            </button>
          </p>

          <div className="mt-4 flex items-center justify-center gap-1 text-xs text-muted-foreground" dir="rtl">
            <Languages className="h-3.5 w-3.5" />
            <span>رابط کاربری فارسی در داشبورد فعال است</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
