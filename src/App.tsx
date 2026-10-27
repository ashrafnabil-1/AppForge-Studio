import { ChangeEvent, CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { createId, createStarterProject, DesignNode, NodeType, ProjectDocument, importProject, exportProject } from './engine/schema';

const STORAGE_KEY = 'appforge-studio-project-v1';
const palette: { type: NodeType; label: string; icon: string }[] = [
  { type: 'text', label: 'نص', icon: 'T' }, { type: 'button', label: 'زر', icon: '▰' },
  { type: 'image', label: 'صورة', icon: '▧' }, { type: 'input', label: 'حقل إدخال', icon: '⌨' },
  { type: 'card', label: 'بطاقة', icon: '▣' }, { type: 'divider', label: 'فاصل', icon: '━' },
  { type: 'spacer', label: 'مسافة', icon: '↕' }, { type: 'container', label: 'حاوية', icon: '□' },
  { type: 'list', label: 'قائمة', icon: '☷' }, { type: 'row', label: 'صف أفقي', icon: '↔' },
  { type: 'column', label: 'عمود', icon: '↕' }, { type: 'scroll', label: 'قائمة تمرير', icon: '⇵' }
];

function makeNode(type: NodeType): DesignNode {
  const common = { fontSize: 16, color: '#202124', align: 'right' };
  const defaults: Record<NodeType, DesignNode['props']> = {
    text: { ...common, text: 'نص جديد' }, button: { ...common, text: 'زر جديد', color: '#ffffff', background: '#6750a4' },
    image: { ...common, text: 'مساحة صورة', background: '#eeeeee' }, input: { ...common, text: 'أدخل النص هنا' },
    card: { ...common, text: 'بطاقة جديدة', background: '#f3f0fa' }, divider: { ...common, color: '#dadce0' },
    spacer: { height: 24 }, container: { ...common, text: 'حاوية', background: '#f7f7f7' },
    list: { ...common, text: 'عنصر قائمة' }, row: { ...common, text: 'صف أفقي' },
    column: { ...common, text: 'عمود' }, scroll: { ...common, text: 'قائمة قابلة للتمرير' }
  };
  return { id: createId(type), type, props: defaults[type] };
}

function findNode(nodes: DesignNode[], id: string | null): DesignNode | null {
  if (!id) return null;
  for (const node of nodes) {
    if (node.id === id) return node;
    const nested = findNode(node.children ?? [], id);
    if (nested) return nested;
  }
  return null;
}

function updateNodeTree(nodes: DesignNode[], id: string, updater: (node: DesignNode) => DesignNode): DesignNode[] {
  return nodes.map(node => node.id === id
    ? updater(node)
    : { ...node, ...(node.children ? { children: updateNodeTree(node.children, id, updater) } : {}) });
}

function removeNodeTree(nodes: DesignNode[], id: string): DesignNode[] {
  return nodes.filter(node => node.id !== id).map(node => ({
    ...node,
    ...(node.children ? { children: removeNodeTree(node.children, id) } : {})
  }));
}

const containerTypes: NodeType[] = ['card', 'container', 'list', 'row', 'column', 'scroll'];

function readSaved(): ProjectDocument {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return importProject(saved);
  } catch { /* corrupted local data: load safe starter */ }
  return createStarterProject();
}

export default function App() {
  const [project, setProject] = useState<ProjectDocument>(readSaved);
  const [pageId, setPageId] = useState(project.pages[0].id);
  const [selectedId, setSelectedId] = useState<string | null>(project.pages[0].nodes[0]?.id ?? null);
  const [history, setHistory] = useState<ProjectDocument[]>([]);
  const [future, setFuture] = useState<ProjectDocument[]>([]);
  const [toast, setToast] = useState('');
  const importRef = useRef<HTMLInputElement>(null);
  const page = project.pages.find(p => p.id === pageId) ?? project.pages[0];
  const selected = findNode(page.nodes, selectedId);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(project)); }
    catch { setToast('تعذر الحفظ المحلي؛ قد تكون مساحة التخزين ممتلئة.'); }
  }, [project]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

  const updateProject = (mutator: (current: ProjectDocument) => ProjectDocument) => {
    setHistory(h => [...h.slice(-29), project]);
    setFuture([]);
    setProject(mutator(project));
  };

  const addNode = (type: NodeType) => {
    const node = makeNode(type);
    updateProject(p => ({ ...p, pages: p.pages.map(pg => {
      if (pg.id !== page.id) return pg;
      if (selected && containerTypes.includes(selected.type)) {
        return { ...pg, nodes: updateNodeTree(pg.nodes, selected.id, parent => ({ ...parent, children: [...(parent.children ?? []), node] })) };
      }
      return { ...pg, nodes: [...pg.nodes, node] };
    }) }));
    setSelectedId(node.id);
    setToast(selected && containerTypes.includes(selected.type) ? 'تمت إضافة العنصر داخل العنصر المحدد.' : 'تمت إضافة العنصر إلى الصفحة.');
  };
  const updateSelected = (key: string, value: string | number) => {
    if (!selected) return;
    updateProject(p => ({ ...p, pages: p.pages.map(pg => pg.id === page.id
      ? { ...pg, nodes: updateNodeTree(pg.nodes, selected.id, node => ({ ...node, props: { ...node.props, [key]: value } })) }
      : pg) }));
  };
  const deleteSelected = () => {
    if (!selected) return;
    updateProject(p => ({ ...p, pages: p.pages.map(pg => pg.id === page.id
      ? { ...pg, nodes: removeNodeTree(pg.nodes, selected.id) }
      : pg) }));
    setSelectedId(null);
  };
  const addPage = () => {
    const newPage = { id: createId('page'), name: `صفحة ${project.pages.length + 1}`, nodes: [] };
    updateProject(p => ({ ...p, pages: [...p.pages, newPage] }));
    setPageId(newPage.id); setSelectedId(null);
  };
  const downloadJson = () => {
    try {
      const blob = new Blob([exportProject(project)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${project.project.name.replace(/[^\p{L}\p{N}-]+/gu, '-') || 'appforge-project'}.json`; a.click();
      URL.revokeObjectURL(url); setToast('تم تجهيز ملف JSON للتصدير.');
    } catch { setToast('تعذر التصدير: تحقق من اسم الحزمة وإعدادات المشروع.'); }
  };
  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    try {
      const imported = importProject(await file.text());
      setHistory(h => [...h.slice(-29), project]); setFuture([]);
      setProject(imported); setPageId(imported.pages[0].id); setSelectedId(imported.pages[0].nodes[0]?.id ?? null);
      setToast('تم استيراد المشروع والتحقق من المخطط.');
    } catch { setToast('ملف غير صالح أو إصدار مخطط غير مدعوم؛ لم يتغير المشروع.'); }
    event.target.value = '';
  };
  const undo = () => {
    if (!history.length) return;
    setFuture(f => [project, ...f]); setProject(history[history.length - 1]); setHistory(h => h.slice(0, -1)); setToast('تم التراجع.');
  };
  const redo = () => {
    if (!future.length) return;
    setHistory(h => [...h, project]); setProject(future[0]); setFuture(f => f.slice(1)); setToast('تمت الإعادة.');
  };
  const nodeLabel = (node: DesignNode) => String(node.props.text ?? ({ divider: 'فاصل', spacer: 'مسافة' } as Record<string, string>)[node.type] ?? node.type);
  const renderNode = (node: DesignNode): JSX.Element => {
    const props = node.props;
    const label = nodeLabel(node);
    const style: CSSProperties = {
      color: String(props.color ?? '#202124'), fontSize: `${Number(props.fontSize ?? 16)}px`,
      textAlign: (['right', 'center', 'left'].includes(String(props.align)) ? props.align : 'right') as CSSProperties['textAlign'],
      backgroundColor: String(props.background ?? 'transparent'),
      borderRadius: node.type === 'card' || node.type === 'container' ? 12 : 6,
      padding: node.type === 'divider' || node.type === 'spacer' ? '0' : '10px',
      minHeight: node.type === 'spacer' ? Number(props.height ?? 24) : undefined
    };
    let content: JSX.Element;
    if (node.type === 'divider') content = <div className="preview-divider" style={{ background: String(props.color ?? '#dadce0') }} />;
    else if (node.type === 'spacer') content = <div style={{ height: Number(props.height ?? 24) }} />;
    else if (node.type === 'button') content = <button className="preview-button" style={{ ...style, background: String(props.background ?? '#6750a4') }} onClick={e => { e.stopPropagation(); setSelectedId(node.id); setToast(`معاينة: ${label}`); }}>{label}</button>;
    else if (node.type === 'input') content = <input className="preview-input" style={style} placeholder={label} aria-label={label} onClick={e => { e.stopPropagation(); setSelectedId(node.id); }} />;
    else if (node.type === 'image') content = <div className="preview-image" style={style}>▧ {label}<small>عنصر صورة تجريبي</small></div>;
    else if (containerTypes.includes(node.type)) {
      const children = node.children ?? [];
      const layoutClass = node.type === 'row' ? 'nested-row' : node.type === 'scroll' ? 'nested-scroll' : 'nested-column';
      content = <div className={`preview-node ${node.type} ${layoutClass}`} style={style}>
        {children.length ? children.map(child => <div key={child.id} className={`selectable nested-selectable ${selectedId === child.id ? 'selected' : ''}`} onClick={e => { e.stopPropagation(); setSelectedId(child.id); }}>{renderNode(child)}{selectedId === child.id && <span className="selection-tag">محدد</span>}</div>) : <span>{label}</span>}
      </div>;
    } else content = <div className="preview-text" style={style}>{label}</div>;
    return <>{content}</>;
  };
  const pageTitle = useMemo(() => page.name, [page.name]);

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand-mark">AF</div>
      <div className="brand-copy"><strong>AppForge Studio</strong><span>من فكرتك إلى تطبيقك</span></div>
      <span className="status-pill"><i /> حفظ محلي تلقائي</span>
    </header>
    <nav className="toolbar" aria-label="أدوات المشروع">
      <button className="primary" onClick={() => { const fresh = createStarterProject(); setProject(fresh); setPageId(fresh.pages[0].id); setSelectedId(fresh.pages[0].nodes[0]?.id ?? null); setHistory([]); setFuture([]); setToast('تم إنشاء مشروع جديد.'); }}>＋ مشروع جديد</button>
      <button onClick={undo} disabled={!history.length}>↶ تراجع</button>
      <button onClick={redo} disabled={!future.length}>↷ إعادة</button>
      <button onClick={downloadJson}>⇩ تصدير JSON</button>
      <button onClick={() => importRef.current?.click()}>⇧ استيراد</button>
      <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={handleImport} />
      <span className="toolbar-note">نسخة أولية · مخطط v1</span>
    </nav>

    <main className="workspace">
      <aside className="panel elements-panel">
        <div className="panel-heading"><div><span className="eyebrow">BUILD</span><h2>العناصر</h2></div><span className="count">{palette.length}</span></div>
        <p className="muted">حدد حاوية أو بطاقة أولًا لإضافة عنصر بداخلها؛ وإلا فسيُضاف للصفحة</p>
        <div className="element-grid">{palette.map(item => <button className="element-tile" key={item.type} onClick={() => addNode(item.type)}><span className="element-icon">{item.icon}</span><span>{item.label}</span></button>)}</div>
        <div className="panel-footer"><span className="dot-purple" /> عناصر أساسية قابلة للتعديل</div>
      </aside>

      <section className="canvas-panel">
        <div className="canvas-toolbar">
          <div><span className="eyebrow">CANVAS / {project.pages.length} PAGES</span><h2>{pageTitle}</h2></div>
          <div className="canvas-actions"><button onClick={addPage}>＋ صفحة</button><button onClick={() => setToast('المعاينة الحالية داخل المحرر فقط وليست تطبيق Android مبنيًا.')}>▷ معاينة</button></div>
        </div>
        <div className="device-stage">
          <div className="device-frame">
            <div className="device-status"><span>9:41</span><span>●●● ▰</span></div>
            <div className="device-appbar"><strong>{project.project.name}</strong><span>⋮</span></div>
            <div className="device-content">
              {page.nodes.length ? page.nodes.map(node => <div key={node.id} className={`selectable ${selectedId === node.id ? 'selected' : ''}`} onClick={() => setSelectedId(node.id)}>{renderNode(node)}{selectedId === node.id && <span className="selection-tag">محدد</span>}</div>) : <div className="empty-canvas"><span>✦</span><strong>مساحة العمل فارغة</strong><p>اختر عنصرًا من القائمة لإضافته</p></div>}
            </div>
            <div className="device-home-indicator" />
          </div>
        </div>
        <div className="canvas-bottom"><span><i className="green-dot" /> المعاينة التفاعلية</span><span>{page.nodes.length} عنصر</span><span>390 × 844</span></div>
      </section>

      <aside className="panel properties-panel">
        <div className="panel-heading"><div><span className="eyebrow">INSPECTOR</span><h2>الخصائص</h2></div><span className="property-symbol">⚙</span></div>
        {selected ? <div className="properties-form">
          <div className="selected-type"><span>{palette.find(p => p.type === selected.type)?.icon ?? '□'}</span><div><strong>{palette.find(p => p.type === selected.type)?.label}</strong><small>{selected.id}</small></div><button className="delete-button" title="حذف العنصر" onClick={deleteSelected}>⌫</button></div>
          {('text' in selected.props) && <label className="field"><span>النص / المحتوى</span><textarea rows={3} value={String(selected.props.text ?? '')} onChange={e => updateSelected('text', e.target.value)} /></label>}
          {selected.type !== 'divider' && selected.type !== 'spacer' && <label className="field"><span>حجم الخط <b>{Number(selected.props.fontSize ?? 16)}px</b></span><input type="range" min="10" max="36" value={Number(selected.props.fontSize ?? 16)} onChange={e => updateSelected('fontSize', Number(e.target.value))} /></label>}
          {selected.type !== 'divider' && selected.type !== 'spacer' && <label className="field"><span>لون النص</span><div className="color-control"><input type="color" value={String(selected.props.color ?? '#202124')} onChange={e => updateSelected('color', e.target.value)} /><code>{String(selected.props.color ?? '#202124')}</code></div></label>}
          {['button', 'card', 'container', 'image'].includes(selected.type) && <label className="field"><span>لون الخلفية</span><div className="color-control"><input type="color" value={String(selected.props.background ?? '#eeeeee')} onChange={e => updateSelected('background', e.target.value)} /><code>{String(selected.props.background ?? '#eeeeee')}</code></div></label>}
          {selected.type !== 'divider' && selected.type !== 'spacer' && <label className="field"><span>محاذاة النص</span><div className="align-options">{(['right', 'center', 'left'] as const).map(align => <button key={align} className={selected.props.align === align ? 'active' : ''} onClick={() => updateSelected('align', align)}>{align === 'right' ? 'يمين' : align === 'center' ? 'وسط' : 'يسار'}</button>)}</div></label>}
          {selected.type === 'spacer' && <label className="field"><span>الارتفاع <b>{Number(selected.props.height ?? 24)}px</b></span><input type="range" min="4" max="120" value={Number(selected.props.height ?? 24)} onChange={e => updateSelected('height', Number(e.target.value))} /></label>}
          <button className="danger-outline" onClick={deleteSelected}>حذف العنصر</button>
        </div> : <div className="inspector-empty"><span>◈</span><strong>لا يوجد عنصر محدد</strong><p>حدد عنصرًا من المعاينة لتعديل خصائصه.</p></div>}
        <div className="pages-section">
          <div className="section-title"><h3>صفحات المشروع</h3><button onClick={addPage}>＋</button></div>
          {project.pages.map((pg, index) => <div key={pg.id} className={`page-row ${pg.id === pageId ? 'current' : ''}`}><button className="page-select" onClick={() => { setPageId(pg.id); setSelectedId(pg.nodes[0]?.id ?? null); }}><span className="page-number">{String(index + 1).padStart(2, '0')}</span><span>{pg.name}</span></button>{pg.id === pageId && <span className="page-active">●</span>}</div>)}
        </div>
        <div className="project-settings">
          <h3>إعدادات المشروع</h3>
          <label className="field"><span>اسم التطبيق</span><input value={project.project.name} onChange={e => updateProject(p => ({ ...p, project: { ...p.project, name: e.target.value || 'تطبيقي' } }))} /></label>
          <label className="field"><span>اسم الحزمة (Package)</span><input value={project.project.packageName} onChange={e => updateProject(p => ({ ...p, project: { ...p.project, packageName: e.target.value } }))} /></label>
          <small className="hint">يُتحقق من اسم الحزمة عند التصدير. استخدم مثلًا com.example.myapp.</small>
        </div>
      </aside>
    </main>
    <footer className="app-footer"><span>AppForge Studio <b>v0.1.0</b></span><span>صُممت لتعمل من متصفح الهاتف</span><span className="footer-state">● بياناتك محلية على هذا الجهاز</span></footer>
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}