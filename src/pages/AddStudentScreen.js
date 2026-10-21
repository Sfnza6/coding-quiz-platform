import { tr, useLocale } from "../i18n/LocaleContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import AdminPageHeader from "../components/AdminPageHeader";
import { useThemeMode } from "../theme/useThemeMode";
import "../App.css";

export default function AddStudentScreen() {
  const { direction } = useLocale();
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { themeClass } = useThemeMode();

  useEffect(() => {
    if (!localStorage.getItem("admin-id")) {
      navigate("/admin-login", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setErrorMessage("");
    setGeneratedPassword("");

    try {
      const response = await fetch(`${API_BASE_URL}/add_student.php`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          student_id: studentId.trim(),
          student_name: studentName.trim(),
        }).toString(),
      });
      const data = await response.json();

      if (response.ok && data.status === "success") {
        setMessage("تمت إضافة الطالب بنجاح. احفظ كلمة المرور وسلمها للطالب.");
        setGeneratedPassword(data.generated_password || "");
        setStudentId("");
        setStudentName("");
      } else if (response.status === 409) {
        setErrorMessage("رقم القيد موجود مسبقًا. استخدم رقم قيد مختلف.");
      } else {
        setErrorMessage("لم تتم إضافة الطالب. تأكد من إدخال الاسم ورقم القيد.");
      }
    } catch {
      setErrorMessage("الخدمة غير متاحة حاليًا. حاول مرة أخرى بعد قليل.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={`admin-v2-shell institution-admin ${themeClass}`} dir={direction}>
      <AdminPageHeader section={tr("المشاركون")} title={tr("إضافة طالب جديد")} description={tr("أدخل بيانات الطالب لإنشاء حساب مشاركة في التحدي.")}>
          <button className="secondary-action" onClick={() => navigate("/admin/students")}>
            {tr("قائمة الطلبة")}
          </button>
          <button className="secondary-action" onClick={() => navigate("/admin")}>
            {tr("لوحة التحكم")}
          </button>
      </AdminPageHeader>

      <section className="admin-v2-card institution-admin-narrow-card">
        <span className="institution-admin-card-label">{tr("بيانات الطالب")}</span>
        <h2>{tr("معلومات الحساب")}</h2>
        <form className="admin-v2-form" onSubmit={handleSubmit}>
          <label>
            {tr("اسم الطالب")}
            <input
              type="text"
              value={studentName}
              onChange={(event) => setStudentName(event.target.value)}
              required
            />
          </label>

          <label>
            {tr("رقم القيد")}
            <input
              type="text"
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              required
              dir="ltr"
            />
          </label>

          <button className="primary-action" type="submit" disabled={isSubmitting}>
            {isSubmitting ? tr("جاري الإضافة...") : tr("إضافة وتوليد كلمة مرور")}
          </button>
        </form>

        {message && <p className="success-text">{tr(message)}</p>}
        {errorMessage && <p className="form-error">{tr(errorMessage)}</p>}
        {generatedPassword && (
          <div className="credential-box">
            <span>{tr("كلمة المرور المولدة")}</span>
            <strong>{generatedPassword}</strong>
          </div>
        )}
      </section>
    </main>
  );
}
