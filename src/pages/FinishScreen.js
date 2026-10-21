import { tr, useLocale } from "../i18n/LocaleContext";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import InstitutionBrand from "../components/InstitutionBrand";
import { studentApi } from "../services/apiClient";
import "../App.css";

export default function FinishScreen() {
  const { direction } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    logout,
    token,
    markCompetitionFinished,
    clearFinishedCompetition,
    setActiveCompetitionId,
  } = useAuth();
  const competitionId = location.state?.competitionId;
  const [result, setResult] = useState(null);
  const [resultError, setResultError] = useState(false);

  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    studentApi.getResult(token, competitionId)
      .then((data) => {
        if (active) setResult(data);
      })
      .catch(() => {
        if (active) setResultError(true);
      });
    return () => { active = false; };
  }, [competitionId, token]);

  useEffect(() => {
    markCompetitionFinished(competitionId);
    window.history.pushState(null, "", window.location.href);

    const keepStudentHere = () => {
      navigate("/finish", { replace: true, state: location.state });
    };

    window.addEventListener("popstate", keepStudentHere);
    return () => window.removeEventListener("popstate", keepStudentHere);
  }, [competitionId, location.state, markCompetitionFinished, navigate]);

  useEffect(() => {
    if (!token) return undefined;

    let isMounted = true;

    const checkForNewCompetition = () => {
      studentApi
        .getCompetitionStatus(token)
        .then((data) => {
          if (!isMounted) return;
          const competition = data.competition || data;
          const nextId = competition?.id ? String(competition.id) : "";
          const currentId = competitionId ? String(competitionId) : "";

          if (
            competition?.is_active &&
            competition?.student_status !== "finished" &&
            nextId &&
            nextId !== currentId
          ) {
            setActiveCompetitionId(nextId);
            clearFinishedCompetition(nextId);
            navigate("/home", { replace: true });
          }
        })
        .catch(() => {});
    };

    checkForNewCompetition();
    const intervalId = setInterval(checkForNewCompetition, 4000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [
    clearFinishedCompetition,
    competitionId,
    navigate,
    setActiveCompetitionId,
    token,
  ]);

  const handleExit = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <main className="student-shell finish-shell institution-finish" dir={direction}>
      <header className="institution-header">
        <InstitutionBrand compact />
        <span className="institution-header-note">{tr("منصة التحدي البرمجي")}</span>
      </header>

      <section className="finish-result-panel" aria-labelledby="finish-title">
        <div className="finish-result-banner">
          <span className="finish-result-icon" aria-hidden="true">✓</span>
          <span className="institution-kicker">{tr("نهاية التحدي")}</span>
          <h1 id="finish-title">{tr("انتهت جلسة التحدي")}</h1>
          <p>{tr("شكرًا لمشاركتك في التحدي البرمجي بكلية تقنية المعلومات، جامعة سرت.")}</p>
        </div>
        <div className="finish-result-content">
          {result && (
            <div className="finish-result-score">
              <span>{tr("الحلول المقبولة في هذه الجلسة")}</span>
              <strong dir="ltr">{result.result.solved_count} / {result.total_questions}</strong>
              <span>{tr("زمن الجزاء:")} {result.result.penalty_minutes} {tr("دقيقة · الترتيب:")} {result.result.rank}</span>
            </div>
          )}
          {resultError && <p role="status">{tr("تعذر تحميل النتيجة الآن. يمكنك مراجعتها لاحقًا مع إدارة المسابقة.")}</p>}
          <p>{tr("تم إغلاق مساحة التحدي لهذه الجلسة. عند فتح تحدٍّ جديد، ستتمكن من المشاركة باستخدام حسابك.")}</p>
          <button className="finish-profile-button" type="button" onClick={() => navigate("/profile")}>{tr("عرض الملف الشخصي وسجل المشاركات")}</button>
          <button type="button" onClick={handleExit}>{tr("إنهاء الجلسة")}</button>
        </div>
      </section>
      <footer className="institution-page-footer">{tr("منصة التحدي البرمجي · جامعة سرت")}</footer>
    </main>
  );
}
