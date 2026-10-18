# ملخص العمل المنجز على منصة التحدي البرمجي

## نظرة عامة

تم تطوير منصة المسابقة البرمجية بحيث تصبح أكثر استقراراً وعدلاً في حساب النتائج، مع فصل واضح بين:

- لوحة التحكم.
- صفحة النتائج اللحظية للمسابقة المفتوحة.
- صفحة تقارير المسابقات السابقة.
- تشغيل الكود عبر الخادم بدلاً من المتصفح.
- حساب الترتيب بناءً على الدقة، ثم عدد المحاولات، ثم الوقت.

تم تنفيذ تعديلات الواجهة داخل مشروع React، وتعديلات ملفات PHP داخل مجلد السيرفر:

```text
C:\xampp\htdocs\coding_quiz
```

---

## 1. إصلاح مشاكل الاتصال والترميز

### المشكلة

كانت الواجهة تعرض رسائل مثل:

```text
فشل الاتصال بالخادم
```

وفي بعض الصفحات كانت النصوص العربية تظهر بشكل غير مفهوم بسبب مشكلة ترميز.

### ما تم عمله

- إعادة حفظ ملفات PHP بدون `UTF-8 BOM` حتى يرجع السيرفر JSON نظيف.
- إصلاح النصوص العربية المتكسرة في صفحات React الأساسية.
- التأكد من وجود:

```html
<meta charset="utf-8" />
```

داخل `public/index.html`.

### النتيجة

- صفحات الواجهة صارت تعرض العربية بشكل صحيح.
- `fetch(...).then(res => res.json())` صار يعمل بدون فشل بسبب محارف مخفية قبل JSON.

---

## 2. نقل Judge0 من المتصفح إلى الخادم

### المشكلة

كان مفتاح RapidAPI/Judge0 موجوداً داخل React، وهذا يعرضه لأي مستخدم يفتح أدوات المطور.

### ما تم عمله

- إنشاء/تحديث endpoint:

```text
C:\xampp\htdocs\coding_quiz\run_code_tests.php
```

- نقل استدعاء Judge0 إلى PHP backend.
- جعل React يرسل الكود إلى:

```text
http://localhost/coding_quiz/run_code_tests.php
```

بدلاً من الاتصال المباشر بـ Judge0.

- إضافة ملف إعداد حقيقي:

```text
C:\xampp\htdocs\coding_quiz\judge0_config.php
```

- إبقاء ملف المثال:

```text
C:\xampp\htdocs\coding_quiz\judge0_config.example.php
```

### النتيجة

- مفتاح Judge0 لم يعد موجوداً في كود الواجهة.
- التحقق من الكود صار يتم من الخادم.

---

## 3. تحسين مقارنة المخرجات

### المشكلة

لو برنامج الطالب طبع نصاً توضيحياً قبل الإجابة مثل:

```text
Enter a string: Number of uppercase letters = 3
```

وكان الناتج المتوقع:

```text
3
```

كان النظام يعتبر الإجابة خاطئة.

### ما تم عمله

تعديل المقارنة في:

```text
C:\xampp\htdocs\coding_quiz\run_code_tests.php
```

بحيث تقبل:

- التطابق الكامل.
- أو أن تكون آخر القيم المطبوعة مطابقة للناتج المتوقع.

### النتيجة

الإجابات التي تحتوي prompts قبل الناتج النهائي يمكن قبولها إذا كان الناتج النهائي صحيحاً.

---

## 4. إصلاح مؤقت المسابقة

### المشكلة

الواجهة كانت تتوقع من:

```text
check_competition.php
```

قيمة:

```text
remaining_seconds
```

لكن الخادم لم يكن يرجعها في البداية.

### ما تم عمله

- تعديل:

```text
C:\xampp\htdocs\coding_quiz\check_competition.php
```

- إرجاع:

```json
{
  "is_started": true,
  "start_time": 123456789,
  "duration_seconds": 600,
  "remaining_seconds": 500,
  "session_id": 1
}
```

### النتيجة

المؤقت في صفحة الطالب صار مرتبطاً بالخادم وبجلسة المسابقة الحالية.

---

## 5. إضافة جلسات المسابقة

### الهدف

ربط النتائج بوقت بداية ونهاية كل مسابقة، بحيث:

- النتائج اللحظية تظهر للمسابقة المفتوحة فقط.
- التقارير تعرض المسابقات السابقة فقط.

### ما تم عمله

إضافة جدول تلقائي:

```sql
competition_sessions
```

يحتوي على:

- `id`
- `start_time`
- `end_time`
- `created_at`

### الملفات المرتبطة

```text
C:\xampp\htdocs\coding_quiz\competition_helpers.php
C:\xampp\htdocs\coding_quiz\start_competition.php
C:\xampp\htdocs\coding_quiz\stop_competition.php
C:\xampp\htdocs\coding_quiz\check_competition.php
```

### السلوك الجديد

- عند بدء المسابقة يتم إنشاء جلسة جديدة.
- عند إيقاف المسابقة يتم إغلاق الجلسة بتسجيل `end_time`.
- إذا انتهى وقت المسابقة تلقائياً، يتم إغلاق الجلسة أيضاً.

---

## 6. فصل النتائج عن لوحة التحكم

### قبل التعديل

لوحة التحكم كانت تعرض النتائج مباشرة داخل نفس الصفحة.

### بعد التعديل

تم فصل الصفحات:

### لوحة التحكم

المسار:

```text
/admin
```

تحتوي على أزرار:

- إدارة الأسئلة.
- تسجيل طالب جديد.
- النتائج.
- تقارير المسابقات.
- بدء المسابقة.
- إيقاف المسابقة.

### صفحة النتائج

المسار:

```text
/results
```

تعرض نتائج المسابقة المفتوحة فقط.

لو لا توجد مسابقة مفتوحة، تعرض رسالة مناسبة.

### صفحة التقارير

المسار:

```text
/reports
```

تعرض نتائج كل المسابقات السابقة المغلقة.

---

## 7. إضافة تقارير المسابقات السابقة

### ما تم عمله

إضافة endpoint:

```text
C:\xampp\htdocs\coding_quiz\get_competition_reports.php
```

وصفحة React:

```text
src/pages/CompetitionReports.js
```

### ما تعرضه الصفحة

لكل مسابقة سابقة:

- رقم المسابقة.
- وقت البداية.
- وقت النهاية.
- ترتيب الطلبة.
- الدقة.
- عدد المحاولات.
- الوقت.
- النقاط.

---

## 8. إضافة النتائج اللحظية

### ما تم عمله

إضافة endpoint:

```text
C:\xampp\htdocs\coding_quiz\get_current_results.php
```

وصفحة React:

```text
src/pages/AdminResults.js
```

### ما تعرضه الصفحة

أثناء وجود مسابقة مفتوحة:

- كل الطلبة.
- عدد الأسئلة الصحيحة.
- عدد المحاولات.
- الوقت.
- النقاط.
- الترتيب اللحظي.

يتم تحديث الصفحة كل ثانيتين.

---

## 9. اعتماد معيار الدقة والمحاولات والوقت

### السيناريو المعتمد

الترتيب يتم حسب:

1. عدد الأسئلة الصحيحة الأعلى.
2. عدد المحاولات الأقل.
3. الوقت الأقل.

### معادلة النقاط

```text
النقاط = (عدد الأسئلة الصحيحة × 1000) - (عدد المحاولات × 50) - مجموع الوقت
```

### مثال

| الطالب | الصحيح | المحاولات | الوقت | النقاط |
|---|---:|---:|---:|---:|
| أحمد | 3 | 4 | 500 | 2300 |
| علي | 3 | 6 | 430 | 2270 |
| محمد | 2 | 2 | 200 | 1700 |

الترتيب:

1. أحمد
2. علي
3. محمد

لأن الدقة أهم، ثم عدد المحاولات، ثم الوقت.

---

## 10. تسجيل كل محاولة

### المشكلة السابقة

كان النظام يسجل الحل فقط إذا كان صحيحاً.

هذا لا يسمح بحساب عدد المحاولات.

### ما تم عمله

إضافة جدول تلقائي:

```sql
submission_attempts
```

يسجل:

- رقم جلسة المسابقة.
- رقم الطالب.
- اسم الطالب.
- رقم السؤال.
- هل المحاولة صحيحة.
- الوقت عند المحاولة.
- وقت الإرسال.

### السلوك الجديد

- كل رفع ملف = محاولة.
- إذا فشل الاختبار، يتم تسجيل محاولة خاطئة.
- إذا نجح الاختبار، يتم تسجيل محاولة صحيحة وتسجيل السؤال كحل صحيح.
- إذا كان السؤال محلولاً مسبقاً في نفس المسابقة، لا يتم احتساب محاولة إضافية لنفس السؤال.

---

## 11. حماية تسجيل النتائج

### قبل التعديل

كانت الواجهة تستطيع إرسال `score` مباشرة إلى `submit_attempt.php`.

### بعد التعديل

تم تعديل:

```text
C:\xampp\htdocs\coding_quiz\submit_attempt.php
```

بحيث يحسب:

- عدد الأسئلة الصحيحة.
- الوقت.
- النسبة.

من قاعدة البيانات وضمن جلسة المسابقة الحالية فقط.

### النتيجة

لم يعد الاعتماد الأساسي على الدرجة القادمة من المتصفح.

---

## 12. أهم ملفات PHP التي تم تعديلها أو إضافتها

```text
C:\xampp\htdocs\coding_quiz\competition_helpers.php
C:\xampp\htdocs\coding_quiz\start_competition.php
C:\xampp\htdocs\coding_quiz\stop_competition.php
C:\xampp\htdocs\coding_quiz\check_competition.php
C:\xampp\htdocs\coding_quiz\run_code_tests.php
C:\xampp\htdocs\coding_quiz\submit_attempt.php
C:\xampp\htdocs\coding_quiz\get_current_results.php
C:\xampp\htdocs\coding_quiz\get_competition_reports.php
C:\xampp\htdocs\coding_quiz\log_question_solve.php
C:\xampp\htdocs\coding_quiz\judge0_config.php
C:\xampp\htdocs\coding_quiz\judge0_config.example.php
```

---

## 13. أهم ملفات React التي تم تعديلها أو إضافتها

```text
src/App.js
src/pages/QuizScreen.js
src/pages/AdminPanel.js
src/pages/AdminResults.js
src/pages/CompetitionReports.js
src/pages/AdminQuestions.js
src/pages/LoginScreen.js
src/pages/HomeScreen.js
src/pages/AdminLoginScreen.js
src/pages/AddStudentScreen.js
src/pages/FinishScreen.js
```

---

## 14. مسارات الواجهة الحالية

```text
/                  تسجيل دخول الطالب
/home              صفحة الطالب الرئيسية
/quiz              صفحة المسابقة
/finish            صفحة نهاية الاختبار
/admin-login       تسجيل دخول المسؤول
/admin             لوحة التحكم
/admin-questions   إدارة الأسئلة
/add-student       إضافة طالب
/results           النتائج اللحظية
/reports           تقارير المسابقات السابقة
```

---

## 15. التحقق الذي تم

تم تشغيل:

```text
npm.cmd run build
```

وكان البناء ناجحاً.

وتم تشغيل PHP lint على ملفات:

```text
C:\xampp\htdocs\coding_quiz
```

وكانت الملفات سليمة من أخطاء syntax.

---

## ملاحظات مهمة

- التقارير القديمة تبدأ من المسابقات التي تم فتحها وإغلاقها بعد إضافة جدول `competition_sessions`.
- مفتاح Judge0 موجود في:

```text
C:\xampp\htdocs\coding_quiz\judge0_config.php
```

- ملف `judge0_config.example.php` يجب أن يبقى مثالاً فقط ولا يحتوي مفتاحاً حقيقياً عند النشر.
- لو ظهرت نصوص أسئلة أو أسماء متكسرة، فهذا يعني أن البيانات نفسها في MySQL مخزنة بترميز غير صحيح وتحتاج تنظيف داخل قاعدة البيانات.

