// Role-Based Access Control per PRD §38
export type Role = "OWNER" | "ADMIN" | "MANAGER" | "EDITOR" | "VIEWER";

export const ROLE_RANK: Record<Role, number> = {
  OWNER: 4,
  ADMIN: 3,
  MANAGER: 2,
  EDITOR: 1,
  VIEWER: 0,
};

export type Permission =
  | "menu.edit" // categories, items, variants, add-ons
  | "menu.view"
  | "branding.edit"
  | "analytics.view"
  | "team.manage"
  | "billing.manage"
  | "tenant.delete"
  | "settings.edit"
  | "branches.edit"
  | "import.export";

const PERMISSIONS: Record<Permission, Role[]> = {
  "menu.view": ["OWNER", "ADMIN", "MANAGER", "EDITOR", "VIEWER"],
  "menu.edit": ["OWNER", "ADMIN", "MANAGER", "EDITOR"],
  "branding.edit": ["OWNER", "ADMIN", "MANAGER"],
  "analytics.view": ["OWNER", "ADMIN", "MANAGER", "EDITOR", "VIEWER"],
  "team.manage": ["OWNER", "ADMIN"],
  "billing.manage": ["OWNER"],
  "tenant.delete": ["OWNER"],
  "settings.edit": ["OWNER", "ADMIN", "MANAGER"],
  "branches.edit": ["OWNER", "ADMIN", "MANAGER"],
  "import.export": ["OWNER", "ADMIN", "MANAGER", "EDITOR"],
};

export function can(role: Role | string | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  const allowed = PERMISSIONS[permission];
  return allowed.includes(role as Role);
}

export function atLeast(role: Role | string | null | undefined, min: Role): boolean {
  if (!role) return false;
  return ROLE_RANK[role as Role] >= ROLE_RANK[min];
}

export const ROLE_LABELS: Record<Role, { en: string; fa: string }> = {
  OWNER: { en: "Owner", fa: "مالک" },
  ADMIN: { en: "Admin", fa: "مدیر" },
  MANAGER: { en: "Manager", fa: "مدیر رستوران" },
  EDITOR: { en: "Editor", fa: "ویرایشگر" },
  VIEWER: { en: "Viewer", fa: "بیننده" },
};
