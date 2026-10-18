import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import InstitutionBrand from "../components/InstitutionBrand";
import { studentApi } from "../services/apiClient";
import "../App.css";

export default function FinishScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    logout,
    token,
    markCompetitionFinished,
    clearFinishedCompetition,
    setActiveCompetitionId,
  } = useAuth();
  const score = location.state?.score ?? 0;
  const total = location.state?.total ?? 0;
  const competitionId = location.state?.competitionId;

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
    <main className="student-shell finish-shell institution-finish" dir="rtl">
      <header className="institution-header">
        <InstitutionBrand compact />
        <span className="institution-header-note">منصة التحدي البرمجي</span>
      </header>

      <section className="finish-result-panel" aria-labelledby="finish-title">
        <div className="finish-result-banner">
          <span className="finish-result-icon" aria-hidden="true">✓</span>
          <span className="institution-kicker">نهاية التحدي</span>
          <h1 id="finish-title">انتهت جلسة التحدي</h1>
          <p>شكرًا لمشاركتك في التحدي البرمجي بكلية تقنية المعلومات، جامعة سرت.</p>
        </div>
        <div className="finish-result-content">
          {total > 0 && (
            <div className="finish-result-score">
              <span>الحلول المقبولة في هذه الجلسة</span>
              <strong dir="ltr">{score} / {total}</strong>
            </div>
          )}
          <p>تم إغلاق مساحة التحدي لهذه الجلسة. عند فتح تحدٍّ جديد، ستتمكن من المشاركة باستخدام حسابك.</p>
          <button type="button" onClick={handleExit}>إنهاء الجلسة</button>
        </div>
      </section>
      <footer className="institution-page-footer">منصة التحدي البرمجي · جامعة سرت</footer>
    </main>
  );
}
