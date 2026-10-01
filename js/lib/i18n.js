// Language: English or Norwegian (bokmål).
// Text in the code is written in English and wrapped in t(). In Norwegian
// mode, t() looks the sentence up in js/lib/nb.js. Missing translations fall
// back to English, so nothing ever breaks. `npm test` lists any that are missing.
import config from "../config.js";
import nb from "./nb.js";

const KEY = "playpro:lang";

function initial() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return saved;
  } catch { /* storage unavailable */ }
  return /^(nb|nn|no)\b/i.test(navigator.language || "") ? "nb" : "en";
}

export const lang = initial();
export const locale = lang === "nb" ? "nb-NO" : "en-GB";
export const tmdbLanguage = lang === "nb" ? "nb-NO" : config.LANGUAGE || "en-US";

export function setLang(value) {
  try { localStorage.setItem(KEY, value); } catch { /* ignore */ }
  location.reload();
}

// Example: t("Rated {n}", { n: 8 })
export function t(text, vars) {
  let s = lang === "nb" ? (nb[text] ?? text) : text;
  if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ""));
  return s;
}

// plural(2, "{n} friend", "{n} friends") -> "2 friends"
export const plural = (n, one, many) => t(n === 1 ? one : many, { n });

// Numbers and dates the local way ("7.8" in English, "7,8" in Norwegian).
export const num = (n, digits = 1) => Number(n).toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
export const date = (iso, opts = { day: "numeric", month: "short", year: "numeric" }) => new Date(iso).toLocaleDateString(locale, opts);
