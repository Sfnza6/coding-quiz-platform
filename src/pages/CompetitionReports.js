import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import AdminPageHeader from "../components/AdminPageHeader";
import { useThemeMode } from "../theme/useThemeMode";
import "../App.css";

export default function CompetitionReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { themeClass } = useThemeMode();

  useEffect(() => {
    if (!localStorage.getItem("admin-id")) {
      navigate("/admin-login", { replace: true });
      return;
    }

    fetch(`${API_BASE_URL}/get_competition_reports.php`)
      .then((res) => res.json())
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
    <main className={`admin-v2-shell institution-admin ${themeClass}`} dir="rtl">
      <AdminPageHeader section="الأرشيف" title="تقارير المسابقات" description="راجع نتائج التحديات المكتملة وتفاصيل كل جلسة.">
          <button className="secondary-action" onClick={() => navigate("/admin")}>
            لوحة التحكم
          </button>
          <button className="secondary-action" onClick={() => navigate("/results")}>
            النتائج الحالية
          </button>
      </AdminPageHeader>

      <section className="reports-stack">
        {loading ? (
          <article className="admin-v2-card">
            <h3>جاري تحميل التقارير...</h3>
          </article>
        ) : error ? (
          <article className="admin-v2-card">
            <h3>{error}</h3>
          </article>
        ) : reports.length === 0 ? (
          <article className="admin-v2-card">
            <h3>لا توجد تقارير لمسابقات مغلقة حتى الآن.</h3>
          </article>
        ) : (
          reports.map((session) => (
            <article className="admin-v2-card report-card" key={session.id}>
              <div className="report-heading">
                <div>
                  <p className="eyebrow">الجلسة رقم {session.id}</p>
                  <h2>مسابقة رقم {session.id}</h2>
                </div>
                <dl className="report-meta">
                  <div>
                    <dt>البداية</dt>
                    <dd>{session.start_time}</dd>
                  </div>
                  <div>
                    <dt>النهاية</dt>
                    <dd>{session.end_time}</dd>
                  </div>
                </dl>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>الترتيب</th>
                      <th>رقم القيد</th>
                      <th>الاسم</th>
                      <th>الدقة</th>
                      <th>المحاولات</th>
                      <th>وقت الحل</th>
                      <th>النقاط</th>
                    </tr>
                  </thead>
                  <tbody>
                    {session.results.map((row, index) => (
                      <tr key={`${session.id}-${row.student_id}`}>
                        <td>{index + 1}</td>
                        <td>{row.student_id}</td>
                        <td>{row.student_name}</td>
                        <td>
                          {row.solved_count} / {session.total_questions}
                        </td>
                        <td>{row.attempts_count}</td>
                        <td>{row.total_time}</td>
                        <td>{row.final_score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
