import { tr, useLocale } from "../i18n/LocaleContext";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import InstitutionBrand from "../components/InstitutionBrand";
import "../App.css";

export default function LoginScreen() {
  const { direction } = useLocale();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    if (!studentId.trim() || !password.trim()) {
      setError("يرجى إدخال رقم القيد وكلمة المرور.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ studentId: studentId.trim(), password });
      navigate(location.state?.from || "/home", { replace: true });
    } catch (err) {
      setError(
        err.status === 401
          ? "بيانات الدخول غير صحيحة."
          : "تعذر الاتصال بالخادم. تأكد أن الخدمة تعمل ثم حاول مرة أخرى."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="student-shell auth-shell institution-auth" dir={direction}>
      <header className="institution-header">
        <InstitutionBrand compact />
        <span className="institution-header-note">{tr("منصة التحدي البرمجي")}</span>
      </header>

      <section className="institution-auth-panel" aria-labelledby="student-login-title">
        <div className="institution-intro">
          <span className="institution-kicker">{tr("مساحة الطالب")}</span>
          <h1 id="student-login-title">{tr("تحدٍّ يبدأ بفكرة، ويكتمل بحل.")}</h1>
          <p>{tr("سجّل دخولك للمشاركة في التحدي البرمجي بكلية تقنية المعلومات، وابدأ رحلتك في حل المسائل بثقة وتركيز.")}</p>
          <div className="institution-intro-footer">{tr("كلية تقنية المعلومات")} <span aria-hidden="true">•</span> {tr("جامعة سرت")}</div>
        </div>

        <form className="institution-form" onSubmit={handleLogin}>
          <span className="form-kicker">{tr("تسجيل الدخول")}</span>
          <h2>{tr("مرحبًا بعودتك")}</h2>
          <p className="form-description">{tr("أدخل بيانات الدخول التي زوّدتك بها إدارة المسابقة.")}</p>

          <label htmlFor="student-id">{tr("رقم القيد")}</label>
          <input
            id="student-id"
            type="text"
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            placeholder={tr("أدخل رقم القيد")}
            autoComplete="username"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "student-login-error" : undefined}
          />

          <label htmlFor="student-password">{tr("كلمة المرور")}</label>
          <div className="password-field">
            <input
              id="student-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={tr("أدخل كلمة المرور")}
              autoComplete="current-password"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "student-login-error" : undefined}
            />
            <button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? tr("إخفاء كلمة المرور") : tr("إظهار كلمة المرور")}>
              {showPassword ? tr("إخفاء") : tr("إظهار")}
            </button>
          </div>

          {error && <p id="student-login-error" className="institution-form-error" role="alert">{tr(error)}</p>}

          <button className="institution-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? tr("جارٍ التحقق...") : tr("الدخول إلى المسابقة")}
          </button>

        </form>
      </section>
      <footer className="institution-page-footer">{tr("منصة التحدي البرمجي · جامعة سرت")}</footer>
    </main>
  );
}
