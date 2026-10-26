import { describe, expect, it } from 'vitest';
import { createStarterProject, exportProject, importProject, validateProject } from './schema';

describe('project schema', () => {
  it('accepts the starter project', () => {
    expect(validateProject(createStarterProject()).pages).toHaveLength(1);
  });
  it('round trips through JSON export/import', () => {
    const project = createStarterProject();
    expect(importProject(exportProject(project))).toEqual(project);
  });
  it('rejects invalid package names', () => {
    const project = createStarterProject();
    project.project.packageName = 'Not A Package';
    expect(() => validateProject(project)).toThrow();
  });
  it('rejects unsupported schema versions', () => {
    const project = { ...createStarterProject(), schemaVersion: 99 };
    expect(() => validateProject(project)).toThrow();
  });
});