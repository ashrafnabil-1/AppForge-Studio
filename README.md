# AppForge Studio — النواة الأولية

منصة ويب عربية RTL أولية لمحرر مرئي لمخطط تطبيقات. هذه **نواة قابلة للتطوير** وليست منصة مكتملة، ولا تدّعي حاليًا توليد مشروع Flutter أو APK.

## ما يعمل في هذه النسخة
- واجهة React + TypeScript + Vite متجاوبة بالعربية.
- إنشاء مشروع تجريبي جديد، إضافة عناصر أساسية وتحديدها وحذفها.
- تعديل النص، اللون، حجم الخط، والمحاذاة للعناصر المدعومة.
- إضافة صفحات والتبديل بينها.
- حفظ تلقائي في `localStorage` مع تحميل أولي آمن.
- تصدير المخطط بصيغة JSON واستيراده مع التحقق باستخدام Zod.
- تراجع/إعادة ضمن جلسة المحرر.
- اختبارات لمخطط البيانات واستيراد/تصدير JSON.

## غير منفذ بعد
- مولّد أولي مستقل لملفات Flutter/Dart عبر `tools/generate-flutter.mjs` من JSON.
- Workflow لبناء APK حقيقي من المثال عبر GitHub Actions، لكن لم يُشغّل بعد في GitHub؛ لا يوجد APK مرفق في ZIP.
- Firebase أو REST أو تسجيل دخول أو مزامنة سحابية.
- محرر إجراءات مرئي كامل، وإعادة ترتيب بالسحب، ورفع صور حقيقي.
- معاينة مطابقة 100% لسلوك تطبيق Android النهائي.

## المتطلبات
- Node.js 20 أو أحدث وnpm. يمكن استخدام GitHub Codespaces أو بيئة تطوير ويب من الهاتف إذا لم يتوفر Node داخل Termux.
- Termux حديث من مصدر موثوق، عند تشغيل الأوامر محليًا.

## التشغيل من Termux (Android)
```sh
pkg update
pkg install nodejs git unzip
node --version
npm --version
cd appforge-studio
npm install
npm test
npm run build
npm run dev -- --host 0.0.0.0
```
افتح عنوان Vite الذي يظهر في Termux من متصفح الهاتف. إذا كان `localhost` غير متاح بسبب إعدادات الشبكة، استخدم عنوان `http://127.0.0.1:5173`.

## تشغيل الاختبارات والبناء
```sh
npm test
npm run build
```
الاختبارات تتحقق من بنية المخطط والتصدير والاستيراد. Workflow `Validate AppForge Web` يشغّل الاختبارات وبناء الويب عند رفع المستودع. Workflow `Generate and Build Android APK` يولّد مشروع Flutter من `examples/starter-project.json` ثم يحلّل ويختبر ويبني APK ويرفعه كـArtifact. لم يتم تشغيل Workflow سحابيًا من هنا.

## تصدير واستيراد
من شريط الأدوات اختر «تصدير JSON» لحفظ المخطط. لاستيراده اختر ملف JSON. تحقّق المنصة من المخطط قبل استبدال المشروع الحالي.

## رفع المشروع إلى GitHub من الهاتف
1. فك ضغط ZIP في Termux.
2. أنشئ مستودعًا فارغًا من موقع GitHub عبر المتصفح.
3. داخل مجلد المشروع نفّذ:
```sh
git init
git add .
git commit -m "Initial AppForge Studio MVP"
git branch -M main
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git push -u origin main
```
استبدل `USERNAME/REPOSITORY` بعنوان مستودعك. لا تضع كلمة مرور أو PAT داخل الملفات. إذا طلب Git مصادقة، استخدم طريقة المصادقة الرسمية من GitHub.

## خطة التطوير المقترحة
1. تثبيت مخطط JSON وإضافة migrations.
2. بناء اختبارات تفاعلية وواجهة إدارة مشاريع.
3. تطوير مولّد Flutter مع قوالب موثوقة واختبار build في CI.
4. إضافة إجراءات محدودة ذات أنواع واضحة، لا تنفيذ نصوص عشوائية.
5. إضافة مزود بيانات محلي ثم Firebase مع قواعد أمان.
6. إضافة GitHub Actions لبناء APK كـArtifact بعد اختبار مشروع مولّد حقيقي.

## الأمان
- لا توجد أسرار أو مفاتيح API في هذا المستودع.
- بيانات المشاريع في هذه النسخة محفوظة محليًا في المتصفح فقط.
- إعدادات Firebase العامة ليست بديلًا عن Security Rules.
- لا تستخدم بيانات حقيقية حساسة في النسخة الأولية.


## مولّد Flutter (نسخة أولية)
يمكن توليد مشروع Flutter من مخطط JSON على أي بيئة فيها Node.js:
```sh
node tools/generate-flutter.mjs examples/starter-project.json generated_flutter
```
ينشئ المولّد `lib/main.dart` و`pubspec.yaml` وملف manifest واختبار widget. ثم على بيئة Flutter:
```sh
cd generated_flutter
flutter pub get
flutter analyze
flutter test
flutter build apk --release
```
المولّد الحالي يغطي العناصر الأساسية فقط. عناصر الصورة والصفوف/الأعمدة/القوائم هي تمثيلات أولية وليست تنفيذًا كاملًا لكل دلالاتها. Workflow أندرويد يعيد توليد المشروع عند التشغيل ولا يضع APK في المستودع؛ تحصل عليه من تبويب Actions ثم Artifacts بعد نجاح البناء.
