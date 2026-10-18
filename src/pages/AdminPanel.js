import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import AdminPageHeader from "../components/AdminPageHeader";
import { useThemeMode } from "../theme/useThemeMode";
import "../App.css";

function friendlyAdminMessage(action, data, responseOk) {
  if (!responseOk) {
    return action === "start"
      ? "لم يتم تفعيل المسابقة. تحقق من اتصال الخادم وقاعدة البيانات."
      : "لم يتم إيقاف المسابقة. تحقق من اتصال الخادم.";
  }

  if (data.status !== "success") {
    return action === "start"
      ? "لم يتم تفعيل المسابقة. راجع إعدادات المسابقة."
      : "لم يتم إيقاف المسابقة.";
  }

  if (action === "start") {
    return data.reused
      ? "المسابقة مفعلة مسبقًا، وتم تحديث بياناتها."
      : "تم تفعيل المسابقة وإتاحتها للطلاب.";
  }

  return "تم إيقاف المسابقة وإغلاق مساحة التحدي.";
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const { themeClass } = useThemeMode();
  const adminId = localStorage.getItem("admin-id");
  const adminName = localStorage.getItem("admin-name");
  const [form, setForm] = useState({
    title: "مسابقة البرمجة",
    description: "جلسة تحدي مفعلة من لوحة الإدارة.",
    duration_minutes: 10,
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!adminId) {
      navigate("/admin-login", { replace: true });
    }
  }, [adminId, navigate]);

  const startCompetition = async () => {
    const minutes = Number(form.duration_minutes);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes * 60 > 2147483647) {
      setStatusMessage("أدخل مدة المسابقة بالدقائق كعدد صحيح ضمن النطاق المسموح.");
      return;
    }

    setIsBusy(true);
    setStatusMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/start_competition.php`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ ...form, duration_minutes: String(minutes) }).toString(),
      });
      const data = await response.json();
      setStatusMessage(friendlyAdminMessage("start", data, response.ok));
    } catch {
      setStatusMessage("لم يتم تفعيل المسابقة. الخادم غير متاح حاليًا.");
    } finally {
      setIsBusy(false);
    }
  };

  const stopCompetition = async () => {
    setIsBusy(true);
    setStatusMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/stop_competition.php`, { method: "POST" });
      const data = await response.json();
      setStatusMessage(friendlyAdminMessage("stop", data, response.ok));
    } catch {
      setStatusMessage("لم يتم إيقاف المسابقة. الخادم غير متاح حاليًا.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin-id");
    localStorage.removeItem("admin-name");
    navigate("/admin-login", { replace: true });
  };

  return (
    <main className={`admin-v2-shell institution-admin ${themeClass}`} dir="rtl">
      <AdminPageHeader
        section="نظرة عامة"
        title="لوحة التحكم"
        description={adminName ? `مرحبًا ${adminName}، يمكنك إدارة التحدي والمشاركين من هنا.` : "إدارة التحدي والمشاركين من مكان واحد."}
      >
        <button className="secondary-action" type="button" onClick={handleLogout}>
          تسجيل الخروج
        </button>
      </AdminPageHeader>

      <section className="admin-v2-grid">
        <article className="admin-v2-card">
          <span className="institution-admin-card-label">إعدادات التحدي</span>
          <h2>إدارة المسابقة الحالية</h2>
          <div className="admin-v2-form">
            <label>
              عنوان المسابقة
              <input
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              />
            </label>
            <label>
              الوصف
              <textarea
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                rows="3"
              />
            </label>
            <label>
              المدة بالدقائق
              <input
                type="number"
                min="1"
                step="1"
                value={form.duration_minutes}
                onChange={(event) => setForm((prev) => ({ ...prev, duration_minutes: event.target.value }))}
              />
            </label>
          </div>
          <div className="admin-actions-row">
            <button className="primary-action" onClick={startCompetition} disabled={isBusy}>
              بدء المسابقة
            </button>
            <button className="danger-action" onClick={stopCompetition} disabled={isBusy}>
              إيقاف المسابقة
            </button>
          </div>
          {statusMessage && <p className={statusMessage.startsWith("تم") || statusMessage.startsWith("المسابقة مفعلة") ? "success-text" : "form-error"} role="status">{statusMessage}</p>}
        </article>

        <article className="admin-v2-card admin-shortcuts">
          <span className="institution-admin-card-label">انتقال سريع</span>
          <h2>أقسام الإدارة</h2>
          <button onClick={() => navigate("/admin/students")}>إدارة الطلبة</button>
          <button onClick={() => navigate("/admin-questions")}>إدارة الأسئلة</button>
          <button onClick={() => navigate("/results")}>النتائج</button>
          <button onClick={() => navigate("/reports")}>تقارير المسابقات</button>
        </article>
      </section>
    </main>
  );
}
