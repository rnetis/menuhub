"use client";

import * as React from "react";
import { api } from "./store";
import { Spinner } from "./ui-bits";
import { makeT } from "@/lib/i18n";
import { ROLE_LABELS, type Role } from "@/lib/rbac";
import type { TenantSummary } from "./store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ShieldCheck, Trash2, Lock } from "lucide-react";

interface Member { id: string; role: string; user: { id: string; name: string; email: string } }

export default function TeamPage({ tenant, role, locale }: { tenant: TenantSummary; role: string; locale: "fa" | "en" }) {
  const t = makeT(locale);
  const fa = locale === "fa";
  const canManage = ["OWNER", "ADMIN"].includes(role);
  const [members, setMembers] = React.useState<Member[] | null>(null);
  const [maxTeam, setMaxTeam] = React.useState(1);
  const [email, setEmail] = React.useState("");
  const [newRole, setNewRole] = React.useState("EDITOR");
  const [removing, setRemoving] = React.useState<Member | null>(null);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const d = await api<{ members: Member[]; maxTeam: number }>(`/api/tenants/${tenant.id}/team`);
      setMembers(d.members);
      setMaxTeam(d.maxTeam);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
      setMembers([]);
    }
  }, [tenant.id]);

  React.useEffect(() => { load(); }, [load]);

  if (!members) return <Spinner />;

  const add = async () => {
    setBusy(true);
    try {
      await api(`/api/tenants/${tenant.id}/team`, { method: "POST", json: { email, role: newRole } });
      toast.success(fa ? "عضو اضافه شد" : "Member added");
      setEmail("");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const changeRole = async (m: Member, role: string) => {
    try {
      await api(`/api/team/${m.id}`, { method: "PATCH", json: { role } });
      toast.success(fa ? "نقش به‌روزرسانی شد" : "Role updated");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  const remove = async () => {
    if (!removing) return;
    try {
      await api(`/api/team/${removing.id}`, { method: "DELETE" });
      toast.success(fa ? "حذف شد" : "Removed");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-5" dir={fa ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-black">{t("tm.title")}</h1>
        <p className="text-sm text-muted-foreground">{members.length}/{maxTeam} {fa ? "نفر" : "members"}</p>
      </div>

      {canManage && (
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="mb-3 flex items-center gap-1.5 font-bold"><ShieldCheck className="h-4 w-4 text-teal-700" />{t("tm.invite")}</p>
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-48 flex-1 space-y-1.5">
              <Label>{t("tm.email")}</Label>
              <Input dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colleague@restaurant.com" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("tm.role")}</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["ADMIN", "MANAGER", "EDITOR", "VIEWER"] as Role[]).map((r) => (
                    <SelectItem key={r} value={r}>{fa ? ROLE_LABELS[r].fa : ROLE_LABELS[r].en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={add} disabled={busy || !email} className="bg-teal-700 font-bold hover:bg-teal-800">{busy ? "…" : t("tm.add")}</Button>
          </div>
          {members.length >= maxTeam && <p className="mt-2 flex items-center gap-1 text-xs text-amber-600"><Lock className="h-3 w-3" />{fa ? "سقف پلن پر شد — برای افزودن عضو بیشتر ارتقا دهید" : "Plan limit reached — upgrade to add more members"}</p>}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-stone-50 text-start">
            <tr className="text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2.5 text-start font-bold">{t("tm.member")}</th>
              <th className="px-4 py-2.5 text-start font-bold">{t("tm.access")}</th>
              {canManage && <th className="px-4 py-2.5" />}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-700/10 text-sm font-black text-teal-800">
                      {m.user.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold">{m.user.name}</p>
                      <p className="text-xs text-muted-foreground" dir="ltr">{m.user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {m.role === "OWNER" ? (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-800">👑 {fa ? ROLE_LABELS.OWNER.fa : ROLE_LABELS.OWNER.en}</span>
                  ) : canManage ? (
                    <Select value={m.role} onValueChange={(v) => changeRole(m, v)}>
                      <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(["ADMIN", "MANAGER", "EDITOR", "VIEWER"] as Role[]).map((r) => (
                          <SelectItem key={r} value={r}>{fa ? ROLE_LABELS[r].fa : ROLE_LABELS[r].en}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-xs font-bold">{fa ? ROLE_LABELS[m.role as Role]?.fa : ROLE_LABELS[m.role as Role]?.en}</span>
                  )}
                </td>
                {canManage && (
                  <td className="px-4 py-3 text-end">
                    {m.role !== "OWNER" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => setRemoving(m)} aria-label={t("tm.remove")}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <AlertDialogContent dir={fa ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle>{fa ? `حذف ${removing?.user.name}؟` : `Remove ${removing?.user.name}?`}</AlertDialogTitle>
            <AlertDialogDescription>{fa ? "دسترسی این شخص لغو می‌شود." : "This person will lose access to the dashboard."}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("menu.cancel")}</AlertDialogCancel>
            <AlertDialogAction className={cn("bg-red-600 hover:bg-red-700")} onClick={remove}>{t("tm.remove")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
