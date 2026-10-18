import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import InstitutionBrand from "../components/InstitutionBrand";
import { useThemeMode } from "../theme/useThemeMode";
import "../App.css";

export default function AdminLoginScreen() {
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
      const data = await response.json();

      if (response.ok && data.status === "success") {
        localStorage.setItem("admin-id", adminId.trim());
        localStorage.setItem("admin-name", data.admin_name);
        navigate("/admin", { replace: true });
      } else {
        setError("بيانات المسؤول غير صحيحة.");
      }
    } catch {
      setError("الخدمة غير متاحة حاليًا. حاول مرة أخرى بعد قليل.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={`admin-v2-shell auth-shell institution-auth ${themeClass}`} dir="rtl">
      <header className="institution-header">
        <InstitutionBrand compact />
        <span className="institution-header-note">منصة التحدي البرمجي</span>
      </header>

      <section className="institution-auth-panel" aria-labelledby="admin-login-title">
        <div className="institution-intro">
          <span className="institution-kicker">مساحة الإدارة</span>
          <h1 id="admin-login-title">إدارة منظّمة لتحدٍّ أفضل.</h1>
          <p>تابع المشاركين والأسئلة ونتائج التحدي من مساحة عمل مخصصة لفريق التنظيم بكلية تقنية المعلومات.</p>
          <div className="institution-intro-footer">كلية تقنية المعلومات <span aria-hidden="true">•</span> جامعة سرت</div>
        </div>

        <form className="institution-form" onSubmit={handleLogin}>
          <span className="form-kicker">دخول الإدارة</span>
          <h2>لوحة التحكم</h2>
          <p className="form-description">أدخل رقم المسؤول المخصص لك للمتابعة.</p>

          <label htmlFor="admin-id">رقم المسؤول</label>
          <input
            id="admin-id"
            type="text"
            value={adminId}
            onChange={(event) => setAdminId(event.target.value)}
            placeholder="أدخل رقم المسؤول"
            autoComplete="username"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "admin-login-error" : undefined}
          />

          {error && <p id="admin-login-error" className="institution-form-error" role="alert">{error}</p>}

          <button className="institution-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "جارٍ التحقق..." : "الدخول إلى لوحة التحكم"}
          </button>

        </form>
      </section>
      <footer className="institution-page-footer">منصة التحدي البرمجي · جامعة سرت</footer>
    </main>
  );
}
