import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import InstitutionBrand from "../components/InstitutionBrand";
import { studentApi } from "../services/apiClient";
import "../App.css";

function formatTime(seconds) {
  const value = Math.max(0, Math.floor(Number(seconds || 0)));
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const formattedSeconds = String(value % 60).padStart(2, "0");

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${formattedSeconds}`
    : `${minutes}:${formattedSeconds}`;
}

function normalizeQuestions(payload) {
  return Array.isArray(payload) ? payload : payload.questions || [];
}

export default function QuizScreen() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [workspaceError, setWorkspaceError] = useState("");
  const [competitionId, setCompetitionId] = useState(null);
  const [uploadState, setUploadState] = useState({ status: "idle", message: "", fileName: "" });
  const [solved, setSolved] = useState({});
  const navigate = useNavigate();
  const { token, markCompetitionFinished, setActiveCompetitionId } = useAuth();

  const currentQuestion = questions[currentIndex];
  const inputDescription = String(currentQuestion?.input_sample ?? "").trim();
  const outputDescription = String(currentQuestion?.output_sample ?? "").trim();
  const solvedCount = Object.values(solved).filter(Boolean).length;
  const progress = questions.length ? Math.round((solvedCount / questions.length) * 100) : 0;

  const finalize = useCallback(
    async (reason = "submitted") => {
      try {
        await studentApi.finalizeCompetition(token);
      } catch {
        // The UI still locks locally if the backend already closed the session.
      } finally {
        markCompetitionFinished(competitionId);
        navigate("/finish", {
          replace: true,
          state: { score: solvedCount, total: questions.length, reason, competitionId },
        });
      }
    },
    [competitionId, markCompetitionFinished, navigate, questions.length, solvedCount, token]
  );

  useEffect(() => {
    let isMounted = true;

    async function bootstrapWorkspace() {
      try {
        const status = await studentApi.getCompetitionStatus(token);
        const competition = status.competition || status;

        if (!competition.is_active || Number(competition.remaining_seconds || 0) <= 0) {
          navigate("/home", { replace: true });
          return;
        }

        if (competition.id) {
          setCompetitionId(competition.id);
          setActiveCompetitionId(competition.id);
        }

        const questionPayload = await studentApi.getQuestions(token);
        if (!isMounted) return;

        setQuestions(normalizeQuestions(questionPayload));
        setRemainingSeconds(Number(competition.remaining_seconds || 0));
      } catch (error) {
        if (!isMounted) return;
        if (error.status === 401 || error.status === 403) {
          markCompetitionFinished();
          navigate("/finish", { replace: true, state: { reason: "locked" } });
          return;
        }
        setWorkspaceError("تعذر تحميل مساحة التحدي حاليًا. حاول مرة أخرى بعد قليل.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    bootstrapWorkspace();
    return () => {
      isMounted = false;
    };
  }, [markCompetitionFinished, navigate, setActiveCompetitionId, token]);

  useEffect(() => {
    if (loading || workspaceError) return undefined;

    const interval = setInterval(async () => {
      try {
        const status = await studentApi.getCompetitionStatus(token);
        const competition = status.competition || status;

        if (!competition.is_active || Number(competition.remaining_seconds || 0) <= 0) {
          finalize("time-expired");
          return;
        }

        setRemainingSeconds(Number(competition.remaining_seconds || 0));
      } catch (error) {
        if (error.status === 401 || error.status === 403) {
          finalize("forbidden");
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [finalize, loading, token, workspaceError]);

  useEffect(() => {
    if (loading || workspaceError || remainingSeconds <= 0) return undefined;

    const timer = setInterval(() => {
      setRemainingSeconds((previous) => {
        if (previous <= 1) {
          finalize("time-expired");
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [finalize, loading, remainingSeconds, workspaceError]);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !currentQuestion) return;

    setUploadState({
      status: "uploading",
      message: "جارٍ رفع الحل وتشغيل الاختبارات...",
      fileName: file.name,
    });

    try {
      const data = await studentApi.submitSolution({
        token,
        questionId: currentQuestion.id,
        sourceFile: file,
        language: currentQuestion.language || "cpp",
      });

      const isCorrect = Boolean(data.is_correct);
      setSolved((previous) => ({ ...previous, [currentQuestion.id]: isCorrect }));
      setUploadState({
        status: isCorrect ? "success" : "failed",
        message: isCorrect ? "تم قبول الحل." : "الحل لم يجتز كل الاختبارات.",
        fileName: file.name,
      });
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        finalize("forbidden");
        return;
      }

      setUploadState({
        status: "failed",
        message: "تعذر رفع الحل. تحقق من استمرار التحدي وحاول مرة أخرى.",
        fileName: file.name,
      });
    } finally {
      event.target.value = "";
    }
  };

  const examples = useMemo(() => {
    if (!currentQuestion) return [];
    if (Array.isArray(currentQuestion.examples)) return currentQuestion.examples;

    return [
      {
        input: currentQuestion.example_input || "",
        output: currentQuestion.example_output || "",
      },
    ].filter((example) => example.input || example.output);
  }, [currentQuestion]);

  if (loading) {
    return (
      <main className="student-shell workspace-shell institution-workspace workspace-state-shell" dir="rtl">
        <section className="workspace-state-card" role="status">جارٍ تجهيز مساحة التحدي...</section>
      </main>
    );
  }

  if (workspaceError) {
    return (
      <main className="student-shell workspace-shell institution-workspace workspace-state-shell" dir="rtl">
        <section className="workspace-state-card workspace-error" role="alert">{workspaceError}</section>
      </main>
    );
  }

  return (
    <main className="student-shell workspace-shell institution-workspace" dir="rtl">
      <header className="workspace-institution-header">
        <InstitutionBrand />
        <span className="workspace-header-label">مساحة التحدي</span>
      </header>

      <div className="workspace-content">
        <section className="workspace-intro" aria-labelledby="workspace-title">
          <div>
            <span className="workspace-kicker">التحدي البرمجي</span>
            <h1 id="workspace-title">حل المسائل وارفع إجاباتك</h1>
            <p>انتقل بين الأسئلة، اقرأ الأمثلة بعناية، وتابع الوقت المتبقي أثناء التحدي.</p>
          </div>
          <div className="workspace-timer" role="timer" aria-label="الوقت المتبقي">
            <span>الوقت المتبقي</span>
            <strong dir="ltr">{formatTime(remainingSeconds)}</strong>
          </div>
        </section>

        <section className="institution-workspace-grid" aria-label="أسئلة التحدي ورفع الحلول">
          <aside className="workspace-navigation">
            <div className="workspace-progress-card">
              <div className="workspace-progress-heading">
                <span>تقدمك في التحدي</span>
                <strong>{progress}%</strong>
              </div>
              <div className="workspace-progress-track" role="progressbar" aria-label="الأسئلة المقبولة" aria-valuenow={solvedCount} aria-valuemin={0} aria-valuemax={questions.length}>
                <span style={{ width: `${progress}%` }} />
              </div>
              <p>تم قبول {solvedCount} من {questions.length} أسئلة</p>
            </div>

            <nav className="workspace-question-card" aria-label="قائمة الأسئلة">
              <h2>الأسئلة</h2>
              <div className="workspace-question-list">
                {questions.map((question, index) => (
                  <button
                    key={question.id || index}
                    type="button"
                    className={`workspace-question-button ${index === currentIndex ? "is-current" : ""}`}
                    aria-pressed={index === currentIndex}
                    onClick={() => {
                      setCurrentIndex(index);
                      setUploadState({ status: "idle", message: "", fileName: "" });
                    }}
                  >
                    <span className="workspace-question-number">{String(index + 1).padStart(2, "0")}</span>
                    <span className="workspace-question-name">{question.title || `السؤال ${index + 1}`}</span>
                    <small className={solved[question.id] ? "is-solved" : ""}>
                      {solved[question.id] ? "مقبول" : "قيد الحل"}
                    </small>
                  </button>
                ))}
              </div>
            </nav>
          </aside>

          <section className="workspace-problem-pane" aria-label="محتوى السؤال الحالي">
            {currentQuestion ? (
              <>
                <article className="workspace-problem-card">
                  <div className="workspace-problem-meta">
                    <span>السؤال {currentIndex + 1} من {questions.length}</span>
                    <span>اللغة: {currentQuestion.language || "cpp"}</span>
                  </div>
                  <h2>{currentQuestion.title || `السؤال ${currentIndex + 1}`}</h2>
                  <div className="workspace-problem-text">{currentQuestion.description || "لم يُضف وصف لهذا السؤال بعد."}</div>
                </article>

                {(inputDescription || outputDescription) && (
                  <section className="workspace-io-guide" aria-labelledby="workspace-io-title">
                    <div className="workspace-io-heading">
                      <span className="home-section-label">تنسيق الحل</span>
                      <h3 id="workspace-io-title">طريقة الإدخال والإخراج</h3>
                    </div>
                    <div className="workspace-io-grid">
                      {inputDescription && (
                        <div className="workspace-io-card">
                          <span className="workspace-io-icon" aria-hidden="true">↓</span>
                          <div>
                            <h4>وصف المدخلات</h4>
                            <p className="workspace-io-hint">ما الذي يقرأه برنامجك؟</p>
                            <p className="workspace-io-text">{inputDescription}</p>
                          </div>
                        </div>
                      )}
                      {outputDescription && (
                        <div className="workspace-io-card">
                          <span className="workspace-io-icon" aria-hidden="true">↑</span>
                          <div>
                            <h4>وصف المخرجات</h4>
                            <p className="workspace-io-hint">ما الذي يجب أن يطبعه برنامجك؟</p>
                            <p className="workspace-io-text">{outputDescription}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {examples.length > 0 && (
                  <div className="workspace-examples">
                    {examples.map((example, index) => (
                      <article className="workspace-example-card" key={`${index}-${example.input}`}>
                        <h3>مثال {index + 1}</h3>
                        <div className="workspace-example-block">
                          <span>المدخلات</span>
                          <pre>{example.input || "—"}</pre>
                        </div>
                        <div className="workspace-example-block">
                          <span>المخرجات</span>
                          <pre>{example.output || "—"}</pre>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="workspace-empty-card">لا توجد أسئلة متاحة حاليًا.</div>
            )}
          </section>

          <aside className="workspace-submit-pane">
            <section className="workspace-upload-card">
              <span className="home-section-label">تسليم الإجابة</span>
              <h2>ارفع حل السؤال</h2>
              <p>اختر ملف الشيفرة المصدرية للسؤال الحالي. ستظهر نتيجة التقييم هنا بعد الرفع.</p>
              <label className="workspace-file-label">
                <input
                  type="file"
                  accept=".cpp,.c,.py,.js,.java"
                  onChange={handleUpload}
                  disabled={!currentQuestion || uploadState.status === "uploading"}
                />
                <span className="workspace-file-icon" aria-hidden="true">↑</span>
                <strong>{uploadState.status === "uploading" ? "جارٍ فحص الحل..." : "اختيار ملف الحل"}</strong>
                <small>CPP، C، Python، JavaScript، Java</small>
              </label>

              {uploadState.fileName && <p className="workspace-selected-file">{uploadState.fileName}</p>}
              {uploadState.message && (
                <p className={`workspace-upload-feedback ${uploadState.status}`} role="status">{uploadState.message}</p>
              )}
            </section>

            <div className="workspace-finish-card">
              <strong>انتهيت من الحل؟</strong>
              <p>الإنهاء النهائي يقفل مساحة التحدي لهذه الجلسة.</p>
              <button type="button" onClick={() => finalize("submitted")}>
                إنهاء التحدي وإرسال الحلول
              </button>
            </div>
          </aside>
        </section>
        <footer className="home-footer">كلية تقنية المعلومات · جامعة سرت</footer>
      </div>
    </main>
  );
}
