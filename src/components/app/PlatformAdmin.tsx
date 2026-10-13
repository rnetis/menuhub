"use client";

import * as React from "react";
import { api, navigate } from "./store";
import { useApp } from "./store";
import { Logo, Spinner, StatCard } from "./ui-bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Building2, UtensilsCrossed, Activity, DollarSign, ExternalLink, Ban, CheckCircle2, LogOut } from "lucide-react";

interface AdminTenant {
  id: string; name: string; slug: string; plan: string; status: string; createdAt: string;
  counts: { items: number; categories: number; memberships: number; events: number };
  owner: string | null;
}
interface AdminData {
  tenants: AdminTenant[];
  stats: { totalTenants: number; activeTenants: number; totalItems: number; totalEvents: number; mrr: number };
}

export default function PlatformAdmin() {
  const { user, loaded, logout } = useApp();
  const [data, setData] = React.useState<AdminData | null>(null);
  const [denied, setDenied] = React.useState(false);

  React.useEffect(() => {
    if (loaded && !user) navigate("#/login");
  }, [user, loaded]);

  const load = React.useCallback(async () => {
    try {
      setData(await api<AdminData>("/api/admin/tenants"));
    } catch {
      setDenied(true);
    }
  }, []);

  React.useEffect(() => { if (user) load(); }, [user, load]);

  if (!loaded || !user) return <div className="flex min-h-screen items-center justify-center"><Spinner /></div>;

  if (denied) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center font-vazir" dir="ltr">
        <Logo />
        <p className="font-bold">403 — Platform admin access only</p>
        <Button variant="outline" onClick={() => navigate("#/dashboard/overview")}>Back to dashboard</Button>
      </div>
    );
  }

  if (!data) return <div className="flex min-h-screen items-center justify-center"><Spinner /></div>;

  const patchTenant = async (id: string, body: Record<string, string>) => {
    try {
      await api(`/api/admin/tenants/${id}`, { method: "PATCH", json: body });
      toast.success("Updated");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  return (
    <div dir="ltr" className="min-h-screen bg-stone-950 font-vazir text-stone-100">
      <header className="sticky top-0 z-40 border-b border-stone-800 bg-stone-950/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Logo light />
            <Badge className="bg-amber-400 text-stone-900 hover:bg-amber-400">Platform Admin</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="hidden text-stone-400 sm:inline">{user.email}</span>
            <Button variant="outline" size="sm" onClick={async () => { await logout(); navigate("#/"); }} className="gap-1.5 border-stone-700 bg-transparent text-stone-300 hover:bg-stone-800 hover:text-white">
              <LogOut className="h-3.5 w-3.5" /> Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard label="Tenants" value={data.stats.totalTenants} icon={<Building2 className="h-4 w-4" />} />
          <StatCard label="Active" value={data.stats.activeTenants} icon={<CheckCircle2 className="h-4 w-4" />} accent="teal" />
          <StatCard label="Menu items" value={data.stats.totalItems} icon={<UtensilsCrossed className="h-4 w-4" />} accent="amber" />
          <StatCard label="Events (30d)" value={data.stats.totalEvents.toLocaleString("en-US")} icon={<Activity className="h-4 w-4" />} accent="sky" />
          <StatCard label="MRR (demo)" value={`$${data.stats.mrr}`} icon={<DollarSign className="h-4 w-4" />} accent="rose" />
        </div>

        <div className="overflow-hidden rounded-2xl border border-stone-800 bg-stone-900 shadow">
          <div className="nice-scroll overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-stone-800 text-start text-xs uppercase tracking-wide text-stone-400">
                  <th className="px-4 py-3 text-start font-bold">Tenant</th>
                  <th className="px-4 py-3 text-start font-bold">Owner</th>
                  <th className="px-4 py-3 text-start font-bold">Content</th>
                  <th className="px-4 py-3 text-start font-bold">Plan</th>
                  <th className="px-4 py-3 text-start font-bold">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.tenants.map((tt) => (
                  <tr key={tt.id} className="border-b border-stone-800/70 last:border-0 hover:bg-stone-800/40">
                    <td className="px-4 py-3">
                      <p className="font-bold">{tt.name}</p>
                      <p className="text-xs text-stone-400" dir="ltr">/m/{tt.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-300" dir="ltr">{tt.owner || "—"}</td>
                    <td className="px-4 py-3 text-xs text-stone-300" dir="ltr">
                      {tt.counts.categories} cats · {tt.counts.items} items · {tt.counts.events} events
                    </td>
                    <td className="px-4 py-3">
                      <Select value={tt.plan} onValueChange={(v) => patchTenant(tt.id, { plan: v })}>
                        <SelectTrigger className="h-8 w-32 border-stone-700 bg-stone-800 text-xs text-stone-200"><SelectValue /></SelectTrigger>
                        <SelectContent className="border-stone-700 bg-stone-800 text-stone-200">
                          {["FREE", "STARTER", "BUSINESS", "ENTERPRISE"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => patchTenant(tt.id, { status: tt.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" })}>
                        <Badge className={tt.status === "ACTIVE" ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25" : "bg-red-500/15 text-red-400 hover:bg-red-500/25"}>
                          {tt.status === "ACTIVE" ? <CheckCircle2 className="me-1 h-3 w-3" /> : <Ban className="me-1 h-3 w-3" />}
                          {tt.status}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-white" onClick={() => window.open(`#/m/${tt.slug}`, "_blank")} aria-label="View menu">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
