import { readApiResponse } from "../services/apiErrors";
import { tr, useLocale } from "../i18n/LocaleContext";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const { direction } = useLocale();
  const navigate = useNavigate();
  const { themeClass } = useThemeMode();
  const adminId = localStorage.getItem("admin-id");
  const adminName = localStorage.getItem("admin-name");
  const [form, setForm] = useState({
    title: tr("مسابقة البرمجة"),
    description: tr("جلسة تحدي مفعلة من لوحة الإدارة."),
    duration_minutes: 10,
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [competitionStarted, setCompetitionStarted] = useState(null);
  const [statusError, setStatusError] = useState(false);
  const statusRequestRef = useRef(0);
  const isBusyRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!adminId) {
      navigate("/admin-login", { replace: true });
    }
  }, [adminId, navigate]);

  const loadCompetitionStatus = useCallback(async () => {
    if (isBusyRef.current) return;
    const requestId = ++statusRequestRef.current;

    try {
      const response = await fetch(`${API_BASE_URL}/check_competition.php`, { cache: "no-store" });
      if (!response.ok) throw new Error("Competition status unavailable");
      const data = await readApiResponse(response);
      if (typeof data.is_started !== "boolean") throw new Error("Invalid competition status");
      if (!mountedRef.current || requestId !== statusRequestRef.current) return;
      setCompetitionStarted(data.is_started);
      setStatusError(false);
    } catch (error) {
      if (!mountedRef.current || requestId !== statusRequestRef.current) return;
      setCompetitionStarted(null);
      setStatusError(true);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadCompetitionStatus();
    const intervalId = window.setInterval(loadCompetitionStatus, 4000);
    return () => {
      mountedRef.current = false;
      statusRequestRef.current += 1;
      window.clearInterval(intervalId);
    };
  }, [loadCompetitionStatus]);

  const startCompetition = async () => {
    const minutes = Number(form.duration_minutes);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes * 60 > 2147483647) {
      setStatusMessage("أدخل مدة المسابقة بالدقائق كعدد صحيح ضمن النطاق المسموح.");
      return;
    }

    isBusyRef.current = true;
    statusRequestRef.current += 1;
    setIsBusy(true);
    setStatusMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/start_competition.php`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ ...form, duration_minutes: String(minutes) }).toString(),
      });
      const data = await readApiResponse(response);
      setStatusMessage(friendlyAdminMessage("start", data, response.ok));
      if (response.ok && data.status === "success") {
        setCompetitionStarted(true);
        setStatusError(false);
      } else {
        setCompetitionStarted(null);
      }
    } catch (error) {
      setStatusMessage("لم يتم تفعيل المسابقة. الخادم غير متاح حاليًا.");
      setCompetitionStarted(null);
    } finally {
      isBusyRef.current = false;
      setIsBusy(false);
      loadCompetitionStatus();
    }
  };

  const stopCompetition = async () => {
    isBusyRef.current = true;
    statusRequestRef.current += 1;
    setIsBusy(true);
    setStatusMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/stop_competition.php`, { method: "POST" });
      const data = await readApiResponse(response);
      setStatusMessage(friendlyAdminMessage("stop", data, response.ok));
      if (response.ok && data.status === "success") {
        setCompetitionStarted(false);
        setStatusError(false);
      } else {
        setCompetitionStarted(null);
      }
    } catch (error) {
      setStatusMessage("لم يتم إيقاف المسابقة. الخادم غير متاح حاليًا.");
      setCompetitionStarted(null);
    } finally {
      isBusyRef.current = false;
      setIsBusy(false);
      loadCompetitionStatus();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin-id");
    localStorage.removeItem("admin-name");
    sessionStorage.removeItem("admin-token");
    navigate("/admin-login", { replace: true });
  };

  return (
    <main className={`admin-v2-shell institution-admin ${themeClass}`} dir={direction}>
      <AdminPageHeader
        section={tr("نظرة عامة")}
        title={tr("لوحة التحكم")}
        description={adminName ? `${tr("مرحبًا،")} ${adminName}${tr("، يمكنك إدارة التحدي والمشاركين من هنا.")}` : tr("إدارة التحدي والمشاركين من مكان واحد.")}
      >
        <button className="secondary-action" type="button" onClick={handleLogout}>
          {tr("تسجيل الخروج")}
        </button>
      </AdminPageHeader>

      <section className="admin-v2-grid admin-dashboard-grid">
        <article className="admin-v2-card">
          <span className="institution-admin-card-label">{tr("إعدادات التحدي")}</span>
          <h2>{tr("إدارة المسابقة الحالية")}</h2>
          <div className="admin-competition-state" role="status">
            <span className={`live-status${competitionStarted === true ? " is-live" : ""}`}>
              {competitionStarted === null
                ? statusError ? tr("تعذر جلب حالة المسابقة") : tr("جارٍ التحقق من حالة المسابقة")
                : competitionStarted ? tr("المسابقة بادية الآن") : tr("المسابقة متوقفة")}
            </span>
            {statusError && (
              <button className="secondary-action" type="button" onClick={loadCompetitionStatus}>
                {tr("إعادة المحاولة")}
              </button>
            )}
          </div>
          <div className="admin-v2-form">
            <label>
              {tr("عنوان المسابقة")}
              <input
                value={form.title}
                disabled={competitionStarted !== false || isBusy}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              />
            </label>
            <label>
              {tr("الوصف")}
              <textarea
                value={form.description}
                disabled={competitionStarted !== false || isBusy}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                rows="3"
              />
            </label>
            <label>
              {tr("المدة بالدقائق")}
              <input
                type="number"
                min="1"
                step="1"
                value={form.duration_minutes}
                disabled={competitionStarted !== false || isBusy}
                onChange={(event) => setForm((prev) => ({ ...prev, duration_minutes: event.target.value }))}
              />
            </label>
          </div>
          <div className="admin-actions-row">
            <button className="primary-action" onClick={startCompetition} disabled={isBusy || competitionStarted !== false}>
              {tr("بدء المسابقة")}
            </button>
            <button className="danger-action" onClick={stopCompetition} disabled={isBusy || competitionStarted !== true}>
              {tr("إيقاف المسابقة")}
            </button>
          </div>
          {statusMessage && <p className={statusMessage.startsWith("تم") || statusMessage.startsWith("المسابقة مفعلة") ? "success-text" : "form-error"} role="status">{tr(statusMessage)}</p>}
        </article>

      </section>
    </main>
  );
}
