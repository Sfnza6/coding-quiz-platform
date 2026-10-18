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
    if (!window.confirm("هل تريد حذف هذا السؤال؟")) return;

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
    <main className={`admin-v2-shell institution-admin ${themeClass}`} dir="rtl">
      <AdminPageHeader section="محتوى التحدي" title="إدارة الأسئلة" description="أضف المسائل البرمجية وعدّلها وتابع قائمة الأسئلة.">
          <button className="secondary-action" onClick={() => navigate("/admin")}>
            لوحة التحكم
          </button>
          <button className="secondary-action" onClick={() => navigate("/results")}>
            النتائج
          </button>
      </AdminPageHeader>

      <section className="admin-v2-card ai-question-card" aria-labelledby="ai-question-title">
        <div>
          <span className="institution-admin-card-label">مساعد الإدارة</span>
          <h2 id="ai-question-title">توليد مسودة سؤال باستخدام نموذج الذكاء الاصطناعي </h2>
          <p>اختر موضوعًا ومستوى الصعوبة. ستظهر المسودة للمراجعة قبل إضافتها إلى المسابقة.</p>
        </div>
        <form className="ai-question-form" onSubmit={generateGeminiQuestion}>
          <label>
            موضوع السؤال
            <input value={aiTopic} onChange={(event) => setAiTopic(event.target.value)} placeholder="مثال: المصفوفات والحلقات" minLength={3} maxLength={150} required />
          </label>
          <label>
            الصعوبة
            <select value={aiDifficulty} onChange={(event) => setAiDifficulty(event.target.value)}>
              <option value="easy">سهل</option>
              <option value="medium">متوسط</option>
              <option value="hard">صعب</option>
            </select>
          </label>
          <label>
            اللغة
            <select value={aiLanguage} onChange={(event) => setAiLanguage(event.target.value)}>
              <option value="cpp">C++</option>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
            </select>
          </label>
          <label>
            نمط التوليد
            <select value={aiMode} onChange={(event) => setAiMode(event.target.value)}>
              <option value="fast">سريع</option>
              <option value="quality">أدق</option>
            </select>
          </label>
          <button className="primary-action" type="submit" disabled={aiBusy}>
            {aiBusy ? "جارٍ توليد السؤال..." : "توليد سؤال"}
          </button>
        </form>
        <p className="ai-question-note">النمط السريع مناسب لمسودات الأسئلة اليومية. النمط الأدق قد يستغرق وقتًا أطول للمسائل المعقدة.</p>
        {aiError && <p className="form-error" role="alert">{aiError}</p>}
        {aiDraft && (
          <div className="ai-question-draft">
            <strong>{aiDraft.title}</strong>
            <p>{aiDraft.description}</p>
            <small>حالات الاختبار: {aiDraft.test_cases.length}</small>
            <button className="primary-action" type="button" onClick={useGeminiDraft}>فتح المسودة في نموذج الإضافة</button>
          </div>
        )}
        <p className="ai-question-note">المخرجات وحالات الاختبار المولّدة قد تحتوي أخطاء؛ راجعها قبل الحفظ.</p>
      </section>

      <section className="admin-v2-grid questions-grid">
        <article className="admin-v2-card" id="question-form-card">
          <span className="institution-admin-card-label">تفاصيل المسألة</span>
          <h2>{form.id ? "تعديل سؤال" : "إضافة سؤال"}</h2>
          <form className="admin-v2-form" onSubmit={handleSubmit}>
            <label>
              العنوان
              <input name="title" value={form.title} onChange={handleChange} required />
            </label>
            <label>
              الوصف
              <textarea name="description" value={form.description} onChange={handleChange} rows="5" required />
            </label>
            <label>
              وصف المدخلات
              <textarea name="input_sample" value={form.input_sample} onChange={handleChange} rows="2" />
            </label>
            <label>
              وصف المخرجات
              <textarea name="output_sample" value={form.output_sample} onChange={handleChange} rows="2" />
            </label>
            <div className="two-column-fields">
              <label>
                مثال إدخال
                <textarea name="example_input" value={form.example_input} onChange={handleChange} rows="3" />
              </label>
              <label>
                مثال إخراج
                <textarea name="example_output" value={form.example_output} onChange={handleChange} rows="3" />
              </label>
            </div>
            <label>
              حالات الاختبار
              <textarea name="test_cases" value={form.test_cases} onChange={handleChange} rows="6" dir="ltr" />
            </label>
            <label>
              اللغة
              <select name="language" value={form.language} onChange={handleChange}>
                <option value="cpp">C++</option>
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
              </select>
            </label>
            <button className="primary-action" type="submit">
              {form.id ? "حفظ التعديل" : "إضافة السؤال"}
            </button>
          </form>
          {message && <p className={message.startsWith("تم") ? "success-text" : "form-error"} role="status">{message}</p>}
        </article>

        <article className="admin-v2-card">
          <span className="institution-admin-card-label">الأسئلة المتاحة</span>
          <h2>قائمة الأسئلة</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>العنوان</th>
                  <th>اللغة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((question, index) => (
                  <tr key={question.id}>
                    <td>{index + 1}</td>
                    <td>{question.title}</td>
                    <td>{question.language}</td>
                    <td>
                      <button onClick={() => setForm({ ...emptyForm, ...question })}>تعديل</button>
                      <button onClick={() => handleDelete(question.id)}>حذف</button>
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
