"use client";

import * as React from "react";
import { api, navigate } from "./store";
import { Spinner, EmptyState, PriceTag, ItemThumb } from "./ui-bits";
import { makeT, type Locale, CURRENCIES } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { TenantSummary } from "./store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, ChevronUp, ChevronDown, Search, Lock, Star, EyeOff, X, ImagePlus,
} from "lucide-react";

interface Category { id: string; nameFa: string; nameEn: string; icon: string; sortOrder: number; isActive: boolean; _count?: { items: number }; }
interface Variant { nameFa: string; nameEn: string; price: number; isAvailable: boolean; }
interface AddOn { nameFa: string; nameEn: string; price: number; isRequired: boolean; isAvailable: boolean; }
interface Item {
  id: string; categoryId: string; nameFa: string; nameEn: string; descFa?: string | null; descEn?: string | null;
  imageUrl?: string | null; sku?: string | null; basePrice: number; compareAtPrice?: number | null; currency: string;
  status: "AVAILABLE" | "UNAVAILABLE" | "HIDDEN"; featured: boolean; tags: string;
  isVegetarian: boolean; isVegan: boolean; isSpicy: boolean; isHalal: boolean; isGlutenFree: boolean;
  containsNuts: boolean; containsDairy: boolean; containsEgg: boolean;
  availableFrom?: number | null; availableTo?: number | null; sortOrder: number;
  variants: (Variant & { id: string })[]; addOns: (AddOn & { id: string })[];
}

const ATTRS = [
  ["isVegetarian", "menu.vegetarian", "🥗"], ["isVegan", "menu.vegan", "🌱"], ["isSpicy", "menu.spicy", "🌶️"],
  ["isHalal", "menu.halal", "☪️"], ["isGlutenFree", "menu.glutenFree", "🌾"], ["containsNuts", "menu.nuts", "🥜"],
  ["containsDairy", "menu.dairy", "🥛"], ["containsEgg", "menu.egg", "🥚"],
] as const;

const CAT_ICONS = ["🍽️", "🍔", "🍕", "🥤", "🍰", "🍳", "🥗", "🌮", "🍜", "☕", "🍞", "🐟", "🥩", "🍦", "🍹"];

export default function MenuEditor({ tenant, role, locale }: { tenant: TenantSummary; role: string; locale: Locale }) {
  const t = makeT(locale);
  const fa = locale === "fa";
  const canEdit = ["OWNER", "ADMIN", "MANAGER", "EDITOR"].includes(role);

  const [cats, setCats] = React.useState<Category[]>([]);
  const [items, setItems] = React.useState<Item[]>([]);
  const [selCat, setSelCat] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [editingItem, setEditingItem] = React.useState<Item | "new" | null>(null);
  const [editingCat, setEditingCat] = React.useState<Category | "new" | null>(null);
  const [deleting, setDeleting] = React.useState<{ type: "cat" | "item"; id: string; name: string } | null>(null);

  const load = React.useCallback(async () => {
    try {
      const [c, i] = await Promise.all([
        api<{ categories: Category[] }>(`/api/tenants/${tenant.id}/categories`),
        api<{ items: Item[] }>(`/api/tenants/${tenant.id}/items`),
      ]);
      setCats(c.categories);
      setItems(i.items);
      setSelCat((prev) => prev && c.categories.some((x) => x.id === prev) ? prev : c.categories[0]?.id ?? null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [tenant.id]);

  React.useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;

  const itemsOf = (catId: string) => items.filter((i) => i.categoryId === catId);
  const currentItems = selCat ? itemsOf(selCat) : [];
  const filtered = search ? currentItems.filter((i) => `${i.nameFa} ${i.nameEn} ${i.tags}`.toLowerCase().includes(search.toLowerCase())) : currentItems;

  const moveCat = async (idx: number, dir: -1 | 1) => {
    const arr = [...cats];
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    setCats(arr);
    await api("/api/categories/reorder", { method: "POST", json: { tenantId: tenant.id, ids: arr.map((c) => c.id) } }).catch(() => toast.error("Reorder failed"));
  };

  const moveItem = async (idx: number, dir: -1 | 1) => {
    const arr = [...filtered];
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    const fullIds = items.map((i) => (arr.includes(i) ? arr : [i])).flat();
    setItems(fullIds);
    await api("/api/items/reorder", { method: "POST", json: { tenantId: tenant.id, ids: fullIds.map((i) => i.id) } }).catch(() => toast.error("Reorder failed"));
  };

  const doDelete = async () => {
    if (!deleting) return;
    try {
      if (deleting.type === "cat") {
        await api(`/api/categories/${deleting.id}`, { method: "DELETE" });
        if (selCat === deleting.id) setSelCat(null);
      } else {
        await api(`/api/items/${deleting.id}`, { method: "DELETE" });
      }
      toast.success(fa ? "حذف شد" : "Deleted");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">{t("menu.title")}</h1>
          <p className="text-sm text-muted-foreground">{cats.length} {t("menu.categories")} · {items.length} {t("menu.items")}</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 font-bold" onClick={() => setEditingCat("new")}>
              <Plus className="h-4 w-4" /> {t("menu.addCategory")}
            </Button>
            <Button size="sm" className="gap-1.5 bg-teal-700 font-bold hover:bg-teal-800" onClick={() => selCat ? setEditingItem("new") : toast.error(fa ? "ابتدا یک دسته بسازید" : "Create a category first")}>
              <Plus className="h-4 w-4" /> {t("menu.addItem")}
            </Button>
          </div>
        )}
      </div>

      {cats.length === 0 ? (
        <EmptyState
          emoji="🗂️"
          title={t("menu.emptyCat")}
          action={canEdit ? <Button onClick={() => setEditingCat("new")} className="bg-teal-700 font-bold hover:bg-teal-800"><Plus className="h-4 w-4" />{t("menu.addCategory")}</Button> : undefined}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          {/* Categories column */}
          <div className="space-y-2">
            {cats.map((c, idx) => (
              <div
                key={c.id}
                onClick={() => { setSelCat(c.id); setSearch(""); }}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelCat(c.id); setSearch(""); } }}
                role="button"
                tabIndex={0}
                className={cn(
                  "group flex w-full cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-start shadow-sm transition",
                  selCat === c.id ? "border-teal-600 bg-teal-600/5 ring-2 ring-teal-600/20" : "border-stone-200 bg-white hover:border-stone-300"
                )}
              >
                <span className="text-xl" aria-hidden>{c.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-extrabold" dir="auto">{fa ? c.nameFa : c.nameEn}</span>
                  <span className="block text-[11px] text-muted-foreground" dir="ltr">{itemsOf(c.id).length} items</span>
                </span>
                {!c.isActive && <EyeOff className="h-3.5 w-3.5 text-stone-400" />}
                {canEdit && (
                  <span className="flex flex-col opacity-0 transition group-hover:opacity-100">
                    <button onClick={(e) => { e.stopPropagation(); moveCat(idx, -1); }} className="rounded p-0.5 hover:bg-stone-100" aria-label={t("menu.moveUp")}><ChevronUp className="h-3.5 w-3.5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); moveCat(idx, 1); }} className="rounded p-0.5 hover:bg-stone-100" aria-label={t("menu.moveDown")}><ChevronDown className="h-3.5 w-3.5" /></button>
                  </span>
                )}
                {canEdit && (
                  <span className="flex flex-col gap-1 opacity-60 transition group-hover:opacity-100">
                    <button onClick={(e) => { e.stopPropagation(); setEditingCat(c); }} aria-label={t("menu.edit")}><Pencil className="h-3.5 w-3.5 text-stone-500" /></button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleting({ type: "cat", id: c.id, name: fa ? c.nameFa : c.nameEn }); }} aria-label={t("menu.delete")}><Trash2 className="h-3.5 w-3.5 text-red-400" /></button>
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Items column */}
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("menu.searchItems")} className="ps-9" />
            </div>
            {filtered.length === 0 ? (
              <EmptyState emoji="🥘" title={search ? t("pm.noResults") : t("menu.emptyItems")} />
            ) : (
              filtered.map((item, idx) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border bg-white p-2.5 shadow-sm",
                    item.status === "UNAVAILABLE" && "opacity-70",
                    item.status === "HIDDEN" && "opacity-50"
                  )}
                  style={{ borderInlineStartWidth: 4, borderInlineStartColor: item.status === "UNAVAILABLE" ? "#E74C3C" : item.featured ? "#F59E0B" : "#0F766E" }}
                >
                  <ItemThumb url={item.imageUrl} fallback="🍽️" name={fa ? item.nameFa : item.nameEn} className="h-14 w-14 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-extrabold" dir="auto">{fa ? item.nameFa : item.nameEn}</p>
                      {item.featured && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />}
                      {item.status === "HIDDEN" && <Badge variant="outline" className="h-4 px-1 text-[9px]">{t("menu.hidden")}</Badge>}
                      {item.status === "UNAVAILABLE" && <Badge variant="outline" className="h-4 border-red-200 bg-red-50 px-1 text-[9px] text-red-600">{t("menu.unavailable")}</Badge>}
                      {(item.availableFrom != null && item.availableTo != null) && <Badge variant="outline" className="h-4 px-1 text-[9px] text-sky-600">{t("menu.scheduled")}</Badge>}
                    </div>
                    <p className="truncate text-xs text-muted-foreground" dir="auto">{fa ? item.nameEn || item.nameFa : item.nameFa || item.nameEn}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <PriceTag amount={item.basePrice} currency={item.currency} locale={locale} className="text-xs" />
                      {item.compareAtPrice && <PriceTag amount={item.compareAtPrice} currency={item.currency} locale={locale} strike className="text-[10px]" />}
                      {item.variants.length > 0 && <span className="text-[10px] text-muted-foreground" dir="ltr">{item.variants.length} variants</span>}
                      {item.addOns.length > 0 && <span className="text-[10px] text-muted-foreground" dir="ltr">{item.addOns.length} add-ons</span>}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex shrink-0 flex-col gap-0.5">
                      <button onClick={() => moveItem(idx, -1)} className="rounded p-0.5 hover:bg-stone-100" aria-label={t("menu.moveUp")}><ChevronUp className="h-3.5 w-3.5 text-stone-400" /></button>
                      <button onClick={() => moveItem(idx, 1)} className="rounded p-0.5 hover:bg-stone-100" aria-label={t("menu.moveDown")}><ChevronDown className="h-3.5 w-3.5 text-stone-400" /></button>
                    </div>
                  )}
                  {canEdit && (
                    <div className="flex shrink-0 gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingItem(item)} aria-label={t("menu.edit")}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-500" onClick={() => setDeleting({ type: "item", id: item.id, name: fa ? item.nameFa : item.nameEn })} aria-label={t("menu.delete")}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Dialogs */}
      {editingCat && (
        <CategoryDialog
          tenantId={tenant.id}
          cat={editingCat === "new" ? null : editingCat}
          onClose={() => setEditingCat(null)}
          onSaved={() => { setEditingCat(null); load(); }}
          locale={locale}
        />
      )}
      {editingItem && (
        <ItemDialog
          tenantId={tenant.id}
          currency={CURRENCIES[(items[0]?.currency) || "EUR"] ? (items[0]?.currency || "EUR") : "EUR"}
          cats={cats}
          defaultCat={selCat}
          item={editingItem === "new" ? null : editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={() => { setEditingItem(null); load(); }}
          locale={locale}
        />
      )}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent dir={fa ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle>{fa ? `حذف «${deleting?.name}»؟` : `Delete “${deleting?.name}”?`}</AlertDialogTitle>
            <AlertDialogDescription>{fa ? "این عمل قابل بازگشت نیست." : "This action cannot be undone."}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("menu.cancel")}</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={doDelete}>{t("menu.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Category dialog ───
function CategoryDialog({ tenantId, cat, onClose, onSaved, locale }: { tenantId: string; cat: Category | null; onClose: () => void; onSaved: () => void; locale: Locale }) {
  const t = makeT(locale);
  const fa = locale === "fa";
  const [nameFa, setNameFa] = React.useState(cat?.nameFa || "");
  const [nameEn, setNameEn] = React.useState(cat?.nameEn || "");
  const [icon, setIcon] = React.useState(cat?.icon || "🍽️");
  const [isActive, setIsActive] = React.useState(cat?.isActive ?? true);
  const [busy, setBusy] = React.useState(false);

  const save = async () => {
    if (!nameFa.trim() && !nameEn.trim()) return toast.error(fa ? "نام لازم است" : "Name is required");
    setBusy(true);
    try {
      if (cat) {
        await api(`/api/categories/${cat.id}`, { method: "PATCH", json: { nameFa, nameEn, icon, isActive } });
      } else {
        const res = await api<{ category: Category }>(`/api/tenants/${tenantId}/categories`, { method: "POST", json: { nameFa, nameEn, icon, isActive } });
        void res;
      }
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
        <DialogHeader>
          <DialogTitle>{cat ? t("menu.edit") : t("menu.addCategory")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("menu.nameFa")}</Label>
            <Input dir="rtl" value={nameFa} onChange={(e) => setNameFa(e.target.value)} placeholder="برگر" />
          </div>
          <div className="space-y-1.5">
            <Label>{t("menu.nameEn")}</Label>
            <Input dir="ltr" value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Burgers" />
          </div>
          <div className="space-y-1.5">
            <Label>{fa ? "آیکون" : "Icon"}</Label>
            <div className="flex flex-wrap gap-1.5">
              {CAT_ICONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={cn("flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition", icon === ic ? "border-teal-600 bg-teal-600/10 ring-2 ring-teal-600/20" : "border-stone-200 hover:bg-stone-50")}
                  type="button"
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor="catActive" className="cursor-pointer">{fa ? "نمایش در منو" : "Visible on menu"}</Label>
            <Switch id="catActive" checked={isActive} onCheckedChange={setIsActive} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>{t("menu.cancel")}</Button>
            <Button onClick={save} disabled={busy} className="bg-teal-700 font-bold hover:bg-teal-800">{busy ? <Spinner className="py-0" /> : t("menu.save")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Item dialog ───
function ItemDialog({ tenantId, currency, cats, defaultCat, item, onClose, onSaved, locale }: {
  tenantId: string; currency: string; cats: Category[]; defaultCat: string | null; item: Item | null; onClose: () => void; onSaved: () => void; locale: Locale;
}) {
  const t = makeT(locale);
  const fa = locale === "fa";
  const [tab, setTab] = React.useState("basic");
  const [busy, setBusy] = React.useState(false);
  const [form, setForm] = React.useState({
    categoryId: item?.categoryId || defaultCat || cats[0]?.id || "",
    nameFa: item?.nameFa || "",
    nameEn: item?.nameEn || "",
    descFa: item?.descFa || "",
    descEn: item?.descEn || "",
    basePrice: item?.basePrice ?? 0,
    compareAtPrice: item?.compareAtPrice ?? "",
    imageUrl: item?.imageUrl || "",
    status: item?.status || "AVAILABLE",
    featured: item?.featured || false,
    tags: item?.tags || "",
    availableFrom: item?.availableFrom ?? "",
    availableTo: item?.availableTo ?? "",
    isVegetarian: item?.isVegetarian || false,
    isVegan: item?.isVegan || false,
    isSpicy: item?.isSpicy || false,
    isHalal: item?.isHalal || false,
    isGlutenFree: item?.isGlutenFree || false,
    containsNuts: item?.containsNuts || false,
    containsDairy: item?.containsDairy || false,
    containsEgg: item?.containsEgg || false,
  });
  const [variants, setVariants] = React.useState<Variant[]>(item?.variants.map(({ nameFa, nameEn, price, isAvailable }) => ({ nameFa, nameEn, price, isAvailable })) || []);
  const [addOns, setAddOns] = React.useState<AddOn[]>(item?.addOns.map(({ nameFa, nameEn, price, isRequired, isAvailable }) => ({ nameFa, nameEn, price, isRequired, isAvailable })) || []);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.nameFa.trim() && !form.nameEn.trim()) return toast.error(fa ? "نام لازم است" : "Name is required");
    if (!form.categoryId) return toast.error(fa ? "دسته را انتخاب کنید" : "Pick a category");
    setBusy(true);
    try {
      const payload = {
        ...form,
        compareAtPrice: form.compareAtPrice === "" ? null : form.compareAtPrice,
        availableFrom: form.availableFrom === "" ? null : form.availableFrom,
        availableTo: form.availableTo === "" ? null : form.availableTo,
        variants: variants.filter((v) => v.nameFa.trim() || v.nameEn.trim()),
        addOns: addOns.filter((a) => a.nameFa.trim() || a.nameEn.trim()),
      };
      if (item) {
        await api(`/api/items/${item.id}`, { method: "PATCH", json: payload });
      } else {
        await api(`/api/tenants/${tenantId}/items`, { method: "POST", json: payload });
      }
      toast.success(t("menu.save"));
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir={fa ? "rtl" : "ltr"} className="max-h-[90vh] max-w-2xl overflow-y-auto nice-scroll" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{item ? `${t("menu.edit")}: ${fa ? item.nameFa : item.nameEn}` : t("menu.addItem")}</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="basic">{fa ? "اطلاعات" : "Basic"}</TabsTrigger>
            <TabsTrigger value="pricing">{fa ? "قیمت" : "Pricing"}</TabsTrigger>
            <TabsTrigger value="attributes">{fa ? "ویژگی‌ها" : "Attributes"}</TabsTrigger>
            <TabsTrigger value="extras">{fa ? "گزینه‌ها" : "Variants"}</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 pt-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t("menu.nameFa")}</Label>
                <Input dir="rtl" value={form.nameFa} onChange={(e) => set("nameFa", e.target.value)} placeholder="چیزبرگر" />
              </div>
              <div className="space-y-1.5">
                <Label>{t("menu.nameEn")}</Label>
                <Input dir="ltr" value={form.nameEn} onChange={(e) => set("nameEn", e.target.value)} placeholder="Cheeseburger" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t("menu.descFa")}</Label>
                <Textarea dir="rtl" rows={2} value={form.descFa} onChange={(e) => set("descFa", e.target.value)} placeholder="برگر گوشت با پنیر چدار…" />
              </div>
              <div className="space-y-1.5">
                <Label>{t("menu.descEn")}</Label>
                <Textarea dir="ltr" rows={2} value={form.descEn} onChange={(e) => set("descEn", e.target.value)} placeholder="Beef burger with cheddar…" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{fa ? "دسته" : "Category"}</Label>
                <Select value={form.categoryId} onValueChange={(v) => set("categoryId", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.icon} {fa ? c.nameFa : c.nameEn}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("menu.tags")}</Label>
                <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="Popular, Spicy" dir="ltr" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><ImagePlus className="h-3.5 w-3.5" />{t("menu.image")}</Label>
              <div className="flex gap-2">
                <Input dir="ltr" value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://…/burger.jpg" className="flex-1" />
                {form.imageUrl && <ItemThumb url={form.imageUrl} fallback="🍽️" name="preview" className="h-10 w-14 shrink-0" />}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4 pt-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t("menu.price")} ({currency})</Label>
                <Input dir="ltr" type="number" step="0.01" min="0" value={form.basePrice} onChange={(e) => set("basePrice", Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("menu.compareAt")} <span className="text-xs text-muted-foreground">({t("menu.optional")})</span></Label>
                <Input dir="ltr" type="number" step="0.01" min="0" value={form.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value === "" ? "" : Number(e.target.value))} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t("menu.status")}</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">✅ {t("menu.available")}</SelectItem>
                    <SelectItem value="UNAVAILABLE">❌ {t("menu.unavailable")}</SelectItem>
                    <SelectItem value="HIDDEN">🙈 {t("menu.hidden")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="featured" className="cursor-pointer">{t("menu.featured")} ⭐</Label>
                <Switch id="featured" checked={form.featured} onCheckedChange={(v) => set("featured", v)} />
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <p className="mb-2 text-sm font-bold">{t("menu.schedule")} <span className="text-xs font-normal text-muted-foreground">({fa ? "مثلاً صبحانه ۷ تا ۱۲" : "e.g. breakfast 7–12"})</span></p>
              <div className="flex items-center gap-2">
                <Input dir="ltr" type="number" min="0" max="23" placeholder={t("menu.from")} value={form.availableFrom} onChange={(e) => set("availableFrom", e.target.value === "" ? "" : Number(e.target.value))} className="w-24" />
                <span className="text-muted-foreground">→</span>
                <Input dir="ltr" type="number" min="0" max="23" placeholder={t("menu.to")} value={form.availableTo} onChange={(e) => set("availableTo", e.target.value === "" ? "" : Number(e.target.value))} className="w-24" />
                {(form.availableFrom !== "" || form.availableTo !== "") && (
                  <Button variant="ghost" size="icon" onClick={() => { set("availableFrom", ""); set("availableTo", ""); }} aria-label="Clear"><X className="h-4 w-4" /></Button>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="attributes" className="pt-2">
            <p className="mb-2 text-sm font-bold">{t("menu.attributes")}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ATTRS.map(([key, label, emoji]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => set(key as keyof typeof form, !form[key as keyof typeof form] as never)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-bold transition",
                    form[key as keyof typeof form] ? "border-teal-600 bg-teal-600/10 text-teal-800 ring-2 ring-teal-600/20" : "border-stone-200 hover:bg-stone-50"
                  )}
                >
                  <span className="text-xl" aria-hidden>{emoji}</span>
                  {t(label)}
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="extras" className="space-y-5 pt-2">
            <div>
              <p className="mb-2 text-sm font-bold">{t("menu.variants")}</p>
              <div className="space-y-2">
                {variants.map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input dir="rtl" placeholder="نام فارسی" value={v.nameFa} onChange={(e) => setVariants((vs) => vs.map((x, j) => j === i ? { ...x, nameFa: e.target.value } : x))} className="flex-1" />
                    <Input dir="ltr" placeholder="English" value={v.nameEn} onChange={(e) => setVariants((vs) => vs.map((x, j) => j === i ? { ...x, nameEn: e.target.value } : x))} className="flex-1" />
                    <Input dir="ltr" type="number" step="0.01" placeholder="€" value={v.price} onChange={(e) => setVariants((vs) => vs.map((x, j) => j === i ? { ...x, price: Number(e.target.value) } : x))} className="w-20" />
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-red-400" onClick={() => setVariants((vs) => vs.filter((_, j) => j !== i))} aria-label="Remove"><X className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => setVariants((vs) => [...vs, { nameFa: "", nameEn: "", price: 0, isAvailable: true }])}>
                <Plus className="h-3.5 w-3.5" /> {t("menu.addVariant")}
              </Button>
            </div>
            <div>
              <p className="mb-2 text-sm font-bold">{t("menu.addons")}</p>
              <div className="space-y-2">
                {addOns.map((a, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input dir="rtl" placeholder="نام فارسی" value={a.nameFa} onChange={(e) => setAddOns((xs) => xs.map((x, j) => j === i ? { ...x, nameFa: e.target.value } : x))} className="flex-1" />
                    <Input dir="ltr" placeholder="English" value={a.nameEn} onChange={(e) => setAddOns((xs) => xs.map((x, j) => j === i ? { ...x, nameEn: e.target.value } : x))} className="flex-1" />
                    <Input dir="ltr" type="number" step="0.01" placeholder="+€" value={a.price} onChange={(e) => setAddOns((xs) => xs.map((x, j) => j === i ? { ...x, price: Number(e.target.value) } : x))} className="w-20" />
                    <label className="flex shrink-0 cursor-pointer items-center gap-1 text-[11px] font-bold text-muted-foreground">
                      <Checkbox checked={a.isRequired} onCheckedChange={(v) => setAddOns((xs) => xs.map((x, j) => j === i ? { ...x, isRequired: v === true } : x))} />
                      {t("menu.required")}
                    </label>
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-red-400" onClick={() => setAddOns((xs) => xs.filter((_, j) => j !== i))} aria-label="Remove"><X className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => setAddOns((xs) => [...xs, { nameFa: "", nameEn: "", price: 0, isRequired: false, isAvailable: true }])}>
                <Plus className="h-3.5 w-3.5" /> {t("menu.addAddOn")}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={onClose}>{t("menu.cancel")}</Button>
          <Button onClick={save} disabled={busy} className="bg-teal-700 font-bold hover:bg-teal-800">
            {busy ? <Spinner className="py-0" /> : <>{t("menu.save")}</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
