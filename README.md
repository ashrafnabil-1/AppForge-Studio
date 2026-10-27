# AppForge Studio

منصة عربية RTL لبناء مخطط واجهة مرئي من الهاتف، مع تصدير JSON ومولّدين أوليين لمخرجات Flutter وWeb. هذه نسخة MVP قابلة للتطوير وليست بديلًا عن اختبار التطبيق النهائي قبل النشر.

## الميزات الحالية

- واجهة React + TypeScript + Vite بالعربية واتجاه RTL.
- إضافة عناصر واجهة أساسية وتعديل النص والألوان والمحاذاة والحجم.
- دعم بنية عناصر متداخلة: حدّد بطاقة أو حاوية أو صفًا أو عمودًا، ثم أضف عنصرًا ليصبح طفلًا بداخلها.
- تحديد العناصر المتداخلة وتعديل خصائصها وحذفها.
- صفحات متعددة، تراجع/إعادة، حفظ محلي تلقائي، واستيراد/تصدير JSON مع تحقق Zod.
- مولّد Flutter ينتج `lib/main.dart` و`pubspec.yaml` واختبار Widget، مع دعم العناصر المتداخلة.
- مولّد Web ينتج صفحة HTML ثابتة متعددة الصفحات من مخطط JSON.
- اختبارات للمخطط والمولّدين.
- GitHub Actions للتحقق من تطبيق الويب وبناء APK كـArtifact.

## التشغيل من Termux أو أي بيئة Node.js

يتطلب Node.js 20 أو أحدث وnpm.

```sh
npm install
npm test
npm run build
npm run dev -- --host 0.0.0.0
```

افتح العنوان الذي يعرضه Vite في متصفح الهاتف، عادةً `http://127.0.0.1:5173`.

## توليد نسخة ويب ثابتة

```sh
node tools/generate-web.mjs examples/starter-project.json generated_web
```

سيظهر `generated_web/index.html`. يمكنك فتحه مباشرة أو رفع المجلد إلى خدمة استضافة ملفات ثابتة.

## توليد مصدر Flutter

```sh
node tools/generate-flutter.mjs examples/starter-project.json generated_flutter
```

المولّد يكتب ملفات المصدر الأساسية. لبناء APK تحتاج Flutter SDK وAndroid SDK، وإنشاء هيكل مشروع Android أولًا:

```sh
flutter create --project-name appforge_generated_app --platforms=android generated_flutter
node tools/generate-flutter.mjs examples/starter-project.json generated_flutter
cd generated_flutter
flutter pub get
flutter analyze --no-pub --no-fatal-infos
flutter test
flutter build apk --release
```

ملف APK لا يُنشأ بمجرد تشغيل مولّد Node؛ يجب تنفيذ خطوات Flutter بنجاح. في GitHub Actions، افتح تبويب **Actions** ثم تشغيل البناء الناجح ونزّل `appforge-generated-apk` من **Artifacts**.

## GitHub Actions

- `Validate AppForge Web`: يشغّل الاختبارات وبناء Vite.
- `Generate and Build Android APK`: ينشئ هيكل Flutter/Android، ويولّد المصدر من المثال، ثم يحلّل ويختبر ويبني APK ويرفعه كـArtifact.

تعمل هذه المسارات عند الأحداث المحددة في ملفات `.github/workflows/`، ويمكن تشغيل مسار Android يدويًا من تبويب Actions إذا كان `workflow_dispatch` متاحًا.

## حدود النسخة الحالية

- زر Flutter المولّد يعرض رسالة مؤقتة؛ لا توجد بعد إجراءات مخصصة أو محرر ربط أزرار بالصفحات.
- الصور عناصر نائبة، وليست رفعًا أو إدارة ملفات صور حقيقية.
- لا توجد مزامنة سحابية أو Firebase أو تسجيل دخول.
- معاينة المحرر ليست مطابقة تمامًا لتطبيق Android النهائي.
- لم يُرفق APK مبني مسبقًا؛ يتم بناؤه في بيئة Flutter/Android أو GitHub Actions.

## رفع المشروع من الهاتف

بعد فك ضغط الملف والدخول إلى مجلد المشروع:

```sh
git init
git add .
git commit -m "AppForge Studio MVP"
git branch -M main
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git push -u origin main
```

استبدل `USERNAME/REPOSITORY` بعنوان مستودعك. لا تضع رموز الوصول أو كلمات المرور داخل الملفات.

## الخصوصية والأمان

- بيانات المحرر تُحفظ محليًا في متصفحك.
- لا تضف أسرار API أو مفاتيح خاصة إلى المستودع.
- راجع واختبر المخرجات قبل استخدامها مع بيانات حقيقية أو نشرها للمستخدمين.
