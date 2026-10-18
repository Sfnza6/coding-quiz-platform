import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import AdminPageHeader from "../components/AdminPageHeader";
import { useThemeMode } from "../theme/useThemeMode";
import "../App.css";

function formatDate(value) {
  return value || "غير متوفر";
}

export default function AdminStudents() {
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
      const data = await response.json();

      if (response.ok && data.status === "success") {
        setStudents(data.students || []);
        setMeta(data.meta || null);
      } else {
        setMessage("تعذر تحميل بيانات الطلبة. تأكد من جاهزية قاعدة البيانات.");
      }
    } catch {
      setMessage("تعذر تحميل بيانات الطلبة حاليًا. حاول مرة أخرى بعد قليل.");
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
      `هل تريد حذف الطالب "${student.student_name}"؟ سيتم حذف بياناته المرتبطة من المسابقة حسب إعدادات قاعدة البيانات.`
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
      const data = await response.json();

      if (response.ok && data.status === "success") {
        setStudents((current) => current.filter((item) => item.student_id !== student.student_id));
        setMessage("تم حذف الطالب بنجاح.");
      } else if (response.status === 404) {
        setMessage("الطالب غير موجود أو تم حذفه مسبقًا.");
        fetchStudents();
      } else {
        setMessage("تعذر حذف الطالب. تأكد من اتصال الخادم وقاعدة البيانات.");
      }
    } catch {
      setMessage("تعذر الاتصال بالخادم أثناء حذف الطالب.");
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
    <main className={`admin-v2-shell institution-admin ${themeClass}`} dir="rtl">
      <AdminPageHeader section="المشاركون" title="إدارة الطلبة" description="عرض بيانات الطلبة وحالة مشاركتهم في التحدي.">
          <button className="primary-action compact-action" onClick={() => navigate("/add-student")}>
            إضافة طالب
          </button>
          <button className="secondary-action" onClick={fetchStudents}>
            تحديث
          </button>
          <button className="secondary-action" onClick={() => navigate("/admin")}>
            لوحة التحكم
          </button>
      </AdminPageHeader>

      <section className="students-overview">
        <article className="student-stat-card">
          <span>عدد الطلبة</span>
          <strong>{students.length}</strong>
        </article>
        <article className="student-stat-card">
          <span>إجمالي الحلول الصحيحة</span>
          <strong>{totalSolved}</strong>
        </article>
        <article className="student-stat-card">
          <span>إجمالي المحاولات</span>
          <strong>{totalAttempts}</strong>
        </article>
        <article className="student-stat-card">
          <span>المسابقة الحالية</span>
          <strong>{meta?.active_session ? "مفتوحة" : "غير مفتوحة"}</strong>
        </article>
      </section>

      <section className="admin-v2-card students-card">
        <div className="students-toolbar">
          <div>
            <h2>قائمة الطلبة</h2>
            <p className="muted-text">
              {loading ? "جاري تحميل البيانات..." : `يتم عرض ${filteredStudents.length} من ${students.length} طالب.`}
            </p>
          </div>
          <label className="student-search">
            بحث
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="اسم الطالب أو رقم القيد"
            />
          </label>
        </div>

        {message && <p className="form-error">{message}</p>}

        {!loading && filteredStudents.length === 0 ? (
          <div className="empty-state">
            <h3>لا توجد بيانات مطابقة</h3>
            <p className="muted-text">أضف طالبًا جديدًا أو غيّر عبارة البحث الحالية.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table students-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>رقم القيد</th>
                  <th>اسم الطالب</th>
                  <th>تاريخ الإضافة</th>
                  <th>كلمة المرور</th>
                  <th>حالة المسابقة</th>
                  <th>الحلول</th>
                  <th>المحاولات</th>
                  <th>آخر نشاط</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, index) => (
                  <tr key={student.student_id}>
                    <td>{index + 1}</td>
                    <td dir="ltr">{student.student_id}</td>
                    <td>{student.student_name}</td>
                    <td>{formatDate(student.created_at)}</td>
                    <td>{student.has_password ? "مفعلة" : "غير مفعلة"}</td>
                    <td>{student.competition_status || "غير مخصص"}</td>
                    <td>{student.solved_count || 0}</td>
                    <td>{student.attempts_count || 0}</td>
                    <td>{formatDate(student.last_activity)}</td>
                    <td>
                      <button
                        className="table-danger-action"
                        onClick={() => deleteStudent(student)}
                        disabled={deletingStudentId === student.student_id}
                      >
                        {deletingStudentId === student.student_id ? "جاري الحذف..." : "حذف"}
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
