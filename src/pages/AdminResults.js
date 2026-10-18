import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import AdminPageHeader from "../components/AdminPageHeader";
import { useThemeMode } from "../theme/useThemeMode";
import "../App.css";

export default function AdminResults() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { themeClass } = useThemeMode();

  useEffect(() => {
    if (!localStorage.getItem("admin-id")) {
      navigate("/admin-login", { replace: true });
      return undefined;
    }

    const fetchResults = () => {
      fetch(`${API_BASE_URL}/get_current_results.php`)
        .then((res) => res.json())
        .then((result) => {
          setData(result);
          setLoading(false);
        })
        .catch(() => {
          setData({ status: "fail" });
          setLoading(false);
        });
    };

    fetchResults();
    const interval = setInterval(fetchResults, 2000);
    return () => clearInterval(interval);
  }, [navigate]);

  const results = data?.results || [];

  return (
    <main className={`admin-v2-shell institution-admin ${themeClass}`} dir="rtl">
      <AdminPageHeader section="المتابعة المباشرة" title="النتائج الحالية" description="تابع ترتيب المشاركين ونتائج التحدي أثناء انعقاده.">
          <button className="secondary-action" onClick={() => navigate("/admin")}>
            لوحة التحكم
          </button>
          <button className="secondary-action" onClick={() => navigate("/reports")}>
            التقارير السابقة
          </button>
      </AdminPageHeader>

      <section className="admin-v2-card">
        {loading ? (
          <h3>جاري تحميل النتائج...</h3>
        ) : data?.status === "no_active" ? (
          <h3>لا توجد مسابقة مفتوحة حاليا.</h3>
        ) : data?.status !== "success" ? (
          <h3>تعذر تحميل النتائج. تأكد أن الخادم يعمل وأن قاعدة البيانات جاهزة.</h3>
        ) : (
          <>
            <h2>نتائج المسابقة الحالية</h2>
            <p className="muted-text">
              وقت البداية: <strong>{data.session?.start_time}</strong>
            </p>

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
                  {results.map((row, index) => (
                    <tr key={row.student_id}>
                      <td>{index + 1}</td>
                      <td>{row.student_id}</td>
                      <td>{row.student_name}</td>
                      <td>
                        {row.solved_count} / {data.total_questions}
                      </td>
                      <td>{row.attempts_count}</td>
                      <td>{row.total_time}</td>
                      <td>{row.final_score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
