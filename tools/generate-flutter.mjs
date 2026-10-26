#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const inputPath = process.argv[2] || 'examples/starter-project.json';
const outputDir = process.argv[3] || 'generated_flutter';
const project = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

function assert(ok, message) { if (!ok) throw new Error(message); }
assert(project.schemaVersion === 1, 'Unsupported schemaVersion; expected 1.');
assert(project.project && typeof project.project.name === 'string', 'Missing project.name.');
assert(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(project.project.packageName), 'Invalid project.packageName.');
assert(Array.isArray(project.pages) && project.pages.length > 0, 'Project must contain at least one page.');
const safe = (s) => String(s ?? '').replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll('$', '\\$');
const dartColor = (v, fallback = '#6750a4') => {
  const m = /^#([0-9a-fA-F]{6})$/.exec(String(v ?? fallback));
  return `Color(0xFF${m ? m[1].toUpperCase() : fallback.slice(1).toUpperCase()})`;
};
function nodeWidget(node) {
  const p = node.props || {};
  const text = safe(p.text ?? '');
  const color = dartColor(p.color);
  const align = ({left:'TextAlign.left', center:'TextAlign.center', right:'TextAlign.right'})[p.align] || 'TextAlign.right';
  const size = Math.min(72, Math.max(8, Number(p.fontSize ?? 16)));
  switch (node.type) {
    case 'text': return `Padding(padding: const EdgeInsets.symmetric(vertical: 6), child: Text('${text}', textAlign: ${align}, style: TextStyle(fontSize: ${size}, color: ${color})))`;
    case 'button': return `Padding(padding: const EdgeInsets.symmetric(vertical: 5), child: SizedBox(width: double.infinity, child: ElevatedButton(onPressed: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تم الضغط على الزر'))), style: ElevatedButton.styleFrom(backgroundColor: ${dartColor(p.background)}, foregroundColor: ${color}), child: Text('${text}', style: const TextStyle(fontSize: ${size})))))`;
    case 'input': return `Padding(padding: const EdgeInsets.symmetric(vertical: 5), child: TextField(decoration: InputDecoration(labelText: '${text}', border: const OutlineInputBorder())))`;
    case 'divider': return `Divider(color: ${color})`;
    case 'spacer': return `SizedBox(height: ${Math.min(300, Math.max(0, Number(p.height ?? 24)))})`;
    case 'image': return `Container(width: double.infinity, padding: const EdgeInsets.all(20), color: ${dartColor(p.background, '#EEEEEE')}, child: const Icon(Icons.image_outlined, size: 36))`;
    case 'card': case 'container': case 'list': case 'row': case 'column': case 'scroll':
      return `Container(width: double.infinity, margin: const EdgeInsets.symmetric(vertical: 4), padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: ${dartColor(p.background, '#F3F0FA')}, borderRadius: BorderRadius.circular(10)), child: Text('${text || node.type}', textAlign: ${align}, style: TextStyle(color: ${color}, fontSize: ${size})))`;
    default: return `Text('${text}')`;
  }
}
const pageNames = project.pages.map((p, i) => `page${i}`).join(', ');
const pageBodies = project.pages.map((page, i) => `
  Widget _page${i}(BuildContext context) => ListView(
    padding: const EdgeInsets.all(16),
    children: [
      ${page.nodes.map(nodeWidget).join(',\n      ') || `const Padding(padding: EdgeInsets.all(24), child: Text('صفحة فارغة', textAlign: TextAlign.center))`}
    ],
  );
`).join('\n');
const navItems = project.pages.map((p, i) => `NavigationDestination(icon: Icon(Icons.${i===0?'home_outlined':'article_outlined'}), label: '${safe(p.name)}')`).join(',\n          ');
const switchPages = project.pages.map((p,i) => `case ${i}: return _page${i}(context);`).join('\n      ');
const dart = `import 'package:flutter/material.dart';

void main() => runApp(const AppForgeApp());

class AppForgeApp extends StatelessWidget {
  const AppForgeApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    debugShowCheckedModeBanner: false,
    title: '${safe(project.project.name)}',
    theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: ${dartColor(project.project.themeColor)}), useMaterial3: true),
    home: const AppForgeHome(),
  );
}

class AppForgeHome extends StatefulWidget {
  const AppForgeHome({super.key});
  @override
  State<AppForgeHome> createState() => _AppForgeHomeState();
}
class _AppForgeHomeState extends State<AppForgeHome> {
  int _index = 0;
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text('${safe(project.project.name)}')),
    body: _body(context),
    ${project.pages.length > 1 ? `bottomNavigationBar: NavigationBar(selectedIndex: _index, onDestinationSelected: (v) => setState(() => _index = v), destinations: [${navItems}]),` : ''}
  );
  Widget _body(BuildContext context) {
    switch (_index) {
      ${switchPages}
      default: return _page0(context);
    }
  }
${pageBodies}
}
`;
const pubspec = `name: appforge_generated_app
description: Generated by AppForge Studio. This project is a starting point.
publish_to: 'none'
version: 1.0.0+1
environment:
  sdk: '>=3.3.0 <4.0.0'
dependencies:
  flutter:
    sdk: flutter
dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^4.0.0
flutter:
  uses-material-design: true
`;
const manifest = `{
  "schemaVersion": 1,
  "generator": "AppForge Studio",
  "projectName": ${JSON.stringify(project.project.name)},
  "packageName": ${JSON.stringify(project.project.packageName)},
  "pageCount": ${project.pages.length}
}
`;
fs.mkdirSync(path.join(outputDir, 'lib'), { recursive: true });
fs.mkdirSync(path.join(outputDir, 'test'), { recursive: true });
fs.writeFileSync(path.join(outputDir, 'lib/main.dart'), dart);
fs.writeFileSync(path.join(outputDir, 'pubspec.yaml'), pubspec);
fs.writeFileSync(path.join(outputDir, 'README.md'), `# ${project.project.name}\n\nمشروع Flutter مولّد آليًا من AppForge Studio.\n\n## البناء\n\nيتطلب Flutter SDK وAndroid SDK أو GitHub Actions.\n\n\`\`\`sh\nflutter pub get\nflutter analyze\nflutter test\nflutter build apk --release\n\`\`\`\n\nهذا مشروع أولي مولّد؛ راجع الكود واختبر السلوك قبل النشر.\n`);
fs.writeFileSync(path.join(outputDir, 'appforge-manifest.json'), manifest);
fs.writeFileSync(path.join(outputDir, 'test/widget_test.dart'), `import 'package:flutter_test/flutter_test.dart';\nimport 'package:appforge_generated_app/main.dart';\nvoid main() { testWidgets('App starts', (tester) async { await tester.pumpWidget(const AppForgeApp()); expect(find.text('${safe(project.project.name)}'), findsOneWidget); }); }\n`);
console.log(`Generated Flutter source at ${outputDir}`);
console.log('Next: cd ' + outputDir + ' && flutter pub get && flutter analyze && flutter test');
