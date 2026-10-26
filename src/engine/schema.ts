import { z } from 'zod';

export const NodeTypeSchema = z.enum([
  'text', 'button', 'image', 'input', 'card', 'divider',
  'spacer', 'container', 'list', 'row', 'column', 'scroll'
]);
export type NodeType = z.infer<typeof NodeTypeSchema>;

export const NodeSchema: z.ZodType<DesignNode> = z.lazy(() => z.object({
  id: z.string().min(1),
  type: NodeTypeSchema,
  props: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).default({}),
  children: z.array(NodeSchema).optional()
}));

export interface DesignNode {
  id: string;
  type: NodeType;
  props: Record<string, string | number | boolean | null>;
  children?: DesignNode[];
}

export const PageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  nodes: z.array(NodeSchema)
});

export const ProjectSchema = z.object({
  schemaVersion: z.literal(1),
  project: z.object({
    id: z.string().min(1),
    name: z.string().min(1).max(100),
    packageName: z.string().regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/),
    themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/)
  }),
  pages: z.array(PageSchema).min(1),
  dataSources: z.array(z.object({
    id: z.string().min(1),
    type: z.enum(['local']),
    name: z.string().min(1)
  })).default([])
});

export type ProjectDocument = z.infer<typeof ProjectSchema>;

export function validateProject(input: unknown): ProjectDocument {
  return ProjectSchema.parse(input);
}

export function exportProject(project: ProjectDocument): string {
  return JSON.stringify(validateProject(project), null, 2);
}

export function importProject(json: string): ProjectDocument {
  return validateProject(JSON.parse(json));
}

export function createId(prefix = 'node'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createStarterProject(): ProjectDocument {
  return {
    schemaVersion: 1,
    project: { id: 'project-starter', name: 'مشروعي الأول', packageName: 'com.example.myapp', themeColor: '#6750a4' },
    pages: [{
      id: 'page-home', name: 'الرئيسية', nodes: [
        { id: 'node-welcome', type: 'text', props: { text: 'مرحبًا بك في AppForge', fontSize: 24, color: '#202124', align: 'center' } },
        { id: 'node-description', type: 'text', props: { text: 'ابدأ ببناء واجهتك من الهاتف', fontSize: 15, color: '#5f6368', align: 'center' } },
        { id: 'node-action', type: 'button', props: { text: 'ابدأ الآن', fontSize: 16, color: '#ffffff', background: '#6750a4', align: 'center' } }
      ]
    }],
    dataSources: [{ id: 'local-default', type: 'local', name: 'تخزين محلي' }]
  };
}