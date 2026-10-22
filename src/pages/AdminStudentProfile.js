import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { tr, useLocale } from "../i18n/LocaleContext";
import { API_BASE_URL } from "../config/api";
import { readApiResponse, userError } from "../services/apiErrors";
import { formatStudentDate, verdictLabel } from "../utils/studentActivity";
import { useThemeMode } from "../theme/useThemeMode";
import AdminPageHeader from "../components/AdminPageHeader";
import "../App.css";

function profileUrl(studentId, sessionId) {
  const query = new URLSearchParams({ student_id: studentId });
  if (sessionId) query.set("session_id", sessionId);
  return `${API_BASE_URL}/get_admin_student_profile.php?${query}`;
}

function adminHeaders() {
  return { Authorization: `Bearer ${sessionStorage.getItem("admin-token") || ""}` };
}

export default function AdminStudentProfile() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { direction, locale } = useLocale();
  const { themeClass } = useThemeMode();
  const [student, setStudent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openSession, setOpenSession] = useState(null);
  const [attempts, setAttempts] = useState({});
  const [attemptError, setAttemptError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    fetch(profileUrl(studentId), { headers: adminHeaders() })
      .then(readApiResponse)
      .then((data) => {
        if (!active) return;
        setStudent(data.student);
        setHistory(data.history || []);
      })
      .catch((failure) => {
        if (!active) return;
        setError(userError(failure, "تعذر تحميل ملف الطالب. حاول مرة أخرى."));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [studentId]);

  const toggleAttempts = async (sessionId) => {
    if (openSession === sessionId) {
      setOpenSession(null);
      return;
    }
    setOpenSession(sessionId);
    setAttemptError("");
    if (attempts[sessionId]) return;
    try {
      const response = await fetch(profileUrl(studentId, sessionId), { headers: adminHeaders() });
      const data = await readApiResponse(response);
      setAttempts((current) => ({ ...current, [sessionId]: data.attempts || [] }));
    } catch (failure) {
      setAttemptError(userError(failure, "تعذر تحميل محاولات هذه المسابقة."));
    }
  };

  const solved = history.reduce((sum, item) => sum + Number(item.solved_count || 0), 0);
  const attempted = history.reduce((sum, item) => sum + Number(item.attempts_count || 0), 0);

  return (
    <main className={`admin-v2-shell institution-admin admin-student-profile ${themeClass}`} dir={direction}>
      <AdminPageHeader section={tr("المشاركون")} title={student?.student_name || tr("ملف الطالب")} description={tr("بيانات الطالب وسجل مشاركاته في المسابقات.")}>
        <button type="button" className="secondary-action" onClick={() => navigate("/admin/students")}>{tr("العودة لقائمة الطلبة")}</button>
      </AdminPageHeader>

      {loading && <p role="status">{tr("جارٍ تحميل بيانات الطالب...")}</p>}
      {error && <p className="form-error" role="alert">{tr(error)}</p>}
      {!loading && !error && student && (
        <>
          <section className="student-profile-summary" aria-label={tr("بيانات الطالب")}>
            <div><span>{tr("رقم القيد")}</span><strong dir="auto">{student.student_id}</strong></div>
            <div><span>{tr("تاريخ الإضافة")}</span><strong>{formatStudentDate(student.created_at, locale)}</strong></div>
            <div><span>{tr("كلمة المرور")}</span><strong>{tr(student.has_password ? "مفعلة" : "غير مفعلة")}</strong></div>
            <div><span>{tr("المشاركات")}</span><strong>{history.length}</strong></div>
            <div><span>{tr("الحلول المقبولة")}</span><strong>{solved}</strong></div>
            <div><span>{tr("المحاولات")}</span><strong>{attempted}</strong></div>
          </section>

          <section className="student-history" aria-labelledby="admin-student-history-title">
            <h2 id="admin-student-history-title">{tr("سجل المشاركات")}</h2>
            {history.length === 0 && <p>{tr("هذا الطالب لم يدخل أي مسابقة حتى الآن.")}</p>}
            {history.map((session) => (
              <article className="student-history-card" key={session.session_id}>
                <div className="student-history-heading">
                  <div>
                    <span className="home-section-label">{formatStudentDate(session.start_time, locale)}</span>
                    <h3>{session.title || tr("التحدي البرمجي")}</h3>
                  </div>
                  <strong dir="ltr">{session.solved_count} / {session.total_questions}</strong>
                </div>
                <div className="student-history-metrics">
                  <span>{tr("وقت الدخول")}: {formatStudentDate(session.started_at, locale)}</span>
                  <span>{tr("الحالة")}: {tr(session.student_status === "finished" ? "أنهى" : "بدأ")}</span>
                  <span>{tr("المركز")}: {session.rank}</span>
                  <span>{tr("المحاولات")}: {session.attempts_count}</span>
                  <span>{tr("زمن الجزاء")}: {session.penalty_minutes} {tr("دقيقة")}</span>
                </div>
                <button type="button" className="student-profile-link" aria-expanded={openSession === session.session_id} onClick={() => toggleAttempts(session.session_id)}>
                  {tr(openSession === session.session_id ? "إخفاء المحاولات" : "عرض المحاولات")}
                </button>
                {openSession === session.session_id && (
                  <div className="student-attempt-list">
                    {attemptError && <p role="alert">{tr(attemptError)}</p>}
                    {!attempts[session.session_id] && !attemptError && <p role="status">{tr("جارٍ تحميل المحاولات...")}</p>}
                    {attempts[session.session_id]?.length === 0 && <p>{tr("لا توجد محاولات في هذه المسابقة.")}</p>}
                    {attempts[session.session_id]?.map((attempt) => (
                      <div className="student-attempt-row" key={attempt.id}>
                        <div><strong>{attempt.question_title || `${tr("السؤال")} ${attempt.question_index + 1}`}</strong><small>{attempt.source_filename || "—"}</small></div>
                        <span className={attempt.is_correct ? "is-accepted" : ""}>{tr(verdictLabel(attempt.verdict))}</span>
                        <time>{formatStudentDate(attempt.submitted_at, locale)}</time>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </section>
        </>
      )}
    </main>
  );
}
