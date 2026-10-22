import { readApiResponse, userError } from "../services/apiErrors";
import { tr, useLocale } from "../i18n/LocaleContext";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import AdminPageHeader from "../components/AdminPageHeader";
import { useThemeMode } from "../theme/useThemeMode";
import "../App.css";

function formatDate(value) {
  return value || tr("غير متوفر");
}

function competitionStatusLabel(status) {
  const labels = {
    assigned: "مخصص",
    started: "بدأ",
    finished: "أنهى",
    locked: "مغلق",
  };
  return tr(labels[status] || status || "غير مخصص");
}

export default function AdminStudents() {
  const { direction } = useLocale();
  const navigate = useNavigate();
  const { themeClass } = useThemeMode();
  const [students, setStudents] = useState([]);
  const [meta, setMeta] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [deletingStudentId, setDeletingStudentId] = useState("");

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/get_students.php`);
      const data = await readApiResponse(response);

      if (response.ok && data.status === "success") {
        setStudents(data.students || []);
        setMeta(data.meta || null);
      } else {
        setMessage("تعذر تحميل بيانات الطلبة. تأكد من جاهزية قاعدة البيانات.");
      }
    } catch (error) {
      setMessage(userError(error, "تعذر تحميل بيانات الطلبة حاليًا. حاول مرة أخرى بعد قليل."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("admin-id")) {
      navigate("/admin-login", { replace: true });
      return;
    }

    fetchStudents();
  }, [fetchStudents, navigate]);

  const deleteStudent = async (student) => {
    const confirmed = window.confirm(
      `${tr("هل تريد حذف الطالب \"")}${student.student_name}${tr("\"؟ سيتم حذف بياناته المرتبطة من المسابقة حسب إعدادات قاعدة البيانات.")}`
    );
    if (!confirmed) return;

    setDeletingStudentId(student.student_id);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/delete_student.php`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ student_id: student.student_id }).toString(),
      });
      const data = await readApiResponse(response);

      if (response.ok && data.status === "success") {
        setStudents((current) => current.filter((item) => item.student_id !== student.student_id));
        setMessage("تم حذف الطالب بنجاح.");
      } else if (response.status === 404) {
        setMessage("الطالب غير موجود أو تم حذفه مسبقًا.");
        fetchStudents();
      } else {
        setMessage("تعذر حذف الطالب. تأكد من اتصال الخادم وقاعدة البيانات.");
      }
    } catch (error) {
      setMessage(userError(error, "تعذر الاتصال بالخادم أثناء حذف الطالب."));
    } finally {
      setDeletingStudentId("");
    }
  };

  const filteredStudents = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return students;

    return students.filter((student) => {
      const id = String(student.student_id || "").toLowerCase();
      const name = String(student.student_name || "").toLowerCase();
      return id.includes(normalized) || name.includes(normalized);
    });
  }, [searchTerm, students]);

  const totalSolved = students.reduce((sum, student) => sum + Number(student.solved_count || 0), 0);
  const totalAttempts = students.reduce((sum, student) => sum + Number(student.attempts_count || 0), 0);

  return (
    <main className={`admin-v2-shell institution-admin ${themeClass}`} dir={direction}>
      <AdminPageHeader section={tr("المشاركون")} title={tr("إدارة الطلبة")} description={tr("عرض بيانات الطلبة وحالة مشاركتهم في التحدي.")}>
          <button className="primary-action compact-action" onClick={() => navigate("/add-student")}>
            {tr("إضافة طالب")}
          </button>
          <button className="secondary-action" onClick={fetchStudents}>
            {tr("تحديث")}
          </button>
          <button className="secondary-action" onClick={() => navigate("/admin")}>
            {tr("لوحة التحكم")}
          </button>
      </AdminPageHeader>

      <section className="students-overview">
        <article className="student-stat-card">
          <span>{tr("عدد الطلبة")}</span>
          <strong>{students.length}</strong>
        </article>
        <article className="student-stat-card">
          <span>{tr("إجمالي الحلول الصحيحة")}</span>
          <strong>{totalSolved}</strong>
        </article>
        <article className="student-stat-card">
          <span>{tr("إجمالي المحاولات")}</span>
          <strong>{totalAttempts}</strong>
        </article>
        <article className="student-stat-card">
          <span>{tr("المسابقة الحالية")}</span>
          <strong>{meta?.active_session ? tr("مفتوحة") : tr("غير مفتوحة")}</strong>
        </article>
      </section>

      <section className="admin-v2-card students-card">
        <div className="students-toolbar">
          <div>
            <h2>{tr("قائمة الطلبة")}</h2>
            <p className="muted-text">
              {loading ? tr("جاري تحميل البيانات...") : `${tr("يتم عرض")} ${filteredStudents.length} ${tr("من")} ${students.length} ${tr("طالب.")}`}
            </p>
          </div>
          <label className="student-search">
            {tr("بحث")}
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={tr("اسم الطالب أو رقم القيد")}
            />
          </label>
        </div>

        {message && <p className="form-error">{tr(message)}</p>}

        {!loading && filteredStudents.length === 0 ? (
          <div className="empty-state">
            <h3>{tr("لا توجد بيانات مطابقة")}</h3>
            <p className="muted-text">{tr("أضف طالبًا جديدًا أو غيّر عبارة البحث الحالية.")}</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table students-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{tr("رقم القيد")}</th>
                  <th>{tr("اسم الطالب")}</th>
                  <th>{tr("تاريخ الإضافة")}</th>
                  <th>{tr("كلمة المرور")}</th>
                  <th>{tr("حالة المسابقة")}</th>
                  <th>{tr("الحلول")}</th>
                  <th>{tr("المحاولات")}</th>
                  <th>{tr("آخر نشاط")}</th>
                  <th>{tr("الإجراءات")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, index) => (
                  <tr key={student.student_id}>
                    <td>{index + 1}</td>
                    <td dir="ltr">{student.student_id}</td>
                    <td>{student.student_name}</td>
                    <td>{formatDate(student.created_at)}</td>
                    <td>{student.has_password ? tr("مفعلة") : tr("غير مفعلة")}</td>
                    <td>{competitionStatusLabel(student.competition_status)}</td>
                    <td>{student.solved_count || 0}</td>
                    <td>{student.attempts_count || 0}</td>
                    <td>{formatDate(student.last_activity)}</td>
                    <td>
                      <button
                        type="button"
                        className="secondary-action compact-action"
                        onClick={() => navigate(`/admin/students/${encodeURIComponent(student.student_id)}`)}
                      >
                        {tr("عرض الملف")}
                      </button>{" "}
                      <button
                        className="table-danger-action"
                        onClick={() => deleteStudent(student)}
                        disabled={deletingStudentId === student.student_id}
                      >
                        {deletingStudentId === student.student_id ? tr("جاري الحذف...") : tr("حذف")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
