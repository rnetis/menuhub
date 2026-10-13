"use client";

import * as React from "react";
import { api } from "./store";
import { Spinner, EmptyState } from "./ui-bits";
import { makeT } from "@/lib/i18n";
import type { TenantSummary } from "./store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MapPin, Phone, Plus, Pencil, Trash2, Clock } from "lucide-react";

interface Branch {
  id: string; name: string; nameEn?: string | null; address?: string | null; phone?: string | null;
  openHour: number; openMin: number; closeHour: number; closeMin: number; isClosed: boolean;
}

const pad = (n: number) => String(n).padStart(2, "0");

function HourSel({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger className="w-20" aria-label={label}><SelectValue /></SelectTrigger>
      <SelectContent dir="ltr" className="max-h-52">
        {Array.from({ length: 24 }, (_, h) => <SelectItem key={h} value={String(h)}>{pad(h)}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export default function BranchesPage({ tenant, locale }: { tenant: TenantSummary; role: string; locale: "fa" | "en" }) {
  const t = makeT(locale);
  const fa = locale === "fa";
  const [branches, setBranches] = React.useState<Branch[] | null>(null);
  const [editing, setEditing] = React.useState<Branch | "new" | null>(null);

  const load = React.useCallback(async () => {
    try {
      const d = await api<{ branches: Branch[] }>(`/api/tenants/${tenant.id}/branches`);
      setBranches(d.branches);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
      setBranches([]);
    }
  }, [tenant.id]);

  React.useEffect(() => { load(); }, [load]);

  if (!branches) return <Spinner />;

  const isOpen = (b: Branch) => {
    if (b.isClosed) return false;
    const now = new Date();
    const m = now.getHours() * 60 + now.getMinutes();
    const start = b.openHour * 60 + b.openMin;
    const end = b.closeHour * 60 + b.closeMin;
    return end <= start ? m >= start || m < end : m >= start && m < end;
  };

  return (
    <div className="space-y-4" dir={fa ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">{t("brh.title")}</h1>
          <p className="text-sm text-muted-foreground">{branches.length}/10</p>
        </div>
        <Button size="sm" className="gap-1.5 bg-teal-700 font-bold hover:bg-teal-800" onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4" /> {t("brh.add")}
        </Button>
      </div>

      {branches.length === 0 ? (
        <EmptyState emoji="🏬" title={fa ? "شعبه‌ای ثبت نشده" : "No branches yet"} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {branches.map((b) => {
            const open = isOpen(b);
            return (
              <div key={b.id} className="rounded-2xl border bg-card p-4 shadow-sm" style={{ borderInlineStartWidth: 4, borderInlineStartColor: open ? "#27AE60" : "#E74C3C" }}>
                <div className="flex items-center gap-2">
                  <p className="flex-1 font-extrabold" dir="auto">{fa ? b.name : b.nameEn || b.name}</p>
                  <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: open ? "#27AE6022" : "#E74C3C22", color: open ? "#27AE60" : "#E74C3C" }}>
                    <span className={`h-1.5 w-1.5 rounded-full ${open ? "bg-emerald-500" : "bg-red-500"}`} />
                    {b.isClosed ? t("brh.closed") : open ? t("brh.openNow") : t("brh.closedNow")}
                  </span>
                </div>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {b.address && <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{b.address}</p>}
                  {b.phone && <p className="flex items-center gap-1.5" dir="ltr"><Phone className="h-3.5 w-3.5" />{b.phone}</p>}
                  <p className="flex items-center gap-1.5" dir="ltr"><Clock className="h-3.5 w-3.5" />{pad(b.openHour)}:{pad(b.openMin)} → {pad(b.closeHour)}:{pad(b.closeMin)}</p>
                </div>
                <div className="mt-3 flex justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(b)} aria-label={t("menu.edit")}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={async () => { await api(`/api/branches/${b.id}`, { method: "DELETE" }); toast.success("Deleted"); load(); }} aria-label={t("menu.delete")}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <BranchDialog
          tenantId={tenant.id}
          branch={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
          locale={locale}
        />
      )}
    </div>
  );
}

function BranchDialog({ tenantId, branch, onClose, onSaved, locale }: { tenantId: string; branch: Branch | null; onClose: () => void; onSaved: () => void; locale: "fa" | "en" }) {
  const t = makeT(locale);
  const fa = locale === "fa";
  const [name, setName] = React.useState(branch?.name || "");
  const [nameEn, setNameEn] = React.useState(branch?.nameEn || "");
  const [address, setAddress] = React.useState(branch?.address || "");
  const [phone, setPhone] = React.useState(branch?.phone || "");
  const [openHour, setOpenHour] = React.useState(branch?.openHour ?? 9);
  const [openMin, setOpenMin] = React.useState(branch?.openMin ?? 0);
  const [closeHour, setCloseHour] = React.useState(branch?.closeHour ?? 23);
  const [closeMin, setCloseMin] = React.useState(branch?.closeMin ?? 0);
  const [isClosed, setIsClosed] = React.useState(branch?.isClosed || false);
  const [busy, setBusy] = React.useState(false);

  const save = async () => {
    if (!name.trim()) return toast.error(fa ? "نام شعبه لازم است" : "Branch name is required");
    setBusy(true);
    try {
      const payload = { name, nameEn, address, phone, openHour, openMin, closeHour, closeMin, isClosed };
      if (branch) await api(`/api/branches/${branch.id}`, { method: "PATCH", json: payload });
      else await api(`/api/tenants/${tenantId}/branches`, { method: "POST", json: payload });
      toast.success(t("menu.save"));
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir={fa ? "rtl" : "ltr"} className="max-w-md" aria-describedby={undefined}>
        <DialogHeader><DialogTitle>{branch ? t("menu.edit") : t("brh.add")}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("brh.name")} (فا)</Label>
              <Input dir="rtl" value={name} onChange={(e) => setName(e.target.value)} placeholder="شعبه مرکزی" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("brh.name")} (EN)</Label>
              <Input dir="ltr" value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Downtown" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("st.address")}</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} dir="auto" />
          </div>
          <div className="space-y-1.5">
            <Label>{t("st.phone")}</Label>
            <Input dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+98 21 …" />
          </div>
          <div className="space-y-1.5">
            <Label>{t("brh.hours")}</Label>
            <div className="flex items-center gap-2" dir="ltr">
              <HourSel value={openHour} onChange={setOpenHour} label="open hour" />
              <HourSel value={openMin} onChange={setOpenMin} label="open minute" />
              <span className="text-muted-foreground">→</span>
              <HourSel value={closeHour} onChange={setCloseHour} label="close hour" />
              <HourSel value={closeMin} onChange={setCloseMin} label="close minute" />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor="closed" className="cursor-pointer">{t("brh.closed")}</Label>
            <Switch id="closed" checked={isClosed} onCheckedChange={setIsClosed} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose}>{t("menu.cancel")}</Button>
            <Button onClick={save} disabled={busy} className="bg-teal-700 font-bold hover:bg-teal-800">{busy ? "…" : t("menu.save")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
