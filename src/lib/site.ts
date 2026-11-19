/**
 * The library's public address and the search/social tags every page shares.
 * Canonical links, og:url and structured data must be absolute, so they all use SITE_URL.
 */
export const SITE_URL: string = import.meta.env['VITE_PUBLIC_SITE_URL'] || 'https://fresh-teacher.github.io';
export const SITE_NAME = "Fresh Teacher's Library";
export const SHARE_IMAGE = `${SITE_URL}/og-image.jpg`;
export const LOGO_URL = `${SITE_URL}/logo-512.png`;

/** Absolute public URL for a site path; spaces and other characters are percent-encoded. */
export function absoluteUrl(path: string): string {
  return new URL(path.startsWith('/') ? path : `/${path}`, SITE_URL).href;
}

type PageMetaInput = {
  path: string;
  title: string;
  description: string;
  type?: 'website' | 'article' | undefined;
  /** Leave out the canonical link (e.g. pages that point at another main copy supply their own). */
  canonical?: string | false | undefined;
};

/** Self-referencing canonical, og:url and share image for a leaf route's head(). */
export function pageMeta({ path, title, description, type = 'website', canonical }: PageMetaInput) {
  const url = absoluteUrl(path);
  const canonicalUrl = canonical === false ? undefined : absoluteUrl(canonical ?? path);
  return {
    meta: [
      { title }, { name: 'description', content: description },
      { property: 'og:title', content: title }, { property: 'og:description', content: description },
      { property: 'og:type', content: type }, { property: 'og:url', content: canonicalUrl ?? url },
      { property: 'og:site_name', content: SITE_NAME },
      { property: 'og:image', content: SHARE_IMAGE }, { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' }, { property: 'og:image:alt', content: `${SITE_NAME} logo` },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title }, { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: SHARE_IMAGE },
    ],
    links: canonicalUrl ? [{ rel: 'canonical', href: canonicalUrl }] : [],
  };
}

export const jsonLd = (data: object) => ({ type: 'application/ld+json', children: JSON.stringify(data) });

/** BreadcrumbList from Home down to the current page. */
export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return jsonLd({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Home', path: '/' }, ...trail].map((crumb, index) => ({
      '@type': 'ListItem', position: index + 1, name: crumb.name, item: absoluteUrl(crumb.path),
    })),
  });
}

const NUMBERS = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven'];

/** Class key ("p7", "s1", "baby") a catalog page belongs to, read from its file name. */
export function classOf(path: string): string | undefined {
  const name = path.replace(/^\//, '');
  const short = /^(?:menu )?(baby|middle|top|[ps]\.?[1-7])\b/i.exec(name);
  if (short) return short[1]!.toLowerCase().replace('.', '');
  const nursery = /(Baby|Middle|Top)Class/.exec(name);
  if (nursery) return nursery[1]!.toLowerCase();
  const level = new RegExp(`(Primary|Senior)\\s*(${NUMBERS.join('|')})`).exec(name);
  if (!level) return undefined;
  const key = `${level[1] === 'Primary' ? 'p' : 's'}${NUMBERS.indexOf(level[2]!) + 1}`;
  return key === 's7' ? undefined : key;
}
