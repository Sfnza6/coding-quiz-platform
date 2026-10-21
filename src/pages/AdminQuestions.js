import { tr, useLocale } from "../i18n/LocaleContext";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import AdminPageHeader from "../components/AdminPageHeader";
import { useThemeMode } from "../theme/useThemeMode";
import "../App.css";

const emptyForm = {
  id: null,
  title: "",
  description: "",
  input_sample: "",
  output_sample: "",
  example_input: "",
  example_output: "",
  test_cases: '[{"input":"AbCDeF","output":"ACDF"}]',
  language: "cpp",
};

export default function AdminQuestions() {
  const { direction } = useLocale();
  const navigate = useNavigate();
  const { themeClass } = useThemeMode();
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState("easy");
  const [aiLanguage, setAiLanguage] = useState("cpp");
  const [aiMode, setAiMode] = useState("fast");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiDraft, setAiDraft] = useState(null);
  const [aiError, setAiError] = useState("");

  const fetchQuestions = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/get_external_questions.php`);
      const data = await response.json();
      setQuestions(Array.isArray(data) ? data : data.questions || []);
    } catch {
      setMessage("تعذر تحميل الأسئلة. تأكد أن الخادم يعمل.");
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("admin-id")) {
      navigate("/admin-login", { replace: true });
      return;
    }
    fetchQuestions();
  }, [fetchQuestions, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const url = form.id ? "update_external_question.php" : "add_external_question.php";

    try {
      JSON.parse(form.test_cases || "[]");
    } catch {
      setMessage("صيغة حالات الاختبار غير صحيحة. تأكد من الأقواس والفواصل.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/${url}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(form).toString(),
      });
      const data = await response.json();

      if (response.ok && data.status === "success") {
        setMessage("تم حفظ السؤال بنجاح.");
        setForm(emptyForm);
        fetchQuestions();
      } else {
        setMessage("لم يتم حفظ السؤال. تأكد من تعبئة الحقول المطلوبة.");
      }
    } catch {
      setMessage("تعذر الاتصال بالخادم أثناء حفظ السؤال.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(tr("هل تريد حذف هذا السؤال؟"))) return;

    try {
      await fetch(`${API_BASE_URL}/delete_external_question.php`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ id }).toString(),
      });
      setMessage("تم حذف السؤال.");
      fetchQuestions();
    } catch {
      setMessage("تعذر حذف السؤال. تأكد أن الخادم يعمل.");
    }
  };

  const generateGeminiQuestion = async (event) => {
    event.preventDefault();
    setAiBusy(true);
    setAiDraft(null);
    setAiError("");
    try {
      const response = await fetch(`${API_BASE_URL}/generate_question_gemini.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_id: localStorage.getItem("admin-id"),
          topic: aiTopic.trim(),
          difficulty: aiDifficulty,
          language: aiLanguage,
          mode: aiMode,
        }),
      });
      const data = await response.json();
      if (!response.ok || data.status !== "success") {
        throw new Error(data.message || "تعذر توليد السؤال.");
      }
      setAiDraft(data.question);
    } catch (error) {
      setAiError(error.message || "تعذر الاتصال بخدمة التوليد.");
    } finally {
      setAiBusy(false);
    }
  };

  const useGeminiDraft = () => {
    if (!aiDraft) return;
    setForm({
      ...emptyForm,
      ...aiDraft,
      test_cases: JSON.stringify(aiDraft.test_cases, null, 2),
    });
    setMessage("هذه مسودة مولّدة. راجع الوصف والمخرجات وحالات الاختبار قبل حفظ السؤال.");
    document.getElementById("question-form-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className={`admin-v2-shell institution-admin ${themeClass}`} dir={direction}>
      <AdminPageHeader section={tr("محتوى التحدي")} title={tr("إدارة الأسئلة")} description={tr("أضف المسائل البرمجية وعدّلها وتابع قائمة الأسئلة.")}>
          <button className="secondary-action" onClick={() => navigate("/admin")}>
            {tr("لوحة التحكم")}
          </button>
          <button className="secondary-action" onClick={() => navigate("/results")}>
            {tr("النتائج")}
          </button>
      </AdminPageHeader>

      <section className="admin-v2-card ai-question-card" aria-labelledby="ai-question-title">
        <div>
          <span className="institution-admin-card-label">{tr("مساعد الإدارة")}</span>
          <h2 id="ai-question-title">{tr("توليد مسودة سؤال باستخدام نموذج الذكاء الاصطناعي")} </h2>
          <p>{tr("اختر موضوعًا ومستوى الصعوبة. ستظهر المسودة للمراجعة قبل إضافتها إلى المسابقة.")}</p>
        </div>
        <form className="ai-question-form" onSubmit={generateGeminiQuestion}>
          <label>
            {tr("موضوع السؤال")}
            <input value={aiTopic} onChange={(event) => setAiTopic(event.target.value)} placeholder={tr("مثال: المصفوفات والحلقات")} minLength={3} maxLength={150} required />
          </label>
          <label>
            {tr("الصعوبة")}
            <select value={aiDifficulty} onChange={(event) => setAiDifficulty(event.target.value)}>
              <option value="easy">{tr("سهل")}</option>
              <option value="medium">{tr("متوسط")}</option>
              <option value="hard">{tr("صعب")}</option>
            </select>
          </label>
          <label>
            {tr("اللغة")}
            <select value={aiLanguage} onChange={(event) => setAiLanguage(event.target.value)}>
              <option value="cpp">C++</option>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
            </select>
          </label>
          <label>
            {tr("نمط التوليد")}
            <select value={aiMode} onChange={(event) => setAiMode(event.target.value)}>
              <option value="fast">{tr("سريع")}</option>
              <option value="quality">{tr("أدق")}</option>
            </select>
          </label>
          <button className="primary-action" type="submit" disabled={aiBusy}>
            {aiBusy ? tr("جارٍ توليد السؤال...") : tr("توليد سؤال")}
          </button>
        </form>
        <p className="ai-question-note">{tr("النمط السريع مناسب لمسودات الأسئلة اليومية. النمط الأدق قد يستغرق وقتًا أطول للمسائل المعقدة.")}</p>
        {aiError && <p className="form-error" role="alert">{tr(aiError)}</p>}
        {aiDraft && (
          <div className="ai-question-draft">
            <strong>{aiDraft.title}</strong>
            <p>{aiDraft.description}</p>
            <small>{tr("حالات الاختبار:")} {aiDraft.test_cases.length}</small>
            <button className="primary-action" type="button" onClick={useGeminiDraft}>{tr("فتح المسودة في نموذج الإضافة")}</button>
          </div>
        )}
        <p className="ai-question-note">{tr("المخرجات وحالات الاختبار المولّدة قد تحتوي أخطاء؛ راجعها قبل الحفظ.")}</p>
      </section>

      <section className="admin-v2-grid questions-grid">
        <article className="admin-v2-card" id="question-form-card">
          <span className="institution-admin-card-label">{tr("تفاصيل المسألة")}</span>
          <h2>{form.id ? tr("تعديل سؤال") : tr("إضافة سؤال")}</h2>
          <form className="admin-v2-form" onSubmit={handleSubmit}>
            <label>
              {tr("العنوان")}
              <input name="title" value={form.title} onChange={handleChange} required />
            </label>
            <label>
              {tr("الوصف")}
              <textarea name="description" value={form.description} onChange={handleChange} rows="5" required />
            </label>
            <label>
              {tr("وصف المدخلات")}
              <textarea name="input_sample" value={form.input_sample} onChange={handleChange} rows="2" />
            </label>
            <label>
              {tr("وصف المخرجات")}
              <textarea name="output_sample" value={form.output_sample} onChange={handleChange} rows="2" />
            </label>
            <div className="two-column-fields">
              <label>
                {tr("مثال إدخال")}
                <textarea name="example_input" value={form.example_input} onChange={handleChange} rows="3" />
              </label>
              <label>
                {tr("مثال إخراج")}
                <textarea name="example_output" value={form.example_output} onChange={handleChange} rows="3" />
              </label>
            </div>
            <label>
              {tr("حالات الاختبار")}
              <textarea name="test_cases" value={form.test_cases} onChange={handleChange} rows="6" dir="ltr" />
            </label>
            <label>
              {tr("اللغة")}
              <select name="language" value={form.language} onChange={handleChange}>
                <option value="cpp">C++</option>
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
              </select>
            </label>
            <button className="primary-action" type="submit">
              {form.id ? tr("حفظ التعديل") : tr("إضافة السؤال")}
            </button>
          </form>
          {message && <p className={message.startsWith("تم") ? "success-text" : "form-error"} role="status">{tr(message)}</p>}
        </article>

        <article className="admin-v2-card">
          <span className="institution-admin-card-label">{tr("الأسئلة المتاحة")}</span>
          <h2>{tr("قائمة الأسئلة")}</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{tr("العنوان")}</th>
                  <th>{tr("اللغة")}</th>
                  <th>{tr("الإجراءات")}</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((question, index) => (
                  <tr key={question.id}>
                    <td>{index + 1}</td>
                    <td>{question.title}</td>
                    <td>{question.language}</td>
                    <td>
                      <button onClick={() => setForm({ ...emptyForm, ...question })}>{tr("تعديل")}</button>
                      <button onClick={() => handleDelete(question.id)}>{tr("حذف")}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </main>
  );
}
