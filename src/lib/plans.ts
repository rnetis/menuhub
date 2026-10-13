// Subscription plans & entitlements per PRD §49-50
export type Plan = "FREE" | "STARTER" | "BUSINESS" | "ENTERPRISE";

export interface Entitlements {
  maxCategories: number | null; // null = unlimited
  maxItems: number | null;
  maxBranches: number;
  maxTeam: number;
  customBranding: boolean;
  advancedThemes: boolean;
  analytics: boolean;
  removePlatformBranding: boolean;
  scheduledAvailability: boolean;
  importExport: boolean;
}

export const PLANS: Record<Plan, { name: string; nameFa: string; price: number; entitlements: Entitlements; features: string[] }> = {
  FREE: {
    name: "Free",
    nameFa: "رایگان",
    price: 0,
    entitlements: {
      maxCategories: 3,
      maxItems: 10,
      maxBranches: 1,
      maxTeam: 1,
      customBranding: false,
      advancedThemes: false,
      analytics: true,
      removePlatformBranding: false,
      scheduledAvailability: false,
      importExport: false,
    },
    features: ["1 branch", "3 categories · 10 items", "QR code", "Basic themes", "Basic analytics", "Platform branding"],
  },
  STARTER: {
    name: "Starter",
    nameFa: "پایه",
    price: 9,
    entitlements: {
      maxCategories: null,
      maxItems: null,
      maxBranches: 1,
      maxTeam: 3,
      customBranding: true,
      advancedThemes: false,
      analytics: true,
      removePlatformBranding: true,
      scheduledAvailability: true,
      importExport: true,
    },
    features: ["Unlimited items", "Custom branding", "All base themes", "Full analytics", "Remove platform branding", "CSV import/export"],
  },
  BUSINESS: {
    name: "Business",
    nameFa: "کسب‌وکار",
    price: 24,
    entitlements: {
      maxCategories: null,
      maxItems: null,
      maxBranches: 10,
      maxTeam: 10,
      customBranding: true,
      advancedThemes: true,
      analytics: true,
      removePlatformBranding: true,
      scheduledAvailability: true,
      importExport: true,
    },
    features: ["Multiple branches", "Team members", "Advanced themes", "Scheduled availability", "Priority support", "Everything in Starter"],
  },
  ENTERPRISE: {
    name: "Enterprise",
    nameFa: "سازمانی",
    price: 79,
    entitlements: {
      maxCategories: null,
      maxItems: null,
      maxBranches: 100,
      maxTeam: 50,
      customBranding: true,
      advancedThemes: true,
      analytics: true,
      removePlatformBranding: true,
      scheduledAvailability: true,
      importExport: true,
    },
    features: ["Unlimited branches", "Custom deployment", "API access", "Advanced RBAC", "SLA & dedicated support"],
  },
};

export function entitlementsFor(plan: string): Entitlements {
  return (PLANS[plan as Plan] ?? PLANS.FREE).entitlements;
}

export const THEME_IDS_BASE = ["classic", "modern", "minimal", "dark"];
export const THEME_IDS_ADVANCED = ["luxury", "cafe", "fastfood"];

export function availableThemes(plan: string): string[] {
  const ent = entitlementsFor(plan);
  return ent.advancedThemes ? [...THEME_IDS_BASE, ...THEME_IDS_ADVANCED] : THEME_IDS_BASE;
}
