import { useState } from "react";
import collegeLogo from "../assets/college-logo.jpg";
import { API_BASE_URL } from "../config/api";
import { tr } from "../i18n/LocaleContext";
import { isEnglishName, suggestEnglishName } from "../utils/englishStudentName";

function initialNames(session) {
  return Object.fromEntries(
    session.results.map((row) => [row.student_id, row.english_name || suggestEnglishName(row.student_name)])
  );
}

const ROWS_PER_PAGE = 12;

function reportPages(results) {
  if (results.length === 0) return [[]];
  const pages = [];
  for (let index = 0; index < results.length; index += ROWS_PER_PAGE) {
    pages.push(results.slice(index, index + ROWS_PER_PAGE));
  }
  return pages;
}

export default function ReportPdfPreview({ session, onClose, onNamesSaved }) {
  const [names, setNames] = useState(() => initialNames(session));
  const [reviewed, setReviewed] = useState(false);
  const [saved, setSaved] = useState(session.results.length === 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const invalidIds = session.results
    .filter((row) => !isEnglishName(names[row.student_id]))
    .map((row) => row.student_id);
  const pages = reportPages(session.results);

  const changeName = (studentId, value) => {
    setNames((previous) => ({ ...previous, [studentId]: value }));
    setSaved(false);
    setReviewed(false);
    setError("");
  };

  const saveNames = async () => {
    if (invalidIds.length) {
      setError(tr("استخدم أحرفًا إنجليزية لكل أسماء الطلبة قبل الحفظ."));
      return;
    }

    setSaving(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/save_student_english_names.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("admin-token") || ""}`,
        },
        body: JSON.stringify({
          names: session.results.map((row) => ({
            student_id: row.student_id,
            english_name: names[row.student_id].trim(),
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok || data.status !== "success") throw new Error(tr("تعذر حفظ الأسماء الإنجليزية. حاول مرة أخرى."));
      setNames((previous) => Object.fromEntries(Object.entries(previous).map(([id, value]) => [id, value.trim()])));
      setSaved(true);
      onNamesSaved(session.id, names);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const printReport = () => {
    if (!saved || !reviewed || invalidIds.length) return;
    const previousTitle = document.title;
    const restoreTitle = () => { document.title = previousTitle; };
    document.title = `Competition_Results_Session_${session.id}`;
    window.addEventListener("afterprint", restoreTitle, { once: true });
    window.print();
  };

  return (
    <div className="report-pdf-overlay" role="dialog" aria-modal="true" aria-labelledby="report-pdf-dialog-title">
      <div className="report-pdf-dialog">
        <div className="report-pdf-controls">
          <div className="report-pdf-dialog-heading">
            <div>
              <span className="institution-admin-card-label">{tr("تقرير PDF")}</span>
              <h2 id="report-pdf-dialog-title">{tr("مراجعة الأسماء الإنجليزية")}</h2>
              <p>{tr("التهجئة التلقائية مبدئية. صحح أسماء الطلبة ثم احفظها قبل طباعة التقرير الرسمي.")}</p>
            </div>
            <button type="button" className="secondary-action" onClick={onClose}>{tr("إغلاق")}</button>
          </div>

          {session.results.length > 0 && (
            <div className="report-name-review">
              {session.results.map((row) => (
                <label key={row.student_id}>
                  <span dir="auto">{row.student_name} <small dir="ltr">({row.student_id})</small></span>
                  <input
                    type="text"
                    dir="ltr"
                    lang="en"
                    maxLength={120}
                    value={names[row.student_id] || ""}
                    onChange={(event) => changeName(row.student_id, event.target.value)}
                    aria-invalid={invalidIds.includes(row.student_id)}
                    aria-label={`${tr("الاسم الإنجليزي")} - ${row.student_id}`}
                  />
                </label>
              ))}
            </div>
          )}

          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="report-pdf-review-actions">
            {session.results.length > 0 && (
              <button type="button" className="secondary-action" onClick={saveNames} disabled={saving || invalidIds.length > 0}>
                {saving ? tr("جارٍ الحفظ...") : tr("حفظ الأسماء الإنجليزية")}
              </button>
            )}
            <label className="report-review-confirmation">
              <input type="checkbox" checked={reviewed} onChange={(event) => setReviewed(event.target.checked)} />
              <span>{tr("راجعت تهجئة الأسماء الإنجليزية وأؤكد صحتها.")}</span>
            </label>
            <button type="button" className="primary-action" onClick={printReport} disabled={!saved || !reviewed || invalidIds.length > 0}>
              {tr("طباعة أو حفظ PDF")}
            </button>
          </div>
        </div>

        <div className={`report-pdf-sheet${saved && reviewed && invalidIds.length === 0 ? " is-approved" : ""}`} dir="ltr" lang="en">
          {pages.map((pageRows, pageIndex) => (
          <div className="report-pdf-page" key={pageIndex}>
          <table className="report-pdf-table">
            <thead>
              <tr>
                <th className="report-pdf-letterhead" colSpan="8">
                  <img src={collegeLogo} alt="" />
                  <div className="report-pdf-arabic-header" dir="rtl" lang="ar">
                    <strong>جامعة سرت</strong>
                    <span>كلية تقنية المعلومات</span>
                  </div>
                  <div className="report-pdf-title">Competition Results Report</div>
                  <div className="report-pdf-meta">
                    <span>Competition #{session.id}</span>
                    <span>Started: {session.start_time}</span>
                    <span>Ended: {session.end_time}</span>
                    <span>Participants: {session.results.length}</span>
                    <span>Problems: {session.total_questions}</span>
                    <span>Page {pageIndex + 1} of {pages.length}</span>
                  </div>
                </th>
              </tr>
              <tr className="report-pdf-columns">
                <th>Rank</th>
                <th>Student ID</th>
                <th>English Name</th>
                <th>Points</th>
                <th>Solved</th>
                <th>Submissions</th>
                <th>Wrong Attempts</th>
                <th>Penalty (min)</th>
              </tr>
            </thead>
            <tbody>
              {session.results.length === 0 ? (
                <tr><td colSpan="8" className="report-pdf-empty">No participants recorded for this competition.</td></tr>
              ) : pageRows.map((row) => (
                <tr key={row.student_id}>
                  <td>{row.rank}</td>
                  <td>{row.student_id}</td>
                  <td className="report-pdf-name">{names[row.student_id]}</td>
                  <td>{row.final_score}</td>
                  <td>{row.solved_count} / {session.total_questions}</td>
                  <td>{row.attempts_count}</td>
                  <td>{row.penalized_attempts}</td>
                  <td>{row.penalty_minutes}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {pageIndex === pages.length - 1 && (
          <>
          <p className="report-pdf-rule">
            Ranking: most solved problems, then lowest penalty time, then earliest last accepted solution. Each wrong attempt before an accepted solution adds {session.penalty_per_wrong_minutes} minutes. Unsolved problems and compilation errors carry no penalty.
          </p>
          <div className="report-pdf-footer">Faculty of Information Technology · University of Sirte</div>
          </>
          )}
          </div>
          ))}
        </div>
      </div>
    </div>
  );
}
