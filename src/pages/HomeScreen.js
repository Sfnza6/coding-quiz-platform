import { tr, useLocale } from "../i18n/LocaleContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import InstitutionBrand from "../components/InstitutionBrand";
import { studentApi } from "../services/apiClient";
import { API_BASE_URL } from "../config/api";
import "../App.css";

function formatDuration(seconds) {
  const value = Math.max(0, Math.floor(Number(seconds || 0)));
  const minutes = Math.floor(value / 60);
  const remainder = value % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function readinessKey(student) {
  return `student-ready:${student?.student_id || student?.id || ""}`;
}

function readReadiness(student) {
  try {
    const saved = Number(sessionStorage.getItem(readinessKey(student)));
    return saved > 0 && Date.now() - saved < 2 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export default function HomeScreen() {
  const { direction } = useLocale();
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { student, token, logout, setActiveCompetitionId, clearFinishedCompetition } = useAuth();
  const [isReady, setIsReady] = useState(() => readReadiness(student));

  useEffect(() => {
    setIsReady(readReadiness(student));
  }, [student]);

  useEffect(() => {
    let isMounted = true;

    const loadCompetitionStatus = () => {
      studentApi
        .getCompetitionStatus(token)
        .then((data) => {
          if (!isMounted) return;
          const nextCompetition = data.competition || data;
          setCompetition(nextCompetition);
          if (nextCompetition?.id) {
            setActiveCompetitionId(nextCompetition.id);
          }
          if (nextCompetition?.is_active && nextCompetition?.student_status !== "finished") {
            clearFinishedCompetition(nextCompetition.id);
          }
          setError("");
        })
        .catch((err) => {
          if (!isMounted) return;
          setError(
            err.status === 401
              ? "انتهت جلسة الدخول. سجل الدخول من جديد."
              : "تعذر تحديث حالة التحدي حاليًا. حاول مرة أخرى بعد قليل."
          );
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    };

    loadCompetitionStatus();
    // The event only signals a change; the authenticated request above supplies the data.
    const events = typeof EventSource !== "undefined"
      ? new EventSource(`${API_BASE_URL}/competition_events.php`)
      : null;
    events?.addEventListener("changed", loadCompetitionStatus);
    events?.addEventListener("ready", loadCompetitionStatus);
    const intervalId = setInterval(loadCompetitionStatus, 4000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      events?.close();
    };
  }, [clearFinishedCompetition, setActiveCompetitionId, token]);

  useEffect(() => {
    if (!competition?.is_active) return undefined;

    const countdown = setInterval(() => {
      setCompetition((current) => {
        if (!current?.remaining_seconds) return current;
        return {
          ...current,
          remaining_seconds: Math.max(0, Number(current.remaining_seconds) - 1),
        };
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [competition?.is_active]);

  useEffect(() => {
    if (competition?.student_status === "finished") {
      navigate("/finish", { replace: true, state: { competitionId: competition.id } });
    }
  }, [competition?.id, competition?.student_status, navigate]);

  const isActive = Boolean(competition?.is_active && Number(competition?.remaining_seconds || 0) > 0);

  useEffect(() => {
    if (!isReady || !isActive || competition?.student_status === "finished") return;
    sessionStorage.removeItem(readinessKey(student));
    setIsReady(false);
    navigate("/quiz", { replace: true });
  }, [isReady, isActive, competition?.student_status, navigate, student]);

  const toggleReady = () => {
    if (isReady) {
      sessionStorage.removeItem(readinessKey(student));
      setIsReady(false);
    } else {
      sessionStorage.setItem(readinessKey(student), String(Date.now()));
      setIsReady(true);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(readinessKey(student));
    logout();
    navigate("/", { replace: true });
  };

  const statusText = loading
    ? tr("جارٍ التحقق من حالة التحدي")
    : isActive
      ? tr("التحدي متاح الآن")
      : competition?.student_status === "finished"
        ? tr("اكتملت مشاركتك")
        : isReady ? tr("أنت مستعد لبداية التحدي") : tr("بانتظار بدء التحدي");

  return (
    <main className="student-shell dashboard-shell institution-home" dir={direction}>
      <header className="home-header">
        <InstitutionBrand />
        <button className="home-logout" type="button" onClick={handleLogout}>
          {tr("تسجيل الخروج")}
        </button>
      </header>

      <div className="home-content">
        <section className="home-welcome" aria-labelledby="home-title">
          <div>
            <span className="home-kicker">{tr("مساحة المشارك")}</span>
            <h1 id="home-title">{tr("مرحبًا،")} {student?.name || tr("طالبنا العزيز")}</h1>
            <p>{tr("هنا تبدأ تجربتك في التحدي البرمجي. تابع حالة المسابقة واستعد لعرض مهاراتك في حل المسائل.")}</p>
          </div>
          <div className="home-welcome-mark" aria-hidden="true">IT</div>
        </section>

        <section className="home-grid" aria-label={tr("معلومات التحدي والمشارك")}>
          <article className="home-competition-card">
            <div className="home-card-heading">
              <span className="home-section-label">{tr("التحدي الحالي")}</span>
              <span className={`home-status ${isActive ? "is-active" : ""}`} role="status">
                <span className="home-status-dot" aria-hidden="true" />
                {statusText}
              </span>
            </div>

            <h2>{competition?.title || tr("التحدي البرمجي")}</h2>
            <p className="home-competition-description">
              {competition?.description || tr("ستظهر هنا تفاصيل التحدي عند إعلانها من فريق التنظيم. يمكنك الدخول بمجرد تفعيل المسابقة.")}
            </p>

            <div className="home-metrics">
              <div>
                <span>{tr("عدد الأسئلة")}</span>
                <strong>{competition?.questions_count ?? "—"}</strong>
              </div>
              <div>
                <span>{tr("الوقت المتبقي")}</span>
                <strong dir="ltr">{competition?.remaining_seconds != null ? formatDuration(competition.remaining_seconds) : "—"}</strong>
              </div>
              <div>
                <span>{tr("حالة الدخول")}</span>
                <strong>{isActive ? tr("متاح") : tr("غير متاح")}</strong>
              </div>
            </div>

            {error && <p className="home-error" role="alert">{tr(error)}</p>}

            <div className="home-action-row">
              <button
                className="home-enter-button"
                type="button"
                disabled={loading || competition?.student_status === "finished"}
                onClick={isActive ? () => navigate("/quiz") : toggleReady}
              >
                {loading ? tr("جارٍ التحقق...") : isActive ? tr("ابدأ التحدي") : isReady ? tr("إلغاء الاستعداد") : tr("استعداد")}
              </button>
              <span>{isActive ? tr("التحدي جاهز للمشاركة") : isReady ? tr("ستدخل تلقائيًا عند بدء المسابقة. الاستعداد لا يُحسب مشاركة.") : tr("اضغط استعداد للدخول تلقائيًا عند بدء المسابقة.")}</span>
            </div>
          </article>

          <aside className="home-sidebar">
            <section className="home-profile-card" aria-labelledby="home-profile-title">
              <span className="home-section-label">{tr("بيانات المشارك")}</span>
              <h2 id="home-profile-title">{tr("بطاقتك في التحدي")}</h2>
              <dl>
                <div>
                  <dt>{tr("الاسم")}</dt>
                  <dd>{student?.name || "—"}</dd>
                </div>
                <div>
                  <dt>{tr("رقم القيد")}</dt>
                  <dd dir="auto">{student?.id || student?.student_id || "—"}</dd>
                </div>
              </dl>
              <button className="student-profile-link" type="button" onClick={() => navigate("/profile")}>{tr("عرض الملف الشخصي وسجل المشاركات")}</button>
            </section>

            <section className="home-guide-card" aria-labelledby="home-guide-title">
              <span className="home-section-label">{tr("قبل البداية")}</span>
              <h2 id="home-guide-title">{tr("خطوات المشاركة")}</h2>
              <ol>
                <li><span>01</span><p>{tr("انتظر تفعيل التحدي من فريق التنظيم.")}</p></li>
                <li><span>02</span><p>{tr("اقرأ المسائل والتعليمات داخل مساحة التحدي.")}</p></li>
                <li><span>03</span><p>{tr("ارفع ملفات الحلول المصدرية قبل انتهاء الوقت.")}</p></li>
              </ol>
            </section>
          </aside>
        </section>

        <footer className="home-footer">{tr("كلية تقنية المعلومات · جامعة سرت")}</footer>
      </div>
    </main>
  );
}
