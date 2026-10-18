import InstitutionBrand from "./InstitutionBrand";

export default function AdminPageHeader({ section, title, description, children }) {
  return (
    <header className="institution-admin-header">
      <div className="institution-admin-brand-row">
        <InstitutionBrand />
        <span className="institution-admin-brand-label">مساحة الإدارة</span>
      </div>
      <div className="institution-admin-heading-row">
        <div>
          <span className="institution-admin-kicker">{section}</span>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
        {children && <div className="admin-header-actions">{children}</div>}
      </div>
    </header>
  );
}
