import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import InstitutionBrand from "../components/InstitutionBrand";
import "../App.css";

export default function LoginScreen() {
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
    <main className="student-shell auth-shell institution-auth" dir="rtl">
      <header className="institution-header">
        <InstitutionBrand compact />
        <span className="institution-header-note">منصة التحدي البرمجي</span>
      </header>

      <section className="institution-auth-panel" aria-labelledby="student-login-title">
        <div className="institution-intro">
          <span className="institution-kicker">مساحة الطالب</span>
          <h1 id="student-login-title">تحدٍّ يبدأ بفكرة، ويكتمل بحل.</h1>
          <p>سجّل دخولك للمشاركة في التحدي البرمجي بكلية تقنية المعلومات، وابدأ رحلتك في حل المسائل بثقة وتركيز.</p>
          <div className="institution-intro-footer">كلية تقنية المعلومات <span aria-hidden="true">•</span> جامعة سرت</div>
        </div>

        <form className="institution-form" onSubmit={handleLogin}>
          <span className="form-kicker">تسجيل الدخول</span>
          <h2>مرحبًا بعودتك</h2>
          <p className="form-description">أدخل بيانات الدخول التي زوّدتك بها إدارة المسابقة.</p>

          <label htmlFor="student-id">رقم القيد</label>
          <input
            id="student-id"
            type="text"
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            placeholder="أدخل رقم القيد"
            autoComplete="username"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "student-login-error" : undefined}
          />

          <label htmlFor="student-password">كلمة المرور</label>
          <div className="password-field">
            <input
              id="student-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="أدخل كلمة المرور"
              autoComplete="current-password"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "student-login-error" : undefined}
            />
            <button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>
              {showPassword ? "إخفاء" : "إظهار"}
            </button>
          </div>

          {error && <p id="student-login-error" className="institution-form-error" role="alert">{error}</p>}

          <button className="institution-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "جارٍ التحقق..." : "الدخول إلى المسابقة"}
          </button>

        </form>
      </section>
      <footer className="institution-page-footer">منصة التحدي البرمجي · جامعة سرت</footer>
    </main>
  );
}
