# ملخص قاعدة البيانات بعد التعديل

هذا الملف يوضح التعديلات النهائية التي تجعل قاعدة بيانات منصة مسابقات البرمجة مناسبة للتوثيق كمشروع تخرج.

## الجداول الأساسية

### students
يحفظ بيانات الطلبة.

- `student_id`: رقم القيد، وهو مفتاح فريد.
- `student_name`: اسم الطالب.

### external_questions
يحفظ أسئلة البرمجة وحالات الاختبار.

- `title`: عنوان السؤال.
- `description`: نص السؤال.
- `language`: لغة البرمجة المطلوبة.
- `test_cases`: حالات الاختبار بصيغة JSON.

### competition_sessions
يحفظ كل جلسة مسابقة من وقت البداية إلى وقت الإغلاق.

- `id`: رقم المسابقة.
- `start_time`: وقت فتح المسابقة.
- `end_time`: وقت إغلاق المسابقة، ويكون `NULL` إذا كانت المسابقة مفتوحة.
- `created_at`: وقت إنشاء السجل.

### submission_attempts
يسجل كل محاولة رفع كود أثناء المسابقة.

- `session_id`: رقم المسابقة.
- `student_id`: رقم قيد الطالب.
- `question_index`: ترتيب السؤال داخل المسابقة.
- `is_correct`: هل كانت المحاولة صحيحة.
- `time_spent`: الوقت الذي استغرقه الطالب عند المحاولة.
- `submitted_at`: وقت إرسال المحاولة.

### question_solves
يسجل الحلول الصحيحة فقط.

- `session_id`: رقم المسابقة التي تم الحل فيها.
- `student_id`: رقم قيد الطالب.
- `question_index`: ترتيب السؤال.
- `time_spent`: وقت الحل.
- `solved_at`: وقت الحل المحسوب من الواجهة.
- `created_at`: وقت تسجيل الحل.

## العلاقات

- `submission_attempts.session_id` مرتبط مع `competition_sessions.id`.
- `submission_attempts.student_id` مرتبط مع `students.student_id`.
- `question_solves.session_id` مرتبط مع `competition_sessions.id`.
- `question_solves.student_id` مرتبط مع `students.student_id`.

## طريقة حساب النتائج

يتم ترتيب الطلبة حسب:

1. عدد الأسئلة المحلولة من الأكبر إلى الأصغر.
2. عدد المحاولات من الأقل إلى الأكثر.
3. وقت الحل الإجمالي من الأقل إلى الأكثر.

معادلة النقاط:

```text
final_score = solved_count * 1000 - attempts_count * 50 - total_time
```

## ملف التحديث

ملف التحديث الخاص بهذه التعديلات:

```text
database_updates/competition_scoring_attempts.sql
```

يمكن تشغيله على قاعدة بيانات `coding_quiz` قبل العرض النهائي أو بعد استيراد نسخة جديدة من القاعدة.
