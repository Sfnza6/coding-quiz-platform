import { useLocale } from "../i18n/LocaleContext";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  return (
    <div className="language-switcher" role="group" aria-label={locale === "ar" ? "لغة المنصة" : "Platform language"} dir="ltr">
      <button type="button" lang="ar" aria-pressed={locale === "ar"} onClick={() => setLocale("ar")}>العربية</button>
      <button type="button" lang="en" aria-pressed={locale === "en"} onClick={() => setLocale("en")}>English</button>
    </div>
  );
}
