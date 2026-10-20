# Visual-editor revision verification

Date: 20 October 2026. This is a local prototype, not a production-readiness or accessibility certification.

## Current release-preparation checks

On Node.js v24.19.0, the generic-toolkit suite now passes **87 tests, 87 passed**, including app-folder source packaging and ancestor-symlink rejection, root website/editor entry validation, regenerated saved root websites, public-export privacy filtering, the AI portable-project exporter and browser Save to ZIP round trips. See [the release-preparation record](../workflow/release-verification.md) for exact scope, boundary fixes and remaining checks. This is not evidence of a real ChatGPT/Claude session or browser execution. Some test fixtures assume generic starter content and are not acceptance tests for arbitrary customized campaign data.

## Optional own-words spacing

- The shared substitution function now omits standalone empty or whitespace-only `{{personalMessage}}` lines and their extra separator, without globally collapsing blank lines. Nonempty input, other placeholders and unrelated intentional spacing stay unchanged. Both exported website scripts and inline visitor previews use this same function.
- Three new regressions cover middle/start/end/repeated placeholders, inline use, CRLF/CR/LF, whitespace-only input, literal nonrecursive substitution and preserved multiline text. Simulated-DOM execution checks recipient overrides, repeated filled/cleared input, displayed drafts, clipboard payloads and encoded mailto bodies in both public export and inline preview.
- All 87 Node tests pass. Generated outputs, source inventory, syntax and checksums were checked. No real-browser acceptance, email sending or deployed-site update is claimed.

## Public recipient cards

- Shared static HTML now shows every contact as a card with name, role, group, public email, priority and supplied provenance. There is no public recipient select box. Empty optional values are omitted; text is escaped and source URLs are restricted to HTTP(S), without credentials. No schema change or real campaign data was introduced.
- Native, labelled radio controls select one recipient. Runtime simulations verify a browser-restored checked choice initializes the matching draft, switching back to default templates and then per-contact overrides, personalization, encoded mailto, copied address and manual draft edits. Existing clipboard-failure and long-draft regressions still pass.
- Preview and website exports use the same renderer. Tests assert static card presence in root website, inline preview and public export. Edit mode omits visitor runtime, disables radios, removes navigable links and maps each card to the correct contextual contact editor.
- Responsive wrapping and grid sizing are source-checked only. A new Chromium attempt failed before startup because the container denied socket creation (Operation not permitted). Native keyboard behavior, rendering, screenshots and screen-reader use remain unverified. The browser checklist now explicitly covers cards.

## Single-save, required-label and deletion refinement

- Both root and legacy editors expose exactly one download control, labelled `Save to ZIP`. Removed backup, website and JSON download handlers are not retained as hidden controls.
- The save still flushes pending edits and downloads the complete portable project with current campaign data, all media, a refreshed root website, editor and checksums. Older backup/JSON import compatibility and advanced CLI outputs remain supported. Public-export tests exercise the shared website builder rather than removed UI buttons.

- Required fields use an explicit red `*required` text span, not a color-only indicator. The label and control keep their own colors, and `aria-required` is retained in both visual and all-fields modes, including source-reference selects.
- Empty required fields show the reddish attention border, guidance and `aria-invalid` immediately on startup, new entries, mode changes and canvas reselection, without focus/blur. Valid values clear that state on input/change; optional fields retain touched-only error guidance. The regression tests include required source selectors and both sidebar/all-fields modes. Shared validation and save eligibility rules are unchanged.
- Contact sidebars show Name, Public email and Group first. Optional details and the read-only identifier sit under native **More details** disclosure; All fields remains exhaustive. Simulated-DOM regressions cover preserved optional values through typing, selection and Save to ZIP, per-contact disclosure state, and opening hidden fields before review-issue focus. Native keyboard/browser behavior still needs real-browser review.
- Group and contact deletions do not call browser confirmation dialogs. Empty and populated group deletion preserves member contacts and overrides as Ungrouped; contact deletion preserves remaining contacts, overrides and the group catalog. Both contact editing modes report deletion status.
- Other visual section/event removal confirmations remain cancellable. Import replacement confirmation is unchanged.
- Automated evidence is Node DOM simulation and source/style checks, not browser rendering or an accessibility certification. The user separately reported that image upload works; no image handling code was changed in this refinement.

## Focused alignment and spacing refinement

- Reviewed the three supplied screenshot references before editing. The global form-label margin was also applying to the toolbar upload label. Field-label styling now excludes file-button labels; buttons/upload labels share zero margins, sizing and centered flex alignment. Hidden upload inputs have explicit zero padding, margin, border and minimum height without removing keyboard focus behavior. Hero upload labels retain their intentional add-control spacing.
- Native contact **More details** now has 16px top spacing after Group. Shared detail-view back buttons have 14px top spacing below the navigation divider, including contact and other list-item editors. The redundant public-email helper has been removed from the contact sidebar.
- Two new source/simulated-DOM regressions check the CSS contracts, both entrypoint toolbars, disclosure placement/toggling, back navigation and helper removal. All 80 tests pass. No real-browser rendering, screenshot comparison, actual pixel measurements or keyboard acceptance is claimed; existing browser restrictions were not retried or bypassed.

## Original visual-editor revision baseline

- `node --test app/tests/*.test.cjs`: **50 tests, 50 passed**.
- `node --check` for every file in `app/src/*.js`, `app/setup/*.js` and `app/tools/*.cjs`.
- Shared version-1 data supports optional contact source URL/date, advisory poster alternative text, and an optional persisted group catalog. Old version-1 imports remain supported. Keep this revision of the toolkit for editing backups that include the new group catalog; older toolkit versions may reject that additional field.
- Instructional starter uses `my-campaign`, “Your campaign title,” and a non-real recipient at example.com. No invented source or verification date is supplied.
- Original delivered ZIP is preserved separately. No Git operation or publication was performed.

The suite covers validation, URL/email safety, hostile HTML/script text, supported placeholders, optional sections, JSON/image-byte backup round trips, archive path/size/corruption defenses, root-level website export, schema/bundle consistency, clipboard fallback simulation, Unicode/contrast limits, edit-bridge token/path restrictions, import recovery, mode transitions and viewport dimensions.

Revision-specific checks cover:

- Optional provenance absent, blank, valid and invalid, with no empty public-source links or false verification labels.
- Missing alternative text warns without blocking preview/export; missing image files still block export.
- Empty named groups survive backup, dropdown assignment and rename. Immediate group deletion preserves contacts and individual message overrides as Ungrouped.
- Old imports infer groups from contacts. An oversized normalized catalog fails before replacing current data.
- Add contact focuses and scrolls to Name, required labels are shown, empty required fields immediately show a reddish border and accessible invalid state, while untouched optional fields stay quiet, and clickable review issues focus the affected field.
- Image preview serialization uses validated raster data URLs in both edit and visitor previews. Website ZIPs retain relative asset paths and backups retain the original bytes. SVG, mismatched signatures and simulated decode errors are rejected.

The hero-image change avoids parent-origin blob URLs inside an opaque-origin sandboxed iframe. Raster type, size and decode checks remain in place, and the iframe does not gain same-origin permission. This addresses the suspected origin-related cause of the blank canvas; actual visual confirmation remains outstanding.

## Browser checks not completed

A local Chromium launch was attempted but failed before opening a page because the environment denied socket creation. No page navigation, rendered-browser result, screenshot or real image decode is claimed. Earlier attempts through the available cloud browser could not open the local project.

Still unverified:

- Actual `file://` double-click startup, contenteditable caret/scroll behavior, responsive layout and keyboard-only/screen-reader use.
- Actual file pickers, image decode and visible hero replacement, browser downloads, save/close/reopen/import with real images.
- Real clipboard permissions, mobile browsers, email-client launch, long mailto behavior and hosting metadata.

The DOM and Image simulations test state transitions and data preservation, not browser rendering or real decoding. Run the ordered [browser acceptance checklist](../workflow/verification.md) on the instructional starter before using a real campaign.

## Prototype boundaries

- One shared layout and one selected hero image; prior images stay available in the backup.
- Groups organize contacts; group-wide message overrides are not implemented.
- Version 1 only; unrelated website migration is outside this MVP.
- Backup import accepts the kit's uncompressed ZIPs, not arbitrary repacked/compressed archives.
- PNG/JPEG/WebP only; 5 MiB/40 megapixels per image, 19 MiB total image bytes, 1 MiB campaign JSON, 20 MiB archive/import limit.
- Incomplete required content blocks Save to ZIP. Complete or remove incomplete entries before saving; no separate JSON-only draft download is offered.
- No autosave, backend, scraping, analytics, account, provider credential, automatic sending, publication or GitHub integration.
- GPLv3-only versus GPLv3-or-later remains unresolved; no final license grant is claimed.
