"use client";

import * as React from "react";
import { api } from "./store";
import { makeT } from "@/lib/i18n";
import type { TenantSummary } from "./store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Download, FileUp, Table2, Lock } from "lucide-react";

interface Row { category: string; name_fa: string; name_en: string; description_fa: string; description_en: string; price: string; currency: string }

const TEMPLATE = `category,name_fa,name_en,description_fa,description_en,price,currency
Burgers,چیزبرگر,Cheeseburger,برگر گوشت با پنیر,Beef burger with cheese,12.5,EUR
Drinks,کاپوچینو,Cappuccino,اسپرسو با شیر,Espresso with milk,3.5,EUR`;

function parseCsv(text: string): Row[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];
  const splitLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQ) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') inQ = false;
        else cur += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === ",") { out.push(cur); cur = ""; }
      else cur += ch;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };
  const header = splitLine(lines[0]).map((h) => h.toLowerCase());
  const rows: Row[] = [];
  for (const line of lines.slice(1)) {
    const cells = splitLine(line);
    const row: Row = { category: "", name_fa: "", name_en: "", description_fa: "", description_en: "", price: "", currency: "" };
    header.forEach((h, i) => {
      if (h in row) (row as unknown as Record<string, string>)[h] = cells[i] ?? "";
    });
    if (row.name_fa || row.name_en) rows.push(row);
  }
  return rows;
}

export default function ImportExportPage({ tenant, locale }: { tenant: TenantSummary; role: string; locale: "fa" | "en" }) {
  const t = makeT(locale);
  const fa = locale === "fa";
  const canUse = ["OWNER", "ADMIN", "MANAGER", "EDITOR"].includes(role) && !["FREE"].includes(tenant.plan || "FREE");
  const [csvText, setCsvText] = React.useState("");
  const [rows, setRows] = React.useState<Row[] | null>(null);
  const [busy, setBusy] = React.useState(false);

  const preview = () => {
    const parsed = parseCsv(csvText);
    if (parsed.length === 0) return toast.error(fa ? "ردیف معتبری پیدا نشد" : "No valid rows found");
    setRows(parsed);
  };

  const doImport = async () => {
    if (!rows) return;
    setBusy(true);
    try {
      const res = await api<{ imported: number; createdCategories: number }>(`/api/tenants/${tenant.id}/import`, { method: "POST", json: { rows } });
      toast.success(`${t("ie.imported")}: ${res.imported} (${res.createdCategories} ${fa ? "دسته جدید" : "new categories"})`);
      setRows(null);
      setCsvText("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (file: File) => {
    const text = await file.text();
    setCsvText(text);
    setRows(parseCsv(text));
  };

  return (
    <div className="space-y-5" dir={fa ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-black">{t("ie.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("ie.importSub")}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Import */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="mb-3 flex items-center gap-1.5 font-bold"><FileUp className="h-4 w-4 text-teal-700" />{t("ie.import")}</p>
          {!canUse ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-10 text-center">
              <Lock className="h-6 w-6 text-amber-500" />
              <p className="text-sm font-bold">{fa ? "ورود داده در پلن رایگان فعال نیست" : "Import requires Starter plan or above"}</p>
            </div>
          ) : (
            <>
              <Textarea
                dir="ltr"
                rows={6}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={TEMPLATE}
                className="font-mono text-xs"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs font-bold hover:bg-accent">
                  <Table2 className="h-3.5 w-3.5" />
                  {fa ? "انتخاب فایل CSV" : "Choose CSV file"}
                  <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
                </label>
                <Button variant="outline" size="sm" onClick={() => { setCsvText(TEMPLATE); setRows(parseCsv(TEMPLATE)); }}>
                  {fa ? "نمونه" : "Sample"}
                </Button>
                <Button size="sm" onClick={preview} disabled={!csvText.trim()} className="bg-teal-700 font-bold hover:bg-teal-800">
                  {t("ie.preview")}
                </Button>
              </div>

              {rows && (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-bold">{rows.length} {t("ie.rows")}</p>
                  <div className="nice-scroll max-h-56 overflow-auto rounded-lg border">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-stone-50">
                        <tr>
                          {["category", "name_fa", "name_en", "price"].map((h) => <th key={h} className="px-2 py-1.5 text-start font-bold text-muted-foreground">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(0, 50).map((r, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-2 py-1.5">{r.category}</td>
                            <td className="px-2 py-1.5" dir="rtl">{r.name_fa}</td>
                            <td className="px-2 py-1.5" dir="ltr">{r.name_en}</td>
                            <td className="px-2 py-1.5" dir="ltr">{r.price} {r.currency}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Button onClick={doImport} disabled={busy} className="mt-3 w-full bg-teal-700 font-bold hover:bg-teal-800">
                    {busy ? "…" : t("ie.doImport")}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Export */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="mb-3 flex items-center gap-1.5 font-bold"><Download className="h-4 w-4 text-teal-700" />{fa ? "خروجی گرفتن" : "Export"}</p>
          {!canUse ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-10 text-center">
              <Lock className="h-6 w-6 text-amber-500" />
              <p className="text-sm font-bold">{fa ? "خروجی داده در پلن رایگان فعال نیست" : "Export requires Starter plan or above"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {fa ? "از منوی خود خروجی CSV (سازگار با اکسل) یا JSON پشتیبان بگیرید." : "Download your full menu as Excel-friendly CSV or a JSON backup."}
              </p>
              <div className="flex flex-wrap gap-2">
                <a href={`/api/tenants/${tenant.id}/export?format=csv`} download>
                  <Button variant="outline" className="gap-1.5 font-bold"><Download className="h-4 w-4" /> {t("ie.exportCsv")}</Button>
                </a>
                <a href={`/api/tenants/${tenant.id}/export?format=json`} download>
                  <Button variant="outline" className="gap-1.5 font-bold"><Download className="h-4 w-4" /> {t("ie.exportJson")}</Button>
                </a>
                <Button variant="ghost" className="gap-1.5 text-xs" onClick={() => {
                  const blob = new Blob([TEMPLATE], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "menuhub-import-template.csv";
                  a.click();
                  URL.revokeObjectURL(url);
                }}>
                  {t("ie.template")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
