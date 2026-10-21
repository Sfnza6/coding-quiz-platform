import { tr, useLocale } from "../i18n/LocaleContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import AdminPageHeader from "../components/AdminPageHeader";
import ReportPdfPreview from "../components/ReportPdfPreview";
import { useThemeMode } from "../theme/useThemeMode";
import "../App.css";

export default function CompetitionReports() {
  const { direction } = useLocale();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [printSession, setPrintSession] = useState(null);
  const navigate = useNavigate();
  const { themeClass } = useThemeMode();

  const handleNamesSaved = (sessionId, names) => {
    setReports((previous) => previous.map((session) => session.id !== sessionId ? session : ({
      ...session,
      results: session.results.map((row) => ({ ...row, english_name: names[row.student_id].trim() })),
    })));
  };

  useEffect(() => {
    if (!localStorage.getItem("admin-id")) {
      navigate("/admin-login", { replace: true });
      return;
    }

    fetch(`${API_BASE_URL}/get_competition_reports.php`, {
      headers: { Authorization: `Bearer ${sessionStorage.getItem("admin-token") || ""}` },
    })
      .then((res) => {
        if (res.status === 401) {
          sessionStorage.removeItem("admin-token");
          navigate("/admin-login", { replace: true });
          throw new Error("Unauthorized");
        }
        if (!res.ok) throw new Error("Request failed");
        return res.json();
      })
      .then((data) => {
        setReports(data.reports || []);
        setError("");
      })
      .catch(() => {
        setReports([]);
        setError("تعذر تحميل التقارير. تأكد أن الخادم يعمل.");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  return (
    <main className={`admin-v2-shell institution-admin ${themeClass}`} dir={direction}>
      <AdminPageHeader section={tr("الأرشيف")} title={tr("تقارير المسابقات")} description={tr("راجع نتائج التحديات المكتملة وتفاصيل كل جلسة.")}>
          <button className="secondary-action" onClick={() => navigate("/admin")}>
            {tr("لوحة التحكم")}
          </button>
          <button className="secondary-action" onClick={() => navigate("/results")}>
            {tr("النتائج الحالية")}
          </button>
      </AdminPageHeader>

      <section className="reports-stack">
        {loading ? (
          <article className="admin-v2-card">
            <h3>{tr("جاري تحميل التقارير...")}</h3>
          </article>
        ) : error ? (
          <article className="admin-v2-card">
            <h3>{tr(error)}</h3>
          </article>
        ) : reports.length === 0 ? (
          <article className="admin-v2-card">
            <h3>{tr("لا توجد تقارير لمسابقات مغلقة حتى الآن.")}</h3>
          </article>
        ) : (
          reports.map((session) => (
            <article className="admin-v2-card report-card" key={session.id}>
              <div className="report-heading">
                <div>
                  <p className="eyebrow">{tr("الجلسة رقم")} {session.id}</p>
                  <h2>{tr("مسابقة رقم")} {session.id}</h2>
                  <button className="secondary-action report-pdf-trigger" type="button" onClick={() => setPrintSession(session)}>
                    {tr("طباعة تقرير PDF")}
                  </button>
                </div>
                <dl className="report-meta">
                  <div>
                    <dt>{tr("البداية")}</dt>
                    <dd>{session.start_time}</dd>
                  </div>
                  <div>
                    <dt>{tr("النهاية")}</dt>
                    <dd>{session.end_time}</dd>
                  </div>
                </dl>
              </div>
              <p className="muted-text">{tr("الترتيب حسب الحلول المقبولة ثم زمن الجزاء؛")} {session.penalty_per_wrong_minutes} {tr("دقيقة لكل محاولة خاطئة قبل القبول.")}</p>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>{tr("الترتيب")}</th>
                      <th>{tr("رقم القيد")}</th>
                      <th>{tr("الاسم")}</th>
                      <th>{tr("الحلول المقبولة")}</th>
                      <th>{tr("إجمالي المحاولات")}</th>
                      <th>{tr("الأخطاء المحتسبة")}</th>
                      <th>{tr("زمن الجزاء (دقيقة)")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {session.results.map((row) => (
                      <tr key={`${session.id}-${row.student_id}`}>
                        <td>{row.rank}</td>
                        <td>{row.student_id}</td>
                        <td>{row.student_name}</td>
                        <td>
                          {row.solved_count} / {session.total_questions}
                        </td>
                        <td>{row.attempts_count}</td>
                        <td>{row.penalized_attempts}</td>
                        <td>{row.penalty_minutes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))
        )}
      </section>
      {printSession && (
        <ReportPdfPreview
          key={printSession.id}
          session={printSession}
          onClose={() => setPrintSession(null)}
          onNamesSaved={handleNamesSaved}
        />
      )}
    </main>
  );
}
