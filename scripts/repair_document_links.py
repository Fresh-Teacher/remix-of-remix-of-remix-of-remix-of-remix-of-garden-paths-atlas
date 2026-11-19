"""Offline, resumable repair. Only PDF-signature-verified URLs replace source URLs.
Run: python scripts/repair_document_links.py --workers 24
Then: python scripts/bake_page_items.py --thumb-map src/data/catalog/thumb-map
"""
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import csv
import hashlib
import json
from pathlib import Path
import re
import urllib.parse
import requests

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / 'src/data/catalog'
BROKEN = '/thumbs/broken-link.webp'


def read_shards(folder):
    return {p: json.loads(p.read_text()) for p in sorted(folder.glob('*.json'))}


def filename(url):
    # Catalog URLs can contain literal # in the filename, not a fragment.
    return urllib.parse.unquote(url.split('?', 1)[0].rsplit('/', 1)[-1])


def name_key(url):
    return re.sub(r'\s+\.pdf$', '.pdf', filename(url), flags=re.I).casefold()


def safe_url(url):
    parts = urllib.parse.urlsplit(url.replace('#', '%23'))
    return urllib.parse.urlunsplit(parts._replace(path=urllib.parse.quote(urllib.parse.unquote(parts.path), safe='/')))


def document_key(url):
    a, b = 2166136261, 5381
    encoded = url.encode('utf-16-le')
    for i in range(0, len(encoded), 2):
        c = encoded[i] + 256 * encoded[i + 1]
        a = ((a ^ c) * 16777619) & 0xffffffff
        b = ((b * 33) ^ c) & 0xffffffff
    return f'{a:08x}{b:08x}'


def candidates(url, alternatives, level=''):
    indexed = alternatives.get(name_key(url), [])
    # Prefer the right class and raw repository files over retired deployments.
    def rank(u):
        path = urllib.parse.urlsplit(u).path.lower()
        return (0 if level and re.search(r'/' + re.escape(level) + r'(?:/|-)', path) else 1,
                0 if 'raw.githubusercontent.com' in u else 1, u)
    values = sorted(indexed, key=rank)
    name = filename(url)
    names = list(dict.fromkeys([name, re.sub(r'\s+\.pdf$', '.pdf', name, flags=re.I)]))
    host = urllib.parse.urlsplit(url).hostname
    if host == 'fresh-teacher.github.io' or host == 's6-fresh-teacher.vercel.app':
        repos = ([level, level + '-notes', level + '-past-papers'] if level else [])
        if host == 's6-fresh-teacher.vercel.app': repos = ['s6-notes', 's6-past-papers', 's6']
        path = urllib.parse.unquote(urllib.parse.urlsplit(url).path).lstrip('/')
        if '/' in path: repos.insert(0, path.split('/')[0])
        # Exact indexed matches may exist in the broad legacy collections.
        repos += ['primary'] if level.startswith('p') else ['secondariez'] if level.startswith('s') else []
        for repo in dict.fromkeys(repos):
            for n in names:
                values.append(f'https://raw.githubusercontent.com/Fresh-Teacher/{repo}/HEAD/{n}')
    values.append(url)
    return list(dict.fromkeys(safe_url(u) for u in values))


def verify_pdf(url):
    try:
        with requests.get(url, headers={'Range': 'bytes=0-1023', 'User-Agent': 'FreshTeacher-LinkRepair/1.0'},
                          timeout=(5, 12), stream=True) as response:
            if response.status_code in (200, 206):
                prefix = next(response.iter_content(1024), b'')
                if b'%PDF-' in prefix:
                    return {'status': 'verified', 'url': response.url}
                return {'status': 'not_pdf'}
            return {'status': 'missing' if response.status_code in (404, 410) else 'retry', 'httpStatus': response.status_code}
    except requests.RequestException:
        return {'status': 'retry'}


def resolve(url, options, cache):
    attempts = []
    for candidate in options:
        result = cache.get(candidate) or verify_pdf(candidate)
        attempts.append({'candidate': candidate, **result})
        if result['status'] == 'verified':
            return {'originalUrl': url, 'resolvedUrl': candidate, 'attempts': attempts}
    return {'originalUrl': url, 'status': 'retry' if any(a['status'] == 'retry' for a in attempts) else 'unresolved', 'attempts': attempts}


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists() and json.loads(path.read_text()) == value:
        return
    tmp = path.with_suffix('.tmp')
    tmp.write_text(json.dumps(value, indent=0, sort_keys=True) if path.parent.name == 'thumb-map'
                   else json.dumps(value, ensure_ascii=False, separators=(',', ':')))
    tmp.replace(path)


def run(workers):
    shards = read_shards(CATALOG / 'documents')
    maps = read_shards(CATALOG / 'thumb-map')
    thumbs = {u: m for records in maps.values() for u, m in records.items()}
    records = {i: r for rows in shards.values() for i, r in rows.items()}
    contexts = {}
    for kind in ('legacy', 'resources', 'repositories'):
        for p in (CATALOG / 'pages' / kind).glob('*.json'):
            page = json.loads(p.read_text())
            for i in page.get('documentIds', []): contexts.setdefault(i, []).append({'page': p.stem, 'kind': kind, 'title': page.get('title', '')})
    targets = {}
    levels = {}
    words = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven']
    for i, r in records.items():
        if r.get('thumbUrl') != BROKEN and thumbs.get(r['pdfUrl'], {}).get('thumbUrl') != BROKEN: continue
        u = r['pdfUrl']
        targets.setdefault(u, []).append(i)
        text = r.get('description', '') + ' ' + ' '.join(c['title'] + ' ' + c['page'] for c in contexts.get(i, []))
        for prefix, label in [('p', 'Primary'), ('s', 'Senior')]:
            for n, word in enumerate(words, 1):
                if re.search(label + r'\s*' + word, text, re.I): levels[u] = prefix + str(n)
    alternatives = {}
    for u, meta in thumbs.items():
        if meta.get('thumbUrl') != BROKEN:
            alternatives.setdefault(name_key(u), []).append(u)
    audit_path = CATALOG / 'link-repair-results.json'
    results = json.loads(audit_path.read_text()) if audit_path.exists() else {}
    cache = {a['candidate']: {k: v for k, v in a.items() if k != 'candidate'} for r in results.values() for a in r['attempts'] if a['status'] != 'retry'}
    todo = [u for u in targets if u not in results or results[u].get('status') == 'retry']
    print(f'{len(targets)} broken URLs; checking {len(todo)}', flush=True)
    with ThreadPoolExecutor(max_workers=workers) as pool:
        tasks = {pool.submit(resolve, u, candidates(u, alternatives, levels.get(u, '')), cache): u for u in todo}
        for n, future in enumerate(as_completed(tasks), 1):
            result = future.result()
            results[result['originalUrl']] = result
            if n % 50 == 0:
                write_json(audit_path, results)
                print(f'{n}/{len(todo)} checked; {sum("resolvedUrl" in r for r in results.values())} recovered', flush=True)
    write_json(audit_path, results)
    indices = read_shards(CATALOG / 'document-index')
    entries = {k: v for rows in indices.values() for k, v in rows.items()}
    meta_by_safe = {safe_url(u): m for u, m in thumbs.items()}
    missing_covers = []
    for old, result in results.items():
        new = result.get('resolvedUrl')
        if not new or old not in targets: continue
        meta = meta_by_safe.get(new)
        if meta:
            thumbs[new] = meta.copy()
        else:
            missing_covers.append(new)
        for i in targets[old]:
            r = records[i]
            old_entry = entries.get(document_key(old)) or next((e for e in entries.values() if e['id'] == i), None)
            if old_entry:
                old_key = document_key(old)
                indices.setdefault(CATALOG / 'document-index' / f'{old_key[:2]}.json', {}).setdefault(old_key, old_entry)
                key = document_key(new)
                # Retain old aliases; a duplicate URL's existing category stays authoritative.
                path = CATALOG / 'document-index' / f'{key[:2]}.json'
                indices.setdefault(path, {}).setdefault(key, old_entry)
            r['pdfUrl'] = new
            for field in ('thumbUrl', 'pages', 'sizeBytes'): r.pop(field, None)
            if meta: r.update({k: v for k, v in meta.items() if k in ('thumbUrl', 'pages', 'sizeBytes')})
    for path, data in shards.items(): write_json(path, data)
    for path, data in indices.items(): write_json(path, data)
    for u, result in results.items():
        if result.get('resolvedUrl'): thumbs[u] = thumbs.get(result['resolvedUrl'], {}).copy() or thumbs[u]
    split = {h: {} for h in '0123456789abcdef'}
    for u, m in thumbs.items(): split[hashlib.sha1(u.encode()).hexdigest()[0]][u] = m
    for h, data in split.items(): write_json(CATALOG / 'thumb-map' / f'{h}.json', data)
    residual = []
    for u, ids in targets.items():
        result = results[u]
        if result.get('resolvedUrl'): continue
        for i in ids:
            r = records[i]
            residual.append({'id': i, 'class': levels.get(u, 'Other'), 'title': r.get('title') or filename(u),
                             'description': r.get('description'), 'url': u, 'status': result['status'], 'collections': contexts.get(i, [])})
    residual.sort(key=lambda r: (r['class'], r['description'] or '', r['title']))
    write_json(CATALOG / 'link-repair-unresolved.json', residual)
    write_json(CATALOG / 'link-repair-needs-covers.json', sorted(set(missing_covers)))
    with (CATALOG / 'link-repair-unresolved.csv').open('w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['class', 'description', 'title', 'url', 'status', 'id'])
        writer.writeheader()
        writer.writerows({k: r[k] for k in writer.fieldnames} for r in residual)
    print(f'Recovered {sum("resolvedUrl" in r for r in results.values())} URLs; {len(residual)} records need review; {len(missing_covers)} covers to bake', flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--workers', type=int, default=24)
    run(parser.parse_args().workers)