import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { tr, useLocale } from "../i18n/LocaleContext";
import { useAuth } from "../auth/AuthContext";
import { studentApi } from "../services/apiClient";
import { formatStudentDate, verdictLabel } from "../utils/studentActivity";
import InstitutionBrand from "../components/InstitutionBrand";
import "../App.css";

export default function StudentProfileScreen() {
  const { direction, locale } = useLocale();
  const { student, token } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openSession, setOpenSession] = useState(null);
  const [activity, setActivity] = useState({});
  const [activityError, setActivityError] = useState("");

  useEffect(() => {
    let active = true;
    studentApi.getHistory(token)
      .then((data) => {
        if (!active) return;
        setProfile(data.student || null);
        setHistory(data.history || []);
      })
      .catch(() => { if (active) setError("تعذر تحميل سجل المشاركات. حاول مرة أخرى."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  const toggleSession = async (sessionId) => {
    if (openSession === sessionId) {
      setOpenSession(null);
      return;
    }
    setOpenSession(sessionId);
    setActivityError("");
    if (activity[sessionId]) return;
    try {
      const data = await studentApi.getActivity(token, sessionId);
      setActivity((previous) => ({ ...previous, [sessionId]: data.attempts || [] }));
    } catch {
      setActivityError("تعذر تحميل محاولات هذه المسابقة.");
    }
  };

  const totalSolved = history.reduce((sum, session) => sum + session.solved_count, 0);
  const totalAttempts = history.reduce((sum, session) => sum + session.attempts_count, 0);

  return (
    <main className="student-shell dashboard-shell institution-home student-profile-page" dir={direction}>
      <header className="home-header">
        <InstitutionBrand />
        <button className="home-logout" type="button" onClick={() => navigate("/home")}>{tr("العودة للرئيسية")}</button>
      </header>
      <div className="home-content">
        <section className="home-welcome">
          <div>
            <span className="home-kicker">{tr("الملف الشخصي")}</span>
            <h1>{profile?.name || student?.name || tr("طالبنا العزيز")}</h1>
            <p>{tr("سجل مشاركاتك ونتائجك في التحديات البرمجية.")}</p>
          </div>
          <div className="home-welcome-mark" aria-hidden="true">IT</div>
        </section>

        <section className="student-profile-summary" aria-label={tr("ملخص المشاركات")}>
          <div><span>{tr("رقم القيد")}</span><strong dir="auto">{profile?.id || student?.id || student?.student_id || "—"}</strong></div>
          <div><span>{tr("المشاركات")}</span><strong>{loading ? "—" : history.length}</strong></div>
          <div><span>{tr("الحلول المقبولة")}</span><strong>{loading ? "—" : totalSolved}</strong></div>
          <div><span>{tr("المحاولات")}</span><strong>{loading ? "—" : totalAttempts}</strong></div>
        </section>

        <section className="student-history" aria-labelledby="student-history-title">
          <h2 id="student-history-title">{tr("سجل المشاركات")}</h2>
          {loading && <p role="status">{tr("جارٍ تحميل سجل المشاركات...")}</p>}
          {error && <p role="alert">{tr(error)}</p>}
          {!loading && !error && history.length === 0 && <p>{tr("ما عندكش مشاركات مكتملة حتى الآن.")}</p>}
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
                <span>{tr("مركزك")}: {session.rank}</span>
                <span>{tr("المحاولات")}: {session.attempts_count}</span>
                <span>{tr("زمن الجزاء")}: {session.penalty_minutes} {tr("دقيقة")}</span>
              </div>
              <button type="button" className="student-profile-link" aria-expanded={openSession === session.session_id} onClick={() => toggleSession(session.session_id)}>
                {tr(openSession === session.session_id ? "إخفاء المحاولات" : "عرض المحاولات")}
              </button>
              {openSession === session.session_id && (
                <div className="student-attempt-list">
                  {activityError && <p role="alert">{tr(activityError)}</p>}
                  {!activity[session.session_id] && !activityError && <p role="status">{tr("جارٍ تحميل المحاولات...")}</p>}
                  {activity[session.session_id]?.length === 0 && <p>{tr("لا توجد محاولات في هذه المسابقة.")}</p>}
                  {activity[session.session_id]?.map((attempt) => (
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
      </div>
    </main>
  );
}
