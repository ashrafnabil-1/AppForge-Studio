# مخطط AppForge JSON — الإصدار 1

الملف `src/engine/schema.ts` هو المرجع البرمجي للمخطط والتحقق.

## الشكل العام
- `schemaVersion`: رقم إصدار المخطط.
- `project`: معرّف المشروع واسمه ومعرّف الحزمة ولون العلامة.
- `pages`: صفحات المشروع.
- `dataSources`: قائمة مصادر البيانات (محلية افتراضيًا).
- كل صفحة لها `id`, `name`, `nodes`.
- كل عنصر له `id`, `type`, `props`، ويمكن أن يحتوي `children`.

الأنواع الحالية: `text`, `button`, `image`, `input`, `card`, `divider`, `spacer`, `container`, `list`, `row`, `column`, `scroll`.

## مثال مصغّر
```json
{
  "schemaVersion": 1,
  "project": {
    "id": "project-demo",
    "name": "تطبيقي الأول",
    "packageName": "com.example.myapp",
    "themeColor": "#6750a4"
  },
  "pages": [{
    "id": "page-home",
    "name": "الرئيسية",
    "nodes": [{
      "id": "node-title",
      "type": "text",
      "props": { "text": "مرحبًا", "fontSize": 24, "color": "#222222", "align": "center" }
    }]
  }],
  "dataSources": [{ "id": "local-default", "type": "local", "name": "تخزين محلي" }]
}
```

## قواعد الأمان والتوسع
المخطط بيانات فقط؛ لا يقبل JavaScript عشوائيًا أو كودًا قابلًا للتنفيذ. الإجراءات المستقبلية يجب أن تستخدم اتحادًا مغلقًا من الأنواع مثل `navigate`, `showMessage`, `setValue`, `validate`, `saveRecord` مع التحقق من المعاملات. عند تغيير المخطط، ارفع `schemaVersion` وأضف migration صريحًا.
