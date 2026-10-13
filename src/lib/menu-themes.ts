// Public menu theme tokens per PRD §18-19 (7 predefined themes)
export interface MenuTheme {
  id: string;
  name: string;
  nameFa: string;
  bg: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  chipBg: string;
  chipActiveText: string;
  headerOverlay: string; // gradient over cover
  fontClass: string;
  swatch: string[]; // for picker preview
}

export const MENU_THEMES: Record<string, MenuTheme> = {
  classic: {
    id: "classic", name: "Classic", nameFa: "کلاسیک",
    bg: "#FAF7F1", surface: "#FFFFFF", text: "#292524", muted: "#79716B",
    border: "#E7E0D6", chipBg: "#F1EBE2", chipActiveText: "#FFFFFF",
    headerOverlay: "linear-gradient(180deg, rgba(20,20,19,0.05) 0%, rgba(20,20,19,0.55) 100%)",
    fontClass: "",
    swatch: ["#FAF7F1", "#0F766E", "#F59E0B"],
  },
  modern: {
    id: "modern", name: "Modern", nameFa: "مدرن",
    bg: "#F8FAF9", surface: "#FFFFFF", text: "#111827", muted: "#6B7280",
    border: "#E5E7EB", chipBg: "#F3F4F6", chipActiveText: "#FFFFFF",
    headerOverlay: "linear-gradient(180deg, rgba(15,23,42,0.02) 0%, rgba(15,23,42,0.5) 100%)",
    fontClass: "",
    swatch: ["#F8FAF9", "#111827", "#10B981"],
  },
  minimal: {
    id: "minimal", name: "Minimal", nameFa: "مینیمال",
    bg: "#FFFFFF", surface: "#FFFFFF", text: "#1C1C1C", muted: "#8A8A8A",
    border: "#ECECEC", chipBg: "#F6F6F6", chipActiveText: "#1C1C1C",
    headerOverlay: "linear-gradient(180deg, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.35) 100%)",
    fontClass: "",
    swatch: ["#FFFFFF", "#1C1C1C", "#D4D4D4"],
  },
  dark: {
    id: "dark", name: "Dark", nameFa: "تیره",
    bg: "#0C0A09", surface: "#1C1917", text: "#FAFAF9", muted: "#A8A29E",
    border: "#292524", chipBg: "#292524", chipActiveText: "#0C0A09",
    headerOverlay: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.75) 100%)",
    fontClass: "",
    swatch: ["#0C0A09", "#FAFAF9", "#F59E0B"],
  },
  luxury: {
    id: "luxury", name: "Luxury", nameFa: "لاکچری",
    bg: "#171310", surface: "#211B16", text: "#F5EFE4", muted: "#B3A595",
    border: "#39302A", chipBg: "#2C241E", chipActiveText: "#171310",
    headerOverlay: "linear-gradient(180deg, rgba(23,19,16,0.05) 0%, rgba(23,19,16,0.8) 100%)",
    fontClass: "",
    swatch: ["#171310", "#D4AF37", "#F5EFE4"],
  },
  cafe: {
    id: "cafe", name: "Cafe", nameFa: "کافه",
    bg: "#F6F1EA", surface: "#FFFBF4", text: "#3D2B1F", muted: "#94796A",
    border: "#E8DCCC", chipBg: "#EFE5D6", chipActiveText: "#FFFBF4",
    headerOverlay: "linear-gradient(180deg, rgba(61,43,31,0.03) 0%, rgba(61,43,31,0.55) 100%)",
    fontClass: "",
    swatch: ["#F6F1EA", "#7C4A2D", "#C98A4B"],
  },
  fastfood: {
    id: "fastfood", name: "Fast Food", nameFa: "فست‌فود",
    bg: "#FFF7EA", surface: "#FFFFFF", text: "#231303", muted: "#8C7355",
    border: "#F3E3C8", chipBg: "#FDEECB", chipActiveText: "#231303",
    headerOverlay: "linear-gradient(180deg, rgba(35,19,3,0.05) 0%, rgba(35,19,3,0.55) 100%)",
    fontClass: "",
    swatch: ["#FFF7EA", "#E23D28", "#FFC244"],
  },
};

export function themeOf(id: string): MenuTheme {
  return MENU_THEMES[id] || MENU_THEMES.classic;
}

export const RADIUS_MAP: Record<string, string> = {
  none: "0px",
  sm: "6px",
  md: "12px",
  lg: "18px",
  xl: "26px",
};
