/**
 * Seed script — creates demo users + the "Cafe Nova" bilingual demo tenant.
 * Idempotent: wipes demo data first, then recreates.
 * Run: bun run scripts/seed.ts
 */
import { PrismaClient } from "@prisma/client";
import { scryptSync, randomBytes } from "crypto";

const db = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const DEMO_EMAIL = "demo@menuhub.app";
const ADMIN_EMAIL = "admin@menuhub.app";

async function main() {
  console.log("Seeding…");

  await db.user.deleteMany({ where: { email: { in: [DEMO_EMAIL, ADMIN_EMAIL] } } });
  await db.tenant.deleteMany({ where: { slug: "cafe-nova" } });

  const demoUser = await db.user.create({
    data: { email: DEMO_EMAIL, name: "Nova Owner", passwordHash: hashPassword("demo1234") },
  });
  await db.user.create({
    data: { email: ADMIN_EMAIL, name: "Platform Admin", passwordHash: hashPassword("admin1234"), isPlatformAdmin: true },
  });

  const now = new Date();
  const renews = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

  const tenant = await db.tenant.create({
    data: {
      name: "Cafe Nova",
      slug: "cafe-nova",
      taglineFa: "قهوه تازه، غذای خانگی، فضای گرم",
      taglineEn: "Fresh coffee, homemade food, warm vibes",
      businessType: "cafe",
      defaultLanguage: "fa",
      fallbackLanguage: "fa",
      currency: "EUR",
      theme: "classic",
      primaryColor: "#0F766E",
      secondaryColor: "#F59E0B",
      plan: "BUSINESS",
      planRenewsAt: renews,
      showPlatformBrand: false,
      phone: "+98 21 1234 5678",
      address: "No. 12, Valiasr St, Tehran",
      memberships: { create: { userId: demoUser.id, role: "OWNER" } },
      branches: {
        create: [
          { name: "شعبه مرکز", nameEn: "Downtown", address: "Valiasr St, Tehran", phone: "+98 21 1234 5678", openHour: 8, closeHour: 23, sortOrder: 0 },
          { name: "شعبه فرودگاه", nameEn: "Airport", address: "IKA Airport, Tehran", phone: "+98 21 8765 4321", openHour: 6, closeHour: 22, sortOrder: 1 },
        ],
      },
    },
  });

  const catDefs = [
    { icon: "🍳", nameFa: "صبحانه", nameEn: "Breakfast", descFa: "تازه تا ساعت ۱۲", descEn: "Served fresh until 12:00" },
    { icon: "🍔", nameFa: "برگر", nameEn: "Burgers", descFa: "با گوشت تازه روزانه", descEn: "Made with fresh daily beef" },
    { icon: "🍕", nameFa: "پیتزا", nameEn: "Pizza", descFa: "خمیر خانگی و فر سنگی", descEn: "Homemade dough, stone oven" },
    { icon: "🍝", nameFa: "پاستا", nameEn: "Pasta", descFa: "کلاسیک‌های ایتالیایی", descEn: "Italian classics" },
    { icon: "🥤", nameFa: "نوشیدنی", nameEn: "Drinks", descFa: "سرد و گرم", descEn: "Hot & cold" },
    { icon: "🍰", nameFa: "دسر", nameEn: "Desserts", descFa: "شیرینی‌های خانگی", descEn: "Homemade sweets" },
  ];

  const cats: Record<string, string> = {};
  for (let i = 0; i < catDefs.length; i++) {
    const c = await db.category.create({
      data: { tenantId: tenant.id, sortOrder: i, ...catDefs[i] },
    });
    cats[c.nameEn] = c.id;
  }

  interface ItemDef {
    cat: string;
    nameFa: string;
    nameEn: string;
    descFa?: string;
    descEn?: string;
    price: number;
    compareAt?: number;
    featured?: boolean;
    status?: string;
    tags?: string;
    veg?: boolean;
    vegan?: boolean;
    spicy?: boolean;
    halal?: boolean;
    gf?: boolean;
    nuts?: boolean;
    dairy?: boolean;
    egg?: boolean;
    image?: string;
    availableFrom?: number;
    availableTo?: number;
    variants?: [string, string, number][];
    addOns?: [string, string, number, boolean?][];
  }

  const img = (id: string) => `https://images.unsplash.com/${id}?w=640&q=80&auto=format&fit=crop`;

  const items: ItemDef[] = [
    {
      cat: "Breakfast", nameFa: "املت اسپانیایی", nameEn: "Spanish Omelette",
      descFa: "تخم‌مرغ، سیب‌زمینی، فلفل دلمه و پنیر",
      descEn: "Eggs, potatoes, bell pepper and cheese",
      price: 6.5, veg: true, dairy: true, egg: true, tags: "Popular", image: img("photo-1510693206972-df098062cb71"),
    },
    {
      cat: "Breakfast", nameFa: "پنکیک عسل", nameEn: "Honey Pancakes",
      descFa: "سه لایه پنکیک با عسل طبیعی و کره",
      descEn: "Three-layer pancakes with natural honey and butter",
      price: 5.9, veg: true, dairy: true, egg: true, featured: true, tags: "Sweet", image: img("photo-1567620905732-2d1ec7ab7445"),
    },
    {
      cat: "Breakfast", nameFa: "نان و پنیر و گردو", nameEn: "Bread, Cheese & Walnuts",
      descFa: "صبحانه سنتی ایرانی با نان تازه",
      descEn: "Traditional Persian breakfast with fresh bread",
      price: 4.5, veg: true, nuts: true, dairy: true, image: img("photo-1509440159596-0249088772ff"),
    },
    {
      cat: "Burgers", nameFa: "چیزبرگر", nameEn: "Cheeseburger",
      descFa: "برگر گوشت تازه با پنیر چدار، کاهو و سس مخصوص",
      descEn: "Fresh beef burger with cheddar cheese, lettuce and signature sauce",
      price: 12.5, compareAt: 14, featured: true, tags: "Popular,Burger", image: img("photo-1568901346375-23c9450c58cd"),
      variants: [["کوچک", "Small", 10.5], ["بزرگ", "Large", 15]],
      addOns: [["پنیر اضافه", "Extra cheese", 1], ["بیکن", "Bacon", 2], ["تخم‌مرغ", "Fried egg", 1], ["سس اضافه", "Extra sauce", 0.5]],
    },
    {
      cat: "Burgers", nameFa: "برگر مرغ تند", nameEn: "Spicy Chicken Burger",
      descFa: "فیله مرغ سوخاری با سس تند مکزیکی",
      descEn: "Crispy chicken fillet with Mexican hot sauce",
      price: 11, spicy: true, tags: "Spicy", image: img("photo-1606755962773-d324e0a13086"),
      addOns: [["پنیر اضافه", "Extra cheese", 1], ["جالاپینو", "Jalapeño", 0.8]],
    },
    {
      cat: "Burgers", nameFa: "دوبل برگر", nameEn: "Double Burger",
      descFa: "دو لایه گوشت، دو لایه پنیر، پیاز کاراملی",
      descEn: "Two beef patties, double cheese, caramelized onions",
      price: 16, halal: true, image: img("photo-1594212699903-ec8a3eca50f5"),
    },
    {
      cat: "Burgers", nameFa: "برگر گیاهی", nameEn: "Veggie Burger",
      descFa: "برگر عدس و نخود با سس تاهینی",
      descEn: "Lentil & chickpea patty with tahini sauce",
      price: 10, veg: true, vegan: true, tags: "New", image: img("photo-1520072959219-c595dc870360"),
    },
    {
      cat: "Pizza", nameFa: "پیتزا مارگاریتا", nameEn: "Margherita Pizza",
      descFa: "سس گوجه، موزارلا و ریحان تازه",
      descEn: "Tomato sauce, mozzarella and fresh basil",
      price: 9.5, compareAt: 11, veg: true, dairy: true, image: img("photo-1604382354936-07c5d9983bd3"),
      variants: [["کوچک ۲۶ سانت", 'Small 10"', 9.5], ["بزرگ ۳۳ سانت", 'Large 13"', 13]],
    },
    {
      cat: "Pizza", nameFa: "پیتزا پپرونی", nameEn: "Pepperoni Pizza",
      descFa: "پپرونی تند، پنیر موزارلا و سس گوجه",
      descEn: "Spicy pepperoni, mozzarella, tomato sauce",
      price: 11.5, image: img("photo-1534307989820-d8524745a455"),
    },
    {
      cat: "Pizza", nameFa: "پیتزا مرغ و قارچ", nameEn: "Chicken & Mushroom Pizza",
      descFa: "مرغ گریل، قارچ، پیاز و پنیر",
      descEn: "Grilled chicken, mushrooms, onion and cheese",
      price: 12, image: img("photo-1565299624946-b28f40a0ae38"),
    },
    {
      cat: "Pasta", nameFa: "پاستا آلفردو", nameEn: "Alfredo Pasta",
      descFa: "فوتچینی با سس خامه و پارمزان",
      descEn: "Fettuccine with creamy sauce and parmesan",
      price: 10.5, veg: true, dairy: true, image: img("photo-1645177628172-a94c1f96e6db"),
    },
    {
      cat: "Pasta", nameFa: "پاستا بولونز", nameEn: "Bolognese Pasta",
      descFa: "اسپاگتی با سس گوشت خرد شده",
      descEn: "Spaghetti with minced beef ragù",
      price: 11.5, image: img("photo-1621996346565-e3dbc646d9a9"),
    },
    {
      cat: "Drinks", nameFa: "اسپرسو", nameEn: "Espresso",
      descFa: "قهوه تک‌خاستگاه، رست روشن",
      descEn: "Single-origin, light roast",
      price: 2.5, image: img("photo-1509042239860-f550ce710b93"),
    },
    {
      cat: "Drinks", nameFa: "کاپوچینو", nameEn: "Cappuccino",
      descFa: "اسپرسو با شیر بخارداده و لاته‌آرت",
      descEn: "Espresso with steamed milk and latte art",
      price: 3.5, dairy: true, tags: "Popular", image: img("photo-1572442388796-11668a67e53d"),
    },
    {
      cat: "Drinks", nameFa: "آب‌پرتقال طبیعی", nameEn: "Fresh Orange Juice",
      descFa: "پرتقال تازه، بدون شکر",
      descEn: "Freshly squeezed, no sugar added",
      price: 4, veg: true, vegan: true, gf: true, image: img("photo-1600271886742-f049cd451bba"),
    },
    {
      cat: "Drinks", nameFa: "موهیتو", nameEn: "Mojito",
      descFa: "نعنا تازه، لیموترش و سودا",
      descEn: "Fresh mint, lime and soda",
      price: 4.5, vegan: true, gf: true, image: img("photo-1551538827-91303cb78561"),
    },
    {
      cat: "Desserts", nameFa: "چیزکیک نیویورکی", nameEn: "New York Cheesecake",
      descFa: "چیزکیک کلاسیک با سس توت‌فرنگی",
      descEn: "Classic cheesecake with strawberry sauce",
      price: 5.5, compareAt: 6.5, veg: true, dairy: true, egg: true, featured: true, tags: "Sweet", image: img("photo-1524351199678-941a58a3df50"),
    },
    {
      cat: "Desserts", nameFa: "براونی گردو", nameEn: "Walnut Brownie",
      descFa: "براونی شکلاتی با گردوی تازه، گرم سرو می‌شود",
      descEn: "Chocolate brownie with fresh walnuts, served warm",
      price: 4.5, veg: true, nuts: true, status: "UNAVAILABLE", image: img("photo-1607920591413-4ec007e70023"),
    },
    {
      cat: "Desserts", nameFa: "بستنی وانیلی", nameEn: "Vanilla Ice Cream",
      descFa: "دو اسکوپ بستنی وانیلی خانگی",
      descEn: "Two scoops of homemade vanilla ice cream",
      price: 3.5, veg: true, dairy: true, egg: true,
      availableFrom: 12, availableTo: 23,
    },
  ];

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    await db.menuItem.create({
      data: {
        tenantId: tenant.id,
        categoryId: cats[it.cat],
        nameFa: it.nameFa,
        nameEn: it.nameEn,
        descFa: it.descFa || null,
        descEn: it.descEn || null,
        basePrice: it.price,
        compareAtPrice: it.compareAt || null,
        currency: "EUR",
        status: it.status || "AVAILABLE",
        featured: Boolean(it.featured),
        tags: it.tags || "",
        imageUrl: it.image || null,
        isVegetarian: Boolean(it.veg),
        isVegan: Boolean(it.vegan),
        isSpicy: Boolean(it.spicy),
        isHalal: Boolean(it.halal),
        isGlutenFree: Boolean(it.gf),
        containsNuts: Boolean(it.nuts),
        containsDairy: Boolean(it.dairy),
        containsEgg: Boolean(it.egg),
        availableFrom: it.cat === "Breakfast" ? 7 : null,
        availableTo: it.cat === "Breakfast" ? 12 : null,
        sortOrder: i,
        variants: it.variants
          ? { create: it.variants.map(([nameFa, nameEn, price], idx) => ({ nameFa, nameEn, price, sortOrder: idx })) }
          : undefined,
        addOns: it.addOns
          ? { create: it.addOns.map(([nameFa, nameEn, price, req], idx) => ({ nameFa, nameEn, price, isRequired: Boolean(req), sortOrder: idx })) }
          : undefined,
      },
    });
  }

  // ── Analytics events: 30 days of plausible traffic ──
  const itemNames = items.map((i) => i.nameEn);
  const types = ["MENU_VIEW", "MENU_VIEW", "MENU_VIEW", "ITEM_VIEW", "ITEM_VIEW", "QR_SCAN", "SEARCH", "LANGUAGE_SWITCH"];
  const events: {
    tenantId: string; type: string; locale: string; itemName?: string | null; category?: string | null;
    device: string; source: string; createdAt: Date;
  }[] = [];
  for (let d = 29; d >= 0; d--) {
    const weekend = [4, 5].includes(new Date(now.getTime() - d * 86400000).getDay());
    const base = weekend ? 26 : 15;
    const count = Math.max(4, Math.round(base + Math.sin(d * 1.7) * 8 + Math.random() * 10));
    for (let e = 0; e < count; e++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const isFa = Math.random() < 0.68;
      const dayDate = new Date(now.getTime() - d * 86400000);
      dayDate.setHours(9 + Math.floor(Math.random() * 14), Math.floor(Math.random() * 60), 0, 0);
      const item = itemNames[Math.floor(Math.random() * itemNames.length)];
      const catDef = items.find((x) => x.nameEn === item);
      events.push({
        tenantId: tenant.id,
        type,
        locale: isFa ? "fa" : "en",
        itemName: type === "ITEM_VIEW" ? item : null,
        category: type === "ITEM_VIEW" ? catDef?.cat || null : null,
        device: Math.random() < 0.82 ? "mobile" : Math.random() < 0.6 ? "desktop" : "tablet",
        source: Math.random() < 0.55 ? "qr" : Math.random() < 0.7 ? "direct" : "social",
        createdAt: dayDate,
      });
    }
  }
  await db.analyticsEvent.createMany({ data: events });

  console.log(`Seed complete:
  - Demo owner: demo@menuhub.app / demo1234
  - Platform admin: admin@menuhub.app / admin1234
  - Tenant: Cafe Nova (cafe-nova) — ${Object.keys(cats).length} categories, ${items.length} items, ${events.length} analytics events`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
