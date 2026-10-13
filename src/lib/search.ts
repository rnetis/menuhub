// Persian/Arabic text normalization per PRD §28
export function normalizePersian(input: string): string {
  if (!input) return "";
  return input
    // Arabic Yeh/Kaf → Persian forms
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ى/g, "ی")
    // ZWNJ / ZWJ / LRM / RLM
    .replace(/[\u200B-\u200F\u202A-\u202E]/g, " ")
    // Arabic diacritics
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    // Arabic-Indic & Extended digits → Latin
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    // collapse whitespace
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function matchesSearch(haystacks: (string | null | undefined)[], query: string): boolean {
  const q = normalizePersian(query);
  if (!q) return true;
  return haystacks.some((h) => h && normalizePersian(h).includes(q));
}
