import collegeLogo from "../assets/college-logo.jpg";

export default function InstitutionBrand({ compact = false }) {
  return (
    <div className="institution-brand">
      <img
        className="institution-logo"
        src={collegeLogo}
        alt="شعار كلية تقنية المعلومات بجامعة سرت"
      />
      <div>
        <strong>جامعة سرت</strong>
        <span>
          كلية تقنية المعلومات{compact ? "" : " · منصة التحدي البرمجي"}
        </span>
      </div>
    </div>
  );
}
