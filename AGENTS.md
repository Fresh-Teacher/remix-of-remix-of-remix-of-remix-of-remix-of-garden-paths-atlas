<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

<!-- AGENT-MEMORY:BEGIN -->
## Imported source architecture
- The app was copied from the Garden Paths Atlas repository; preserve its file-based routes and static catalog shards (`src/data`), which reproduce the library without a database.
- Images, fonts and icons served via `/__l5e/assets-v1/` were re-uploaded to this project's own asset storage; asset URLs are project-scoped, so never paste asset URLs from another project.
- Document covers come from the offline thumbnail pipeline (`scripts/generate_thumbnails.py` → `scripts/bake_page_items.py`); never render PDFs in the browser for gallery thumbnails.
- After any catalog change, re-bake with `python3 scripts/bake_page_items.py --thumb-map src/data/catalog/thumb-map`; baking without the thumb map rewrites gallery lists from the shards alone and strips cover, page-count and byte-size metadata that only the map carries.
- Document covers (`/thumbs/*`) are not stored here; `thumbSrc` maps them to jsDelivr on the source GitHub repo to keep the project small.
- Documents pages keep search text in a query store (`src/lib/query-store.ts`) read only by the search box and list islands, and memoize the parsed page shell, so a keystroke never rebuilds the shell.
- Catalog page titles/descriptions for search are rewritten in `src/lib/page-seo.ts` at head() time, because the imported page data carries vague titles and one shared boilerplate description; the page body keeps its original text.
- The public site address lives in `src/lib/site.ts` (`SITE_URL`, GitHub Pages root); every leaf route builds its canonical, og:url, share image and JSON-LD through `pageMeta`/`breadcrumbJsonLd` there, because crawlers need absolute self-referencing URLs.
- Keep the audited UI control set and its dependencies; add other controls only when used, to avoid restoring unused template code.
<!-- AGENT-MEMORY:END -->

## Advertising architecture

- Repair document URLs offline with PDF-signature verification, preserve old document-index aliases, and reuse matching pre-baked metadata before generating new covers; broken-path repair must not break existing bookmarks or remove documents.
- Store newly recovered PDF covers through project-scoped asset pointers, resolved before the legacy thumbnail CDN; the source repository cannot serve newly generated covers.
- Keep ad activation gated by the production environment flag and the explicit approved-host check shared by the bootstrap and manual units; preview traffic must never request real ads.
- Use responsive manual units, unique physical identities per placement, and eight-document feed intervals within the existing pagination; this avoids duplicate initialization without changing browsing behavior.
- Configure Auto ads anchors and vignettes in the Google AdSense account, not custom page overlays; the shared publisher script is the integration point.

## App installation
- Keep home-screen support manifest-only and retain the deployed cleanup worker; offline caching requires a separate explicit request to avoid stale previews.
- Capture browser install offers once in the shared notice controller and consume them through the shared store; navigation and the delayed banner must use the same single-use offer.
- Treat standalone display or an appinstalled event as installed, not a persistent browser flag; uninstalling must not permanently hide the install action.
