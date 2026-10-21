import { tr, useLocale } from "../i18n/LocaleContext";
import { NavLink, Navigate, Outlet } from "react-router-dom";

const navigationGroups = [
  {
    title: "إدارة المسابقة",
    links: [
      { label: "لوحة التحكم", to: "/admin", end: true },
      { label: "إدارة الطلبة", to: "/admin/students" },
      { label: "إضافة طالب", to: "/add-student" },
      { label: "إدارة الأسئلة", to: "/admin-questions" },
    ],
  },
  {
    title: "المتابعة والتقارير",
    links: [
      { label: "النتائج الحالية", to: "/results" },
      { label: "تقارير المسابقات", to: "/reports" },
    ],
  },
];

export default function AdminLayout() {
  const { direction } = useLocale();
  if (!localStorage.getItem("admin-id") || !sessionStorage.getItem("admin-token")) {
    return <Navigate to="/admin-login" replace />;
  }

  return (
    <div className="admin-layout" dir={direction}>
      <aside className="admin-sidebar" aria-label={tr("قائمة الإدارة")}>
        <div className="admin-sidebar-heading">
          <span>{tr("مساحة الإدارة")}</span>
          <strong>{tr("لوحة التحدي")}</strong>
        </div>
        <nav className="admin-sidebar-nav" aria-label={tr("التنقل بين صفحات الإدارة")}>
          {navigationGroups.map((group) => (
            <div className="admin-sidebar-group" key={group.title}>
              <span className="admin-sidebar-group-title">{tr(group.title)}</span>
              {group.links.map(({ label, to, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) => `admin-sidebar-link${isActive ? " is-active" : ""}`}
                >
                  {tr(label)}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="admin-sidebar-footer">{tr("كلية تقنية المعلومات · جامعة سرت")}</div>
      </aside>
      <div className="admin-layout-content">
        <Outlet />
      </div>
    </div>
  );
}
