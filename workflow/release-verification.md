# Release-preparation verification record

Date: 20 October 2026. Environment: Linux workspace, Node.js **v24.19.0**. This pass prepares documentation and local checks; it does not certify a release, establish licensing rights or claim browser acceptance.

## Completed checks

- The baseline automated suite passed **50/50**. The public-export privacy revision passed **52/52**. After the AI/portable-project workflow, browser project saving and boundary fixes, the generic-toolkit suite passed **69 tests, 69 passed, 0 failed**. These cover validation, rendering, archive defenses, data preservation and simulated editor behavior. See [the test report](../tests/TEST-REPORT.md) for their scope and limitations.
- `node --check` passed for all `src/*.js`, `setup/*.js`, `tools/*.cjs` and `tests/*.cjs` files.
- `node tools/build.cjs` reproduced the starter `setup/bundle.js` and `src/schema.js` byte-for-byte and refreshed the generated `setup/project-template.js` to match the current explicit source inventory. No generated-file drift was found. A separate, narrowly scoped public-export privacy correction was made as described below.
- `node tools/check-release.cjs` passed after refreshing `SHA256SUMS`: generated files match their inputs, local Markdown file references and editor entry-page resources exist, and the manifest covers the current regular files except itself. Markdown fragments and external URLs are outside this script's scope. Hidden entries other than the ignored `.git` directory and symlinks are rejected for review.
- Official [Cloudflare Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/) and [rollback documentation](https://developers.cloudflare.com/pages/configuration/rollbacks/) resolved during this pass. The [dashboard URL](https://dash.cloudflare.com/) resolved, but no dashboard flow or authenticated deployment was exercised. The local `#import-limits` target and external `#create-a-new-deployment` heading were separately inspected.

## Root website/editor layout revision

- Root `index.html` is the generated cause website, with relative `styles/`, `scripts/` and selected public media; root `editor.html` is the full local visual editor. Legacy `setup/index.html` remains compatible. No iframe wrapper or remote runtime is used for the root editor.
- **Save to ZIP** and CLI project export regenerate the root website and offline editor seed from the current campaign. The shared public website builder filters unused asset records; complete projects retain all listed media and toolkit files. Only the separate website ZIP is intended for public hosting.
- The 69-test suite checks direct root resources/script ordering, legacy parity, saved root-site edits, independent reopening and CLI regeneration, and media/checksum preservation. These are file inspections and DOM simulations, not real-browser acceptance.
- The release checker now verifies generated root website files and rejects distribution files outside the explicit source/generated/media inventory. Generated site output stays outside the source template to prevent stale campaign data or recursive packaging.

## Existing v2 artifact audit

The delivered `advocacy-appeal-kit-visual-editor-v2.zip` was preserved, not regenerated. SHA-256:

`374c20f376212b3187f8ef7a129335b54224b769f86c00bd4230886183a218be`

Before this pass's edits, its 27 files matched the workspace byte-for-byte and its 26 payload manifest hashes verified. The ZIP has one empty `assets/` directory and a containing `advocacy-appeal-kit/` folder. CRC checks passed; no duplicate/unsafe paths, symlinks, encrypted entries, comments or unexpected files were found. That is a **toolkit** archive, not a root-level campaign website export.

The workspace now includes release documentation, the AI/portable-project workflow, tooling and the public-export privacy correction, so the existing v2 ZIP does not include these changes. A new candidate must be separately assembled, hashed, inspected and browser-tested after approval of its contents. The current manifest describes the workspace, not the unchanged v2 archive.

## AI and portable-project checks

- `tools/export-campaign.cjs` uses the shared validator, renderer and archive code. It returns the main reusable project ZIP, a root-layout public website ZIP, a complete editable backup and a separate review file. The project includes an explicit allowlist, current campaign, all listed media, an embedded offline image bundle and regenerated schema/checksums. Conventional legal-notice files are included if present as regular files; none were invented.
- Automated tests extract the project, edit a contact and regenerate using only the extracted project, then verify checksums and preserved media. They check public asset filtering, source immutability, missing/unsafe/symlink inputs, invalid schema/signatures, existing-output refusal and rollback after a simulated second-write failure. The initial partial-output defect was reproduced and fixed.
- A real-editor-handler simulated-DOM test boots the customized bundle without a separate import, checks startup edit/import/export locks, then saves all original media. A full 5 MiB synthetic-signature image exposed a base64-regex stack overflow; non-recursive validation fixes it and the regression passes. Image decoding is simulated, not proven for that fixture or a browser.
- CLI media totals are limited to 19 MiB, individual images to 5 MiB, website/backup ZIPs to 20 MiB, and portable project contents and ZIP to 50 MiB. The project limit includes original media plus its base64 copy. Node checks headers, not decoded dimensions; the browser's 40-megapixel check remains necessary.
- Full-suite results describe the generic toolkit, not arbitrary customized campaign data. Some fixture tests assume starter titles/example domains. Customized projects should use exporter validation, the release checker on the returned project, archive/backup inspection and browser review, without rewriting valid content to satisfy starter assertions.
- Browser and CLI now share `src/project.js` for canonical project packaging. The source template excludes itself, current campaign/media, the campaign bundle, generated schema and checksums; those are regenerated rather than nested. Four-generation tests confirm template stability without recursive growth.
- Browser-save tests capture the latest queued inline edit, preserve all images, verify hashes with native SHA-256, extract/check the project, reopen/resave it and regenerate with its own CLI. Startup and pending-upload locks block saving until ready; a failed save retains unsaved state. Pure-JS SHA-256 requires no secure-context Web Crypto, and independently matches Node crypto at padding boundaries and inputs up to 5 MiB.
- The project-save handler uses its own 50 MiB ZIP ceiling rather than the website/backup 20 MiB cap. A 19 MiB-media project larger than 20 MiB packs successfully, and an oversized source inventory is rejected. These are automated/simulated checks, not browser download acceptance.
- No actual ChatGPT/Claude upload/download session or real-browser project startup was performed. The instructions require capability checks and distinguish the main carry-forward project, public website and smaller editable backup. Browser **Save to ZIP** returns a new complete project for the next session; the old ZIP/folder is not overwritten. If only a newer editable backup was saved, supply it alongside the old project and identify it as current.

## Privacy and provenance inspection

- The starter has one non-real `recipient@example.com` contact, instructional text, no supplied source/verification claims and no media. Test contacts and source URLs use `example.com`; hostile credential-like URL strings are synthetic rejection fixtures, not account credentials. No apparent real campaign records or secrets were found in the inspected files; this is not a comprehensive secrets certification.
- Inspection found that v2 website exports include the entire image inventory, including replaced heroes and unused asset records. The release-preparation revision now makes a non-mutating public campaign copy filtered to the hero and social-sharing assets, and uses it for the website files, HTML and script. Two simulated-DOM regression tests exercise the actual export handler: unused files/records are absent, hero/social bytes are preserved, social-only and no-image output work, and editor JSON/full backup retain every original asset. No browser execution is implied.
- Original bytes and embedded metadata in included images are still preserved. Campaign fields other than the filtered asset inventory remain in the public script. The updated organizer documentation warns about both points and distinguishes unchanged v2 behavior.
- The entry page uses local classic scripts and CSS. Build/tests use Node built-ins or local files. No package manifest, lockfile, installed dependency tree, vendored library directory, font files or image assets were found. Starter artwork is HTML/CSS. The schema URL is a declaration, not a runtime fetch. These observations do **not** prove original authorship or clear all permissions.

## Not completed / release blockers

- Real `file://` offline startup, image decoding, visual layout, file pickers/downloads, actual save/reopen/import, accessibility, clipboard restrictions, email-client handling, long drafts and hosting behavior remain unverified here. User testing is pending. No new browser attempt was made in this preparation pass; prior failed attempts remain documented in [verification status](verification.md).
- License variant, ownership notices and code/asset provenance review remain unresolved. No license was installed and no final copyright claim was invented.
- Official contribution destination, private security-reporting channel and supported-version/triage policy are not configured in these documents. No contact or response commitment was invented.
- No new distribution archive, Git operation, upload, repository creation, publication, outgoing email or provider-account change was performed.

Follow [the release checklist](release-checklist.md) before describing a candidate as ready to distribute.

## Single-save editor refinement

The editor now has one download action, **Save to ZIP**, in both root and legacy entrypoints. It downloads the full portable project, including the updated root website, editor/source, current campaign and all listed media. Separate website, editable-backup and JSON download controls/handlers were removed; older imports and advanced CLI outputs remain supported. Required labels use an explicit red `*required` marker, and group/contact deletion is immediate with preserved unrelated data. The generic automated suite passes **72/72**; these remain DOM/source tests, not real-browser acceptance.
