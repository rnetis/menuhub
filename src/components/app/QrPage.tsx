"use client";

import * as React from "react";
import { api } from "./store";
import { Spinner } from "./ui-bits";
import { makeT } from "@/lib/i18n";
import type { TenantSummary } from "./store";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, Download, Printer, QrCode, ExternalLink } from "lucide-react";

interface QrResponse { svg: string; png: string; }

export default function QrPage({ tenant, locale }: { tenant: TenantSummary; role: string; locale: "fa" | "en" }) {
  const t = makeT(locale);
  const fa = locale === "fa";
  const [size, setSize] = React.useState("512");
  const [qr, setQr] = React.useState<QrResponse | null>(null);
  const [busy, setBusy] = React.useState(false);
  const menuUrl = typeof window !== "undefined" ? `${window.location.origin}/#/m/${tenant.slug}?src=qr` : `/#/m/${tenant.slug}?src=qr`;

  const generate = React.useCallback(async () => {
    setBusy(true);
    try {
      const data = await api<QrResponse>("/api/qr", { method: "POST", json: { text: menuUrl, size: Number(size), dark: "#134E4A" } });
      setQr(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }, [menuUrl, size]);

  React.useEffect(() => { generate(); }, [generate]);

  const downloadSvg = () => {
    if (!qr) return;
    const blob = new Blob([qr.svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tenant.slug}-qr.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPng = () => {
    if (!qr) return;
    const a = document.createElement("a");
    a.href = qr.png;
    a.download = `${tenant.slug}-qr.png`;
    a.click();
  };

  const copy = async () => {
    await navigator.clipboard.writeText(menuUrl);
    toast.success(t("qr.copied"));
  };

  return (
    <div className="space-y-5" dir={fa ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-black">{t("qr.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("qr.sub")}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* QR card */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col items-center gap-4">
            {busy || !qr ? (
              <div className="flex h-64 w-64 items-center justify-center"><Spinner /></div>
            ) : (
              <div className="rounded-2xl border-4 border-teal-800/10 bg-white p-4 shadow-inner" dir="ltr">
                { }
                <img src={qr.png} alt="Menu QR code" className="h-56 w-56" />
              </div>
            )}
            <div className="flex w-full items-center gap-2" dir="ltr">
              <code className="flex-1 truncate rounded-lg bg-stone-100 px-3 py-2 text-xs text-stone-600">{menuUrl}</code>
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={copy} aria-label={t("qr.copy")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex w-full flex-wrap gap-2">
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger className="w-28" aria-label={t("qr.size")}><SelectValue /></SelectTrigger>
                <SelectContent dir="ltr">
                  <SelectItem value="256">256px</SelectItem>
                  <SelectItem value="512">512px</SelectItem>
                  <SelectItem value="1024">1024px</SelectItem>
                  <SelectItem value="2048">2048px</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="flex-1 gap-1.5 font-bold" onClick={downloadPng} disabled={!qr}>
                <Download className="h-4 w-4" /> PNG
              </Button>
              <Button variant="outline" className="flex-1 gap-1.5 font-bold" onClick={downloadSvg} disabled={!qr}>
                <Download className="h-4 w-4" /> SVG
              </Button>
            </div>
          </div>
        </div>

        {/* Printable table card */}
        <div className="space-y-3">
          <p className="text-sm font-bold">{t("qr.preview")}</p>
          <div className="print-card mx-auto w-full max-w-sm rounded-3xl border-2 border-stone-200 bg-white p-6 text-center shadow-lg" dir="rtl">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 text-2xl text-white shadow-md">
              🍽️
            </div>
            <p className="text-lg font-black text-stone-900">{tenant.name}</p>
            <p className="mb-1 text-sm font-bold text-stone-500">SCAN TO VIEW MENU</p>
            <p className="mb-4 text-sm font-bold text-stone-500">منوی رستوران را اسکن کنید</p>
            {qr && (
              <div className="mx-auto w-fit rounded-xl border-2 border-stone-100 p-3" dir="ltr">
                { }
                <img src={qr.png} alt="QR" className="h-40 w-40" />
              </div>
            )}
            <p className="mt-3 flex items-center justify-center gap-1 text-[10px] font-bold text-teal-700" dir="ltr">
              <QrCode className="h-3 w-3" /> menuhub.app/m/{tenant.slug}
            </p>
          </div>
          <div className="flex justify-center gap-2">
            <Button variant="outline" className="gap-1.5 font-bold" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> {fa ? "چاپ کارت" : "Print card"}
            </Button>
            <Button variant="ghost" className="gap-1.5" onClick={() => window.open(`#/m/${tenant.slug}?src=qr`, "_blank")}>
              <ExternalLink className="h-4 w-4" /> {t("nav.viewMenu")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
