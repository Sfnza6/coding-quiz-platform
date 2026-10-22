# تشغيل المشروع محليًا — 22 أكتوبر 2026

## أسباب التعطل التي تأكدت منها

- مجلد الواجهة وصل بدون node_modules؛ تم تثبيت الحزم باستخدام npm ci.
- Docker كان يعمل والصور موجودة، لكن لم توجد أي حاويات Judge0؛ تم إنشاء وتشغيل server وworkers وPostgreSQL وRedis.
- ملفات Judge0 كانت في D:\judge0-transfer بينما دليل Backend يشير إلى مسار قديم. ملفات التشغيل الحالية أصبحت في .local/judge0 داخل هذا المشروع.
- الجهاز يستخدم cgroups v2. تم استخدام الصورة الموجودة local/judge0-cgv2:1.13.1-f39f5cd المتوافقة معه، ونجح التنفيذ الفعلي بها. هذه صورة fork وليست صورة الإصدار الرسمي المباشرة.

## أماكن الملفات

| الجزء | المسار |
| --- | --- |
| واجهة React | D:\coding-quiz-platform-main\coding-quiz-platform-main\src |
| إعداد عنوان API | src/config/api.js |
| طلبات الطالب | src/services/apiClient.js |
| Backend PHP | C:\xampp\htdocs\coding_quiz |
| تسليم الحل | C:\xampp\htdocs\coding_quiz\submit_solution.php |
| الاتصال بـJudge0 | C:\xampp\htdocs\coding_quiz\judge0_client.php |
| إعداد ربط PHP المحلي | C:\xampp\htdocs\coding_quiz\judge0_local_config.php |
| Docker Compose | .local/judge0/docker-compose.yml |
| إعداد Judge0 وكلمات المرور | .local/judge0/judge0.conf |
| قاعدة بيانات المنصة | MySQL: coding_quiz |

ملفات .local مستثناة من Git وتحتوي إعدادات محلية حساسة. استُخدم volume الموجود judge0-v1131_data كما هو، ولم تُستورد أو تُحذف قواعد البيانات. إعداد PHP الموجود كان متوافقًا مع رمز Judge0، فلم يحتج تعديلًا.

## التشغيل من PowerShell داخل مجلد المشروع

شغّل Apache وMySQL من XAMPP، وشغّل Docker Desktop، ثم:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/judge0.ps1 start
npm start
```

الواجهة: http://localhost:3000

Backend: http://localhost/coding_quiz

Judge0: http://127.0.0.1:2358 (يتطلب ترويسة المصادقة الموجودة في الإعداد المحلي).

```powershell
# حالة الحاويات
powershell -ExecutionPolicy Bypass -File scripts/judge0.ps1 status
# إيقاف Judge0 مع الاحتفاظ بالبيانات
powershell -ExecutionPolicy Bypass -File scripts/judge0.ps1 stop
# اختبار تنفيذ اللغات عبر عميل PHP الحقيقي
C:\xampp\php\php.exe scripts/check-judge0.php
```

## نتائج التحقق

- npm run build: نجح.
- اختبارات React: 3 مجموعات، 4 اختبارات، كلها ناجحة.
- Python وC++ وJavaScript وJava: Accepted والناتج 5 عبر عميل PHP المستخدم في تسليم الحلول.
- Apache وMySQL يعملان؛ قاعدة المنصة فيها 11 جدولًا و2 طلاب و3 أسئلة وقت الفحص.
- طلب student_competition_status.php بدون تسجيل دخول رجع 401 JSON كما هو متوقع.

## ملاحظات وحدود الفحص

- تحذيرات Browserslist وwebpack القديمة لم تمنع البناء. المشروع يستخدم react-scripts 5.
- يوجد تعريف student_me.php في src/config/api.js لكن الملف غير موجود في Backend. لم أجد استدعاءً حاليًا للدالة studentApi.me في الواجهة، لذلك هذا نقص محتمل إذا استُخدمت الدالة لاحقًا، وليس سبب التعطل الحالي.
- run_code_tests.php القديم ما زال يستخدم RapidAPI؛ مسار تسليم الطالب الحالي يستخدم submit_solution.php والعميل المحلي.
- لم يُختبر تسجيل الدخول بكلمة مرور أو تسليم حل داخل مسابقة فعلية؛ اختبارات Judge0 تمت مباشرة عبر عميل PHP دون تغيير نتائج الطلاب.
- مصدر الصورة المخصصة غير موجود ضمن ملفات المشروع المنقولة؛ صورتها موجودة في Docker ونسخة النقل في D:\judge0-transfer\judge0-images.tar.
- الوثائق الرسمية: https://github.com/judge0/judge0/releases/tag/v1.13.1
