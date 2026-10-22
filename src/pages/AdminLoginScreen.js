import { readApiResponse, userError } from "../services/apiErrors";
import { tr, useLocale } from "../i18n/LocaleContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import InstitutionBrand from "../components/InstitutionBrand";
import { useThemeMode } from "../theme/useThemeMode";
import "../App.css";

export default function AdminLoginScreen() {
  const { direction } = useLocale();
  const [adminId, setAdminId] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { themeClass } = useThemeMode();

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    if (!adminId.trim()) {
      setError("يرجى إدخال رقم المسؤول.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/check_admin.php`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ admin_id: adminId.trim() }).toString(),
      });
      const data = await readApiResponse(response);

      if (response.ok && data.status === "success") {
        localStorage.setItem("admin-id", adminId.trim());
        localStorage.setItem("admin-name", data.admin_name);
        sessionStorage.setItem("admin-token", data.token);
        navigate("/admin", { replace: true });
      } else {
        setError("بيانات المسؤول غير صحيحة.");
      }
    } catch (error) {
      setError(userError(error, "الخدمة غير متاحة حاليًا. حاول مرة أخرى بعد قليل."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={`admin-v2-shell auth-shell institution-auth ${themeClass}`} dir={direction}>
      <header className="institution-header">
        <InstitutionBrand compact />
        <span className="institution-header-note">{tr("منصة التحدي البرمجي")}</span>
      </header>

      <section className="institution-auth-panel" aria-labelledby="admin-login-title">
        <div className="institution-intro">
          <span className="institution-kicker">{tr("مساحة الإدارة")}</span>
          <h1 id="admin-login-title">{tr("إدارة منظّمة لتحدٍّ أفضل.")}</h1>
          <p>{tr("تابع المشاركين والأسئلة ونتائج التحدي من مساحة عمل مخصصة لفريق التنظيم بكلية تقنية المعلومات.")}</p>
          <div className="institution-intro-footer">{tr("كلية تقنية المعلومات")} <span aria-hidden="true">•</span> {tr("جامعة سرت")}</div>
        </div>

        <form className="institution-form" onSubmit={handleLogin}>
          <span className="form-kicker">{tr("دخول الإدارة")}</span>
          <h2>{tr("لوحة التحكم")}</h2>
          <p className="form-description">{tr("أدخل رقم المسؤول المخصص لك للمتابعة.")}</p>

          <label htmlFor="admin-id">{tr("رقم المسؤول")}</label>
          <input
            id="admin-id"
            type="text"
            value={adminId}
            onChange={(event) => setAdminId(event.target.value)}
            placeholder={tr("أدخل رقم المسؤول")}
            autoComplete="username"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "admin-login-error" : undefined}
          />

          {error && <p id="admin-login-error" className="institution-form-error" role="alert">{tr(error)}</p>}

          <button className="institution-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? tr("جارٍ التحقق...") : tr("الدخول إلى لوحة التحكم")}
          </button>

        </form>
      </section>
      <footer className="institution-page-footer">{tr("منصة التحدي البرمجي · جامعة سرت")}</footer>
    </main>
  );
}
