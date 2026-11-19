import { memo, useCallback, useMemo, useState } from 'react';
import { Element, domToReact, htmlToDOM, type DOMNode, type HTMLReactParserOptions } from 'html-react-parser';
import { DocumentGallery } from '@/components/document-gallery';
import { filterResources, type ResourcePageData, type ResourceRecord } from '@/lib/resources';
import shell from '@/data/resource-shell.html?raw';
import media from '@/data/resource-media.json';
import repairs from '@/styles/resource-repairs.css?raw';
import { DocumentSearchInput } from '@/components/document-search-input';
import { createQueryStore, useQuery, type QueryStore } from '@/lib/query-store';

// The shell markup is identical on every resource page: parse it once per session.
let shellDom: DOMNode[] | undefined;
const parsedShell = () => (shellDom ??= htmlToDOM(shell) as DOMNode[]);

// Islands: only these read the search text, so typing never rebuilds the page shell.
function SearchIsland({ store, id, items }: { store: QueryStore; id: string; items: ResourceRecord[] }) {
  return <DocumentSearchInput id={id} query={useQuery(store)} onChange={store.set} items={items} />;
}

const GalleryIsland = memo(function GalleryIsland({ store, items: all, onView }: { store: QueryStore; items: ResourceRecord[]; onView: (element: HTMLElement, item: ResourceRecord) => void }) {
  const query = useQuery(store);
  const items = useMemo(() => filterResources(all, query), [all, query]);
  const clear = useCallback(() => store.set(''), [store]);
  return <DocumentGallery items={items} sourceItems={all} query={query} onQueryChange={store.set} onClear={clear} onView={onView} />;
});

export function ResourcePage({ data }: { data: ResourcePageData }) {
  const [store] = useState(() => createQueryStore());
  const [viewerError, setViewerError] = useState('');
  const onView = useCallback((element: HTMLElement, item: ResourceRecord) => {
    void (async () => {
      try {
        setViewerError('');
        const { openResourceViewer } = await import('@/lib/resource-viewer');
        await openResourceViewer(element, item);
      } catch { void import('@/lib/viewer-loading').then(m => m.hideViewerLoading());
        setViewerError('The file viewer could not load. You can still download the file.');
      }
    })();
  }, []);
  const content = useMemo(() => {
    const options: HTMLReactParserOptions = { replace(node) {
      if (!(node instanceof Element)) return;
      if (node.name === 'nav') return <></>;
      if (node.name === 'footer' || (node.attribs['class'] ?? '').split(' ').includes('footer')) return <></>;
      // The shared WhatsApp chat (LibraryShell) replaces the shell's plain floating link.
      if ((node.attribs['class'] ?? '').includes('floating-whatsapp')) return <></>;
      const id = node.attribs['id'];
      if (node.name === 'div' && node.children.some(child => child instanceof Element && child.attribs['id'] === 'jumpToPage')) return <></>;
      if (node.name === 'img') {
        const src = node.attribs['src'];
        const asset = media[src as keyof typeof media];
        if (asset) return <img {...node.attribs} src={asset} />;
      }
      if (id === 'searchInput') return <SearchIsland store={store} id={id} items={data.items} />;
      if (node.attribs['class'] === 'row') return <div className="row">
        <GalleryIsland store={store} items={data.items} onView={onView} />
        {viewerError && <p role="alert">{viewerError}</p>}
      </div>;
      if (id === 'previousPageBtn' || id === 'nextPageBtn' || id === 'pageNumbers' || id === 'jumpToPage' || id === 'jumpButton') return <></>;
      return undefined;
    } };
    return domToReact(parsedShell(), options);
  }, [store, data.items, onView, viewerError]);
  return <div className="resource-page"><style>{data.styles}</style><style>{repairs}</style>{content}</div>;
}
