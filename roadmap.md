# AdSense implementation

- [x] Enable ads for the approved production host while blocking previews.
- [x] Add responsive document placements and repeating archive placements.
- [x] Verify ad safeguards, placements, and existing checks (282 passing; desktop/mobile and archive paging checked).
- [x] Document the Google AdSense Auto ads settings required outside the site (account activation remains an owner action).

# App installation

- [x] Unify the app button and browser installation; provide iPhone and unsupported-browser guidance.
- [x] Replace the automatic modal with a dismissible, engagement-delayed banner.
- [x] Verify installation states, mobile layout, manifest assets, and preview safety.

# Audited dead-code cleanup

- [x] Remove the audited dead stylesheet, obsolete popup styles, unused components and utilities, and redundant public files.
- [x] Prune unused dependencies while preserving the retained UI controls (29 packages removed).
- [x] Run the regression suite and verify library navigation and search (282 site tests, 14 export tests; desktop/mobile browser checks).

# Make the remix its own site

- [ ] Choose the new library name, logo and share image, then replace the imported brand in `src/lib/site.ts`, the manifest and the homepage header.
- [ ] Point `SITE_URL` at this site's own deployed address so canonical, `og:url` and structured data stop declaring the source site as the original copy.
- [ ] Publish the site and submit its own sitemap; the shipped robots file still advertises the source site's sitemap, and no sitemap file exists in this copy.
- [ ] Keep ads dormant until the owner has an approved AdSense account of their own; the shipped publisher ID, ad file and host allow-list all belong to the source site.

# Document link repair

- [x] Resolve marked broken links against indexed repository files and verified PDF responses, preserving document identities (3,563 URLs recovered, repairing 4,184 records).
- [x] Reuse verified covers or generate missing covers, retain locked PDF markers, and re-bake all collections with the thumbnail map (421 new covers; all 80,896 records retained).
- [x] Export unresolved links by class and subject, and verify repaired browsing and downloads (217 URLs / 267 records remain for owner review).
