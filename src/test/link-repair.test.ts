import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { documentKey, documentSlug } from '@/lib/document-metadata';
import { loadDocument } from '@/lib/document-catalog';
import type { ResourceRecord } from '@/lib/resources';

const root = 'src/data/catalog';
const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const results = read(`${root}/link-repair-results.json`) as Record<string, { resolvedUrl?: string; attempts: { candidate: string; status: string }[] }>;
const shards = Object.assign({}, ...readdirSync(`${root}/documents`).map(f => read(`${root}/documents/${f}`))) as Record<string, ResourceRecord>;
const indices = Object.assign({}, ...readdirSync(`${root}/document-index`).map(f => read(`${root}/document-index/${f}`))) as Record<string, { id: string }>;

describe('verified catalog repairs', () => {
  it('keeps all 80,896 documents and the 347 original locked covers', () => {
    expect(Object.keys(shards)).toHaveLength(80896);
    expect(Object.values(shards).filter(r => r.thumbUrl === '/thumbs/locked-pdf.webp').length).toBeGreaterThanOrEqual(347);
  });

  it('indexes every repaired URL without dropping original bookmark aliases', () => {
    const repaired = Object.entries(results).filter(([, r]) => r.resolvedUrl);
    expect(repaired.length).toBeGreaterThan(0);
    for (const [old, result] of repaired) {
      const url = result.resolvedUrl;
      if (!url) continue;
      expect(result.attempts.some(a => a.candidate === url && a.status === 'verified')).toBe(true);
      const oldEntry = indices[documentKey(old)];
      expect(oldEntry).toBeDefined();
      expect(shards[oldEntry?.id ?? '']?.pdfUrl).toBe(url);
      expect(indices[documentKey(url)]).toBeDefined();
    }
  });

  it('opens a repaired document from an old shared link and its new address', async () => {
    const pair = Object.entries(results).find(([, r]) => r.resolvedUrl);
    expect(pair).toBeDefined();
    if (!pair?.[1].resolvedUrl) throw new Error('No repaired document');
    const [old, result] = pair;
    const entry = indices[documentKey(old)];
    const item = shards[entry?.id ?? ''];
    if (!item) throw new Error('Missing repaired item');
    const oldPage = await loadDocument(documentSlug({ ...item, pdfUrl: old }));
    expect(oldPage?.item.pdfUrl).toBe(result.resolvedUrl);
    const newPage = await loadDocument(documentSlug(item));
    expect(newPage?.item.pdfUrl).toBe(result.resolvedUrl);
  });
});