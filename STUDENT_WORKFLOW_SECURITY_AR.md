# هيكلة تجربة الطالب والأمان

## هيكلة React المقترحة

```text
src/
  auth/
    AuthContext.js              # حفظ JWT وبيانات الطالب وحالة انتهاء المسابقة
  config/
    api.js                      # رابط الـ API وأسماء endpoints في مكان واحد
  routes/
    ProtectedRoute.js           # يمنع دخول الطالب غير المصادق
    CompetitionRoute.js         # يمنع الرجوع لمساحة المسابقة بعد القفل المحلي
  services/
    apiClient.js                # fetch موحد مع Bearer token ومعالجة أخطاء
  pages/
    LoginScreen.js              # دخول الطالب برقم القيد وكلمة المرور
    HomeScreen.js               # dashboard وبطاقة المسابقة الحالية
    QuizScreen.js               # workspace مقسوم ورفع حلول
    FinishScreen.js             # شاشة نهاية وقفل الرجوع
```

## سير العمل

1. المسؤول يضيف الطالب من لوحة الإدارة فقط.
2. الخادم يولد كلمة مرور عشوائية آمنة، يعرضها مرة واحدة للمسؤول، ويحفظ `password_hash`.
3. الطالب يسجل الدخول عبر `student_login.php` باستخدام `student_id` و`password`.
4. الخادم يرجع JWT قصير العمر يحتوي على `student_id`, `competition_id`, `exp`.
5. كل endpoint للطالب يتحقق من:
   - صحة توقيع JWT.
   - أن الطالب مرتبط بالمسابقة.
   - أن المسابقة active ولم تنته.
   - أن الطالب لم ينه الجلسة سابقا.
6. بعد الإرسال النهائي أو انتهاء الوقت، الواجهة تستخدم `navigate(..., { replace: true })` وتضع علامة انتهاء في `sessionStorage`.
7. أي محاولة API بعد النهاية يجب أن ترجع `403 Forbidden`.

## ERD مختصر

```text
students
  student_id PK
  student_name
  password_hash
  created_at

competitions
  id PK
  title
  description
  starts_at
  ends_at
  is_active
  created_at

competition_students
  competition_id FK -> competitions.id
  student_id FK -> students.student_id
  status ENUM('assigned','started','finished','locked')
  started_at
  finished_at
  PRIMARY KEY (competition_id, student_id)

questions
  id PK
  competition_id FK -> competitions.id
  title
  description
  language
  examples_json
  test_cases_json

submissions
  id PK
  competition_id FK -> competitions.id
  student_id FK -> students.student_id
  question_id FK -> questions.id
  source_path
  verdict ENUM('pending','accepted','wrong_answer','runtime_error','compile_error')
  score
  created_at
```

## عقود endpoints المطلوبة

```text
POST /student_login.php
body: student_id, password
returns: { status, token, student: { id, name } }

GET /student_competition_status.php
header: Authorization: Bearer <jwt>
returns: { competition: { id, title, description, is_active, remaining_seconds, questions_count } }

GET /get_student_questions.php
header: Authorization: Bearer <jwt>
returns: { questions: [{ id, title, description, language, examples: [{ input, output }] }] }

POST /submit_solution.php
header: Authorization: Bearer <jwt>
multipart: question_id, language, source_file
returns: { status, is_correct, message }

POST /finalize_competition.php
header: Authorization: Bearer <jwt>
returns: { status: "success" }
```

## حماية SQL Injection

كل استعلام يجب أن يستخدم prepared statements. مثال PHP/PDO:

```php
$stmt = $pdo->prepare(
    'SELECT student_id, student_name, password_hash
     FROM students
     WHERE student_id = :student_id
     LIMIT 1'
);
$stmt->execute(['student_id' => $studentId]);
$student = $stmt->fetch(PDO::FETCH_ASSOC);
```

## توليد كلمة المرور

```php
$plainPassword = bin2hex(random_bytes(8));
$passwordHash = password_hash($plainPassword, PASSWORD_DEFAULT);
```

يتم حفظ `password_hash` فقط، ولا يتم حفظ كلمة المرور الصريحة في قاعدة البيانات.
