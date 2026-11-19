import { expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(process.cwd(), 'src/data/catalog');
it('every catalog repository, including Holiday Packages, has baked page items', () => {
  const { repositories } = JSON.parse(readFileSync(join(root, 'repositories.json'), 'utf8'));
  const missing = Object.entries(repositories as Record<string, { data: string }>)
    .filter(([, v]) => !existsSync(join(root, 'page-items/repositories', v.data))).map(([k]) => k);
  expect(missing).toEqual([]);
});
