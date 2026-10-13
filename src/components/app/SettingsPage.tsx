"use client";

import * as React from "react";
import { api, navigate } from "./store";
import { makeT, CURRENCIES } from "@/lib/i18n";
import type { TenantSummary } from "./store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

interface FullTenant {
  id: string; name: string; slug: string; currency: string; defaultLanguage: string; fallbackLanguage: string;
  phone?: string | null; address?: string | null; showPrices: boolean;
}

export default function SettingsPage({ tenant, locale, onTenantChange }: { tenant: TenantSummary; role: string; locale: "fa" | "en"; onTenantChange: () => Promise<void> }) {
  const t = makeT(locale);
  const fa = locale === "fa";
  const [form, setForm] = React.useState<Partial<FullTenant>>({});
  const [busy, setBusy] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  React.useEffect(() => {
    api<{ tenant: FullTenant }>(`/api/tenants/${tenant.id}`).then((d) => setForm(d.tenant)).catch(() => toast.error("Failed to load"));
  }, [tenant.id]);

  const set = <K extends keyof FullTenant>(k: K, v: FullTenant[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setBusy(true);
    try {
      await api(`/api/tenants/${tenant.id}`, { method: "PATCH", json: form });
      toast.success(t("st.saved"));
      await onTenantChange();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const deleteTenant = async () => {
    try {
      await api(`/api/tenants/${tenant.id}`, { method: "DELETE" });
      toast.success(fa ? "حذف شد" : "Deleted");
      await onTenantChange();
      navigate("#/");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  return (
    <div className="max-w-2xl space-y-5" dir={fa ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">{t("st.title")}</h1>
        <Button onClick={save} disabled={busy} className="bg-teal-700 font-bold hover:bg-teal-800">{busy ? "…" : t("menu.save")}</Button>
      </div>

      <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t("st.name")}</Label>
            <Input value={form.name || ""} onChange={(e) => set("name", e.target.value)} dir="auto" />
          </div>
          <div className="space-y-1.5">
            <Label>{t("st.slug")}</Label>
            <div dir="ltr" className="flex items-center overflow-hidden rounded-md border">
              <span className="border-e bg-muted px-2.5 py-2 text-xs text-muted-foreground">/m/</span>
              <input value={form.slug || ""} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} className="w-full px-2.5 py-2 text-sm outline-none" />
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>{t("st.currency")}</Label>
            <Select value={form.currency || "EUR"} onValueChange={(v) => set("currency", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CURRENCIES).map(([code, c]) => (
                  <SelectItem key={code} value={code}>{code} — {fa ? c.nameFa : c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("st.defaultLang")}</Label>
            <Select value={form.defaultLanguage || "fa"} onValueChange={(v) => set("defaultLanguage", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fa">فارسی</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("st.fallback")}</Label>
            <Select value={form.fallbackLanguage || "fa"} onValueChange={(v) => set("fallbackLanguage", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fa">فارسی</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t("st.phone")}</Label>
            <Input dir="ltr" value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} placeholder="+98 21 …" />
          </div>
          <div className="space-y-1.5">
            <Label>{t("st.address")}</Label>
            <Input value={form.address || ""} onChange={(e) => set("address", e.target.value)} dir="auto" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <Label htmlFor="showPrices" className="cursor-pointer">{t("st.showPrices")}</Label>
          <Switch id="showPrices" checked={form.showPrices ?? true} onCheckedChange={(v) => set("showPrices", v)} />
        </div>
      </div>

      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5">
        <p className="flex items-center gap-1.5 font-black text-red-700"><AlertTriangle className="h-4 w-4" />{t("st.danger")}</p>
        <p className="mb-3 mt-1 text-sm text-red-600/90">{t("st.deleteWarn")}</p>
        <Button variant="destructive" onClick={() => setConfirmDelete(true)}>{t("st.deleteTenant")}</Button>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent dir={fa ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("st.deleteTenant")}؟</AlertDialogTitle>
            <AlertDialogDescription>{t("st.deleteWarn")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("menu.cancel")}</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={deleteTenant}>{t("menu.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
