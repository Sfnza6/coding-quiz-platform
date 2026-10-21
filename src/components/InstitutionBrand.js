import { tr, useLocale } from "../i18n/LocaleContext";
import collegeLogo from "../assets/college-logo.jpg";
import LanguageSwitcher from "./LanguageSwitcher";

export default function InstitutionBrand({ compact = false }) {
  useLocale();
  return (
    <div className="institution-brand">
      <img
        className="institution-logo"
        src={collegeLogo}
        alt={tr("شعار كلية تقنية المعلومات بجامعة سرت")}
      />
      <div>
        <strong>{tr("جامعة سرت")}</strong>
        <span>
          {tr("كلية تقنية المعلومات")}{compact ? "" : tr(" · منصة التحدي البرمجي")}
        </span>
      </div>
      <LanguageSwitcher />
    </div>
  );
}
