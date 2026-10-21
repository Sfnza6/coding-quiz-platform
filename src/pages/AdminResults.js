import { tr, useLocale } from "../i18n/LocaleContext";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import AdminPageHeader from "../components/AdminPageHeader";
import { useThemeMode } from "../theme/useThemeMode";
import "../App.css";

const verdictLabels = {
  accepted: "حل مقبول",
  wrong_answer: "إجابة خاطئة",
  compile_error: "خطأ ترجمة",
  runtime_error: "خطأ تشغيل",
  runtime_or_compile_error: "خطأ تشغيل أو ترجمة",
  judge_error: "تعذر التحكيم",
  pending: "قيد التحكيم",
};

function formatDuration(seconds) {
  const value = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

function timePart(value) {
  return value ? String(value).split(" ")[1] || value : "—";
}

export default function AdminResults() {
  const { direction, locale } = useLocale();
  const scoreboardBodyRef = useRef(null);
  const previousRowPositionsRef = useRef(null);
  const rowAnimationsRef = useRef(new Map());
  const [data, setData] = useState(null);
  const [activity, setActivity] = useState([]);
  const [rankChanges, setRankChanges] = useState([]);
  const [movements, setMovements] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [clockTick, setClockTick] = useState(Date.now());
  const navigate = useNavigate();
  const { themeClass } = useThemeMode();

  useEffect(() => {
    let mounted = true;
    let timeoutId;
    let controller;
    let inFlight = false;
    let stopped = false;
    let sessionId = null;
    let cursor = 0;
    let previousRanks = {};
    let visibleMovements = {};

    const schedule = () => {
      if (mounted && !stopped && !document.hidden) {
        timeoutId = window.setTimeout(poll, 3000);
      }
    };

    const poll = async () => {
      if (!mounted || stopped || inFlight || document.hidden) return;
      const token = sessionStorage.getItem("admin-token");
      if (!token) {
        navigate("/admin-login", { replace: true });
        return;
      }
      inFlight = true;
      controller = new AbortController();
      const params = new URLSearchParams();
      if (sessionId && cursor) {
        params.set("session_id", String(sessionId));
        params.set("since_id", String(cursor));
      }

      try {
        const query = params.toString();
        const url = `${API_BASE_URL}/get_current_results.php${query ? `?${query}` : ""}`;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
          signal: controller.signal,
        });
        if (response.status === 401) {
          sessionStorage.removeItem("admin-token");
          localStorage.removeItem("admin-id");
          localStorage.removeItem("admin-name");
          stopped = true;
          navigate("/admin-login", { replace: true });
          return;
        }
        if (!response.ok) throw new Error(tr("تعذر تحديث النتائج من الخادم."));
        const next = await response.json();
        if (!mounted) return;

        if (next.status === "no_active") {
          previousRowPositionsRef.current = null;
          sessionId = null;
          cursor = 0;
          previousRanks = {};
          visibleMovements = {};
          setData(next);
          setActivity([]);
          setRankChanges([]);
          setMovements({});
        } else if (next.status === "success") {
          const newSession = sessionId !== next.session.id;
          const now = Date.now();
          if (newSession) {
            previousRowPositionsRef.current = null;
            sessionId = next.session.id;
            previousRanks = {};
            visibleMovements = {};
            setActivity(next.activity || []);
            setRankChanges([]);
          } else {
            setActivity((current) => [...current, ...(next.activity || [])].slice(-40));
          }
          const changes = [];
          for (const row of next.results || []) {
            const before = previousRanks[row.student_id];
            if (before && before !== row.rank) {
              const delta = before - row.rank;
              visibleMovements[row.student_id] = { delta, from: before, to: row.rank, until: now + 9000 };
              changes.push({
                id: `${next.session.id}-${row.student_id}-${now}`,
                student_name: row.student_name,
                from: before,
                to: row.rank,
                time: new Date(now).toLocaleTimeString("ar-LY"),
              });
            }
          }
          if (changes.length) {
            setRankChanges((current) => [...changes, ...current]);
          }
          setMovements({ ...visibleMovements });
          previousRanks = Object.fromEntries((next.results || []).map((row) => [row.student_id, row.rank]));
          cursor = Number(next.activity_cursor || cursor);
          if (!newSession && scoreboardBodyRef.current) {
            const bodyTop = scoreboardBodyRef.current.getBoundingClientRect().top;
            previousRowPositionsRef.current = new Map(
              Array.from(scoreboardBodyRef.current.querySelectorAll("tr[data-student-id]"), (row) => [
                row.dataset.studentId,
                row.getBoundingClientRect().top - bodyTop,
              ])
            );
          }
          setData(next);
        } else {
          throw new Error(tr("استجابة النتائج غير متوقعة."));
        }
        setUpdatedAt(Date.now());
        setError("");
        setLoading(false);
      } catch (failure) {
        if (failure.name !== "AbortError" && mounted) {
          setError("انقطع تحديث النتائج. سنحاول الاتصال مجددًا تلقائيًا.");
          setLoading(false);
        }
      } finally {
        inFlight = false;
        schedule();
      }
    };

    const handleVisibility = () => {
      window.clearTimeout(timeoutId);
      if (document.hidden) {
        controller?.abort();
      } else {
        poll();
      }
    };

    poll();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
      controller?.abort();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [navigate]);

  useLayoutEffect(() => {
    const previousPositions = previousRowPositionsRef.current;
    previousRowPositionsRef.current = null;
    if (!previousPositions || !scoreboardBodyRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const bodyTop = scoreboardBodyRef.current.getBoundingClientRect().top;
    scoreboardBodyRef.current.querySelectorAll("tr[data-student-id]").forEach((row) => {
      const previousTop = previousPositions.get(row.dataset.studentId);
      if (previousTop === undefined) return;
      const distance = previousTop - (row.getBoundingClientRect().top - bodyTop);
      if (Math.abs(distance) < 2) return;

      rowAnimationsRef.current.get(row.dataset.studentId)?.cancel();
      if (typeof row.animate !== "function") return;
      const animation = row.animate(
        [{ transform: `translateY(${distance}px)` }, { transform: "translateY(0)" }],
        { duration: 700, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
      );
      rowAnimationsRef.current.set(row.dataset.studentId, animation);
      const clearAnimation = () => {
        if (rowAnimationsRef.current.get(row.dataset.studentId) === animation) {
          rowAnimationsRef.current.delete(row.dataset.studentId);
        }
      };
      animation.onfinish = clearAnimation;
      animation.oncancel = clearAnimation;
    });
  }, [data]);

  useEffect(() => () => {
    rowAnimationsRef.current.forEach((animation) => animation.cancel());
    rowAnimationsRef.current.clear();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setClockTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const results = data?.results || [];
  const totalQuestions = Number(data?.total_questions || 0);
  const remainingSeconds = data?.session
    ? Math.max(0, Number(data.session.remaining_seconds || 0) - Math.floor((clockTick - (updatedAt || clockTick)) / 1000))
    : 0;
  const questionRows = results.flatMap((row) =>
    Array.from({ length: totalQuestions }, (_, index) => ({
      studentId: row.student_id,
      studentName: row.student_name,
      questionIndex: index,
      questionTitle: data.questions?.[index]?.title || `${tr("السؤال")} ${index + 1}`,
      problem: row.problems?.[index],
    }))
  );

  return (
    <main className={`admin-v2-shell institution-admin ${themeClass}`} dir={direction}>
      <AdminPageHeader section={tr("المتابعة المباشرة")} title={tr("النتائج الحالية")}>
        <button className="secondary-action" onClick={() => navigate("/reports")}>{tr("التقارير السابقة")}</button>
      </AdminPageHeader>

      {loading ? (
        <section className="admin-v2-card live-state-card" role="status">{tr("جارٍ تحميل نتائج المسابقة...")}</section>
      ) : data?.status === "no_active" ? (
        <section className="admin-v2-card live-state-card">
          <h2>{tr("لا توجد مسابقة مفتوحة حاليًا")}</h2>
          <p className="muted-text">{tr("ستظهر هنا النتائج والنشاط المباشر عند بدء مسابقة جديدة.")}</p>
          {error && <p className="form-error" role="status">{tr(error)}</p>}
        </section>
      ) : data?.status !== "success" ? (
        <section className="admin-v2-card live-state-card" role="alert">{tr(error || "تعذر تحميل النتائج. تأكد من اتصال الخادم.")}</section>
      ) : (
        <div className="live-dashboard">
          <section className="admin-v2-card live-session-bar" aria-label={tr("حالة المسابقة")}>
            <div>
              <span className={`live-status ${data.session.is_live && remainingSeconds > 0 ? "is-live" : "is-ended"}`}>
                {data.session.is_live && remainingSeconds > 0 ? tr("مباشر الآن") : tr("انتهى الوقت")}
              </span>
              <h2>{data.session.title}</h2>
              <p className="muted-text">{tr("بدأت:")} {data.session.start_time} {tr("· آخر تحديث:")} {updatedAt ? new Date(updatedAt).toLocaleTimeString(locale === "ar" ? "ar-LY" : "en-GB") : "—"}</p>
            </div>
            <div className="live-timer">
              <span>{tr("الوقت المتبقي")}</span>
              <strong dir="ltr">{formatDuration(remainingSeconds)}</strong>
            </div>
          </section>

          {error && <p className="live-connection-warning" role="status">{tr(error)}</p>}

          <section className="admin-v2-card live-scoreboard" aria-labelledby="live-scoreboard-title">
            <div className="live-section-heading">
              <h2 id="live-scoreboard-title">{tr("جدول الترتيب")}</h2>
              <span className="live-table-count">{data.summary.participants} {tr("طالب ·")} {data.summary.attempts} {tr("تسليمة")}</span>
            </div>
            {results.length === 0 ? (
              <p className="live-empty">{tr("لم يُسجل مشاركون في هذه المسابقة بعد.")}</p>
            ) : (
              <div className="admin-table-wrap live-table-wrap">
                <table className="admin-table live-scoreboard-table">
                  <thead>
                    <tr>
                      <th>{tr("المركز")}</th>
                      <th>{tr("الطالب")}</th>
                      <th>{tr("النقاط")}</th>
                      <th>{tr("الحلول")}</th>
                      <th>{tr("التسليمات")}</th>
                      <th>{tr("محاولات خاطئة")}</th>
                      <th>{tr("زمن الحل")}</th>
                      <th>{tr("الجزاء")}</th>
                      <th>{tr("التغيّر")}</th>
                    </tr>
                  </thead>
                  <tbody ref={scoreboardBodyRef}>
                    {results.map((row) => {
                      const movement = movements[row.student_id];
                      return (
                        <tr key={row.student_id} data-student-id={row.student_id} className={movement && movement.until > clockTick ? (movement.delta > 0 ? "rank-moved-up" : "rank-moved-down") : ""}>
                          <td data-label={tr("المركز")} className="live-rank-cell"><strong>{row.rank}</strong></td>
                          <td data-label={tr("الطالب")} className="live-student-cell"><strong>{row.student_name}</strong><small dir="ltr">{row.student_id}</small></td>
                          <td data-label={tr("النقاط")} className="live-points-cell"><strong>{row.final_score}</strong></td>
                          <td data-label={tr("الحلول")}><strong>{row.solved_count}</strong><span className="live-cell-subtle"> / {totalQuestions}</span></td>
                          <td data-label={tr("التسليمات")}>{row.attempts_count}</td>
                          <td data-label={tr("محاولات خاطئة")}>{row.wrong_attempts_count ?? row.penalized_attempts}</td>
                          <td data-label={tr("زمن الحل")}>{row.total_time} {tr("د")}</td>
                          <td data-label={tr("الجزاء")}><strong>{row.penalty_minutes} {tr("د")}</strong></td>
                          <td data-label={tr("التغيّر")}>{movement ? <span className={`rank-delta ${movement.delta > 0 ? "up" : "down"}`}>{movement.delta > 0 ? "▲" : "▼"} {tr("من")} {movement.from} {tr("إلى")} {movement.to}</span> : <span className="live-cell-subtle">—</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <p className="live-table-note">{tr("كل سؤال مقبول يمنح نقطة. المحاولات الخاطئة تظهر فورًا، لكن جزاءها (")}{data.penalty_per_wrong_minutes} {tr("دقيقة لكل محاولة) يُضاف فقط إذا قُبل السؤال لاحقًا. الترتيب حسب النقاط ثم أقل جزاء.")}</p>
          </section>

          <section className="admin-v2-card live-secondary-table" aria-labelledby="live-questions-title">
            <div className="live-section-heading"><h2 id="live-questions-title">{tr("تفاصيل الأسئلة")}</h2></div>
            {questionRows.length === 0 ? <p className="live-empty">{tr("لا توجد بيانات أسئلة بعد.")}</p> : (
              <div className="admin-table-wrap live-table-wrap">
                <table className="admin-table live-data-table">
                  <thead><tr><th>{tr("الطالب")}</th><th>{tr("السؤال")}</th><th>{tr("الحالة")}</th><th>{tr("التسليمات")}</th><th>{tr("وقت القبول")}</th><th>{tr("محاولات خاطئة")}</th></tr></thead>
                  <tbody>{questionRows.map(({ studentId, studentName, questionIndex, questionTitle, problem }) => (
                    <tr key={`${studentId}-${questionIndex}`}>
                      <td data-label={tr("الطالب")}>{studentName}</td>
                      <td data-label={tr("السؤال")}>{questionTitle}</td>
                      <td data-label={tr("الحالة")}><span className={`live-result-label ${problem?.status || "unattempted"}`}>{problem?.status === "accepted" ? tr("مقبول") : problem?.status === "attempted" ? tr("لم يُقبل") : tr("بدون تسليم")}</span></td>
                      <td data-label={tr("التسليمات")}>{problem?.attempts_count || 0}</td>
                      <td data-label={tr("وقت القبول")} dir="ltr">{problem?.status === "accepted" ? formatDuration(problem.accepted_seconds ?? problem.accepted_minute * 60) : "—"}</td>
                      <td data-label={tr("محاولات خاطئة")}>{problem?.wrong_attempts || 0}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </section>

          <section className="admin-v2-card live-secondary-table" aria-labelledby="live-activity-title">
            <div className="live-section-heading"><h2 id="live-activity-title">{tr("آخر التسليمات")}</h2><span className="live-table-count">{data.summary.recent_attempts} {tr("في آخر 5 دقائق")}</span></div>
            {activity.length === 0 ? <p className="live-empty">{tr("لا توجد تسليمات بعد.")}</p> : (
              <div className="admin-table-wrap live-table-wrap">
                <table className="admin-table live-data-table">
                  <thead><tr><th>{tr("الوقت")}</th><th>{tr("الطالب")}</th><th>{tr("السؤال")}</th><th>{tr("النتيجة")}</th><th>{tr("زمن المسابقة")}</th></tr></thead>
                  <tbody>{activity.slice().reverse().map((item) => (
                    <tr key={item.id}>
                      <td data-label={tr("الوقت")} dir="ltr">{timePart(item.submitted_at)}</td>
                      <td data-label={tr("الطالب")}>{item.student_name || item.student_id}</td>
                      <td data-label={tr("السؤال")}>{item.question_title || `${tr("السؤال")} ${item.question_index + 1}`}</td>
                      <td data-label={tr("النتيجة")}><span className={`live-result-label ${item.is_correct ? "accepted" : item.verdict === "judge_error" ? "unattempted" : "attempted"}`}>{tr(verdictLabels[item.verdict] || item.verdict)}</span></td>
                      <td data-label={tr("زمن المسابقة")} dir="ltr">{formatDuration(item.time_spent)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </section>

          <section className="admin-v2-card live-secondary-table" aria-labelledby="live-rank-changes-title">
            <div className="live-section-heading"><h2 id="live-rank-changes-title">{tr("تغيّر المراكز")}</h2></div>
            {rankChanges.length === 0 ? <p className="live-empty">{tr("ستظهر التغيّرات هنا عند تغيّر مركز طالب أثناء فتح الصفحة.")}</p> : (
              <div className="admin-table-wrap live-table-wrap">
                <table className="admin-table live-data-table">
                  <thead><tr><th>{tr("الوقت")}</th><th>{tr("الطالب")}</th><th>{tr("المركز السابق")}</th><th>{tr("المركز الحالي")}</th><th>{tr("الحركة")}</th></tr></thead>
                  <tbody>{rankChanges.map((change) => (
                    <tr key={change.id}>
                      <td data-label={tr("الوقت")} dir="ltr">{change.time}</td>
                      <td data-label={tr("الطالب")}>{change.student_name}</td>
                      <td data-label={tr("المركز السابق")}>{change.from}</td>
                      <td data-label={tr("المركز الحالي")}><strong>{change.to}</strong></td>
                      <td data-label={tr("الحركة")}><span className={`rank-delta ${change.to < change.from ? "up" : "down"}`}>{change.to < change.from ? tr("▲ صعود") : tr("▼ نزول")}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
