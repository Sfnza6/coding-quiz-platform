import { createContext, useContext, useEffect, useState } from "react";
import { english } from "./translations";

const STORAGE_KEY = "coding-quiz-locale";
const LocaleContext = createContext(null);
let activeLocale = "ar";

function initialLocale() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "ar";
  } catch {
    return "ar";
  }
}

export function tr(text) {
  if (activeLocale !== "en" || typeof text !== "string") return text;
  return english[text] || text;
}

export function LocaleProvider({ children }) {
  const [locale, setLocale] = useState(initialLocale);
  activeLocale = locale;

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    document.title = locale === "ar"
      ? "التحدي البرمجي | كلية تقنية المعلومات - جامعة سرت"
      : "Programming Competition | Faculty of Information Technology - University of Sirte";
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = locale === "ar"
        ? "منصة التحدي البرمجي لكلية تقنية المعلومات بجامعة سرت"
        : "Programming competition platform for the Faculty of Information Technology at the University of Sirte";
    }
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // The language still works for this session when storage is unavailable.
    }
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, direction: locale === "ar" ? "rtl" : "ltr", setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside LocaleProvider");
  return context;
}
