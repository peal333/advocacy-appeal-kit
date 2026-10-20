# Verification status

Checked 20 October 2026. This is a visual-editor prototype, not a production-readiness or accessibility certification. See [the detailed test report](../tests/TEST-REPORT.md).

## Verified with automated checks

- `node --test tests/*.test.cjs`: core data validation, safe public rendering, message placeholders, optional content, image-byte/JSON backup round trips, archive safety, deployment-root layout and bundle consistency.
- Security checks cover hostile text, URL schemes, malformed structures, cross-references, preserved contact groups/overrides/images, edit-message tokens and path allowlists, non-mutating preview sanitation, inert edit-mode links and exclusion of editor code from public exports.
- A small simulated DOM exercises visual-editor startup, contextual selection, queued inline text flushed into backup, contacts added in an incomplete state, all-fields fallback, visitor-mode switching, distinct preview widths and failed-import recovery.
- JavaScript syntax checks pass. These checks do not launch a browser, decode actual images or establish visual/accessibility correctness.

The generic-toolkit suite currently passes **68/68** on Node.js v24.19.0. New checks cover portable-project export, second-generation editing from the extracted project, media preservation, checksum consistency, failed-write cleanup, simulated offline bundled-image startup, and browser-handler Save project ZIP with queued inline edits, upload locks, complete media, nonrecursive source packaging and independent reopening. See [the release-preparation record](release-verification.md). These do not establish that an AI provider can accept/return ZIPs in every session or that a real browser passed.

## Real browser checks remain blocked

The earlier Chromium launch was denied by a socket restriction. In this pass, the cloud browser rejected a local `file://` URL by protocol policy; its connection to the local HTTP preview server returned `ERR_CONNECTION_REFUSED`. Those restrictions were not bypassed. No real browser workflow or screenshot is claimed.

On a desktop browser, extract the toolkit and open `setup/index.html`. Prefer an offline test with the instructional starter:

1. Click the title, introduction and section text; edit inline, then immediately save a backup to check the final keystroke is retained. Verify a pasted formatted snippet becomes plain text.
2. Select a different item and confirm the sidebar changes. Test keyboard focus, Enter/Escape, outlines, labels and scrolling in both preview widths.
3. Add/replace the hero image; supply alt text and permission information. Confirm the public page shows only the selected hero and the backup retains image bytes. Leave alternative text blank and confirm preview/export remain available with a warning. Test an invalid image without losing the current project.
4. Add, edit, group, rename, move and remove contacts. Create an empty group, save/reopen it, and delete a populated group to confirm its contacts become Ungrouped. Import a version-1 backup without `groups` to verify its contact groups appear. Test inherited and individual messages, optional contact source URLs and verification dates, and the absence of empty source links or verification labels. Add a source and a timeline/event reference, then attempt to remove the referenced source.
5. Try Edit page, Visitor preview and All fields repeatedly. Check that content, scroll, selection and preview width remain sensible. Test link navigation only in Visitor preview; edit-mode links must remain inert.
6. Export both ZIPs, close, reopen and import the backup. Compare text, contacts and images. Cancel an import and try a malformed one; confirm current work remains intact. Also test replacing a dirty project and waiting for an image upload.
7. Choose **Save project ZIP**, check the download, close the editor, extract the newly saved project into a fresh folder and open its `setup/index.html`. Confirm the latest text, groups, contacts and all media are present without a backup import. Save another project and verify it reopens independently. Keep the older ZIP until this succeeds; the original ZIP/folder is not overwritten.
8. Extract the website ZIP, open root `index.html` and inspect relative assets. Confirm no editor outlines, controls or scripts appear in the exported site. Review the email draft without sending.

Still unverified: actual `file://` startup, file pickers/downloads, image decoding, visual layout, real clipboard denial, keyboard-only and screen-reader behavior, mobile browsers, real email clients and long mailto links. No deployment, provider-account change, publication or outgoing email was performed.

## Release decisions still open

Complete asset/dependency review, choose GPLv3-only versus GPLv3-or-later, and perform the browser checks above. Preserve dated evidence and known gaps; never mark an unperformed check as passed.
