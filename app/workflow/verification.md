# Verification status

Checked 20 October 2026. This is an early-release/public-beta candidate, not a production-readiness or accessibility certification. See [the detailed test report](../tests/TEST-REPORT.md).

## Verified with automated checks

- `node --test app/tests/*.test.cjs`: core data validation, safe public rendering, message placeholders, optional content, image-byte/JSON backup round trips, archive safety, deployment-root layout and bundle consistency.
- Security checks cover hostile text, URL schemes, malformed structures, cross-references, preserved contact groups/overrides/images, edit-message tokens and path allowlists, non-mutating preview sanitation, inert edit-mode links and exclusion of editor code from public exports.
- A small simulated DOM exercises visual-editor startup, contextual selection, queued inline text flushed into the project ZIP, contacts added in an incomplete state, all-fields fallback, visitor-mode switching, distinct preview widths and failed-import recovery.
- JavaScript syntax checks pass. These checks do not launch a browser, decode actual images or establish visual/accessibility correctness.

The generic-toolkit suite currently passes **84/84** on Node.js v24.19.0. New checks cover static recipient cards, preview/export parity, radio-change drafting and restored checked-state initialization, contextual edit targets, toolbar label/control alignment contracts, contact disclosure/back-button spacing and redundant-helper removal, immediate required-field styling in both editing modes, contact More details disclosure and hidden-issue focus, portable-project export, second-generation editing from the extracted project, media preservation, checksum consistency, failed-write cleanup, simulated offline bundled-image startup, and browser-handler Save to ZIP with queued inline edits, upload locks, complete media, nonrecursive source packaging and independent reopening. See [the release-preparation record](release-verification.md). These do not establish that an AI provider can accept/return ZIPs in every session or that a real browser passed.

## User-reported end-to-end check

On 20 October 2026, the maintainer reported successfully using the guided AI workflow to create a campaign, confirmed that the actual exported hero image was correct, and deployed the [Bristol Community Cleanup example](https://bristol-community-cleanup.pages.dev). This is useful end-to-end feedback, not an independent audit or a complete browser acceptance run. No browser/OS version, exact candidate archive hash or full checklist results were recorded for that report. It does not establish all providers' image-generation capabilities or success on every upload/session.

The report does not mark offline editor startup, repeated manual saves, import recovery, keyboard/screen-reader operation, mobile browsers, clipboard failures or email-client behavior as tested. No outgoing email test is claimed.

## Comprehensive browser acceptance remains incomplete

During earlier automated review attempts, the Chromium launch was denied by a socket restriction. The cloud browser also rejected a local `file://` URL by protocol policy; its connection to the local HTTP preview server returned `ERR_CONNECTION_REFUSED`. Those restrictions were not bypassed. Those attempts did not produce real-browser acceptance evidence; they do not negate the later, limited user-reported result above.

On a desktop browser, extract the toolkit and open `editor.html`. Prefer an offline test with the instructional starter:

1. Click the title, introduction and section text; edit inline, then immediately choose **Save to ZIP** to check the final keystroke is retained. Verify a pasted formatted snippet becomes plain text.
2. Select a different item and confirm the sidebar changes. Test keyboard focus, Enter/Escape, outlines, labels and scrolling in both preview widths.
3. Add/replace the hero image; supply alt text and permission information. Confirm the public page shows only the selected hero and the saved project retains image bytes. Leave alternative text blank and confirm preview/export remain available with a warning. Test an invalid image without losing the current project.
4. Check that Open backup and Save to ZIP align at desktop/narrow widths and that keyboard focus remains visible on the file input. Check the space above detail-view back buttons and between Group and More details, including the expanded disclosure. Add, edit, group, rename, move and remove contacts. Create an empty group, save/reopen it, and delete a populated group to confirm its contacts become Ungrouped. Import a version-1 backup without `groups` to verify its contact groups appear. Test inherited and individual messages, optional contact source URLs and verification dates, and the absence of empty source links or verification labels. Add a source and a timeline/event reference, then attempt to remove the referenced source.
5. Try Edit page, Visitor preview and All fields repeatedly. Check that content, scroll, selection and preview width remain sensible. Test link navigation only in Visitor preview; edit-mode links must remain inert.
6. Save one project ZIP, extract it into a fresh folder, close the old editor and open the new `editor.html`. Compare text, contacts and images. Use an older compatible backup to test import. Cancel an import and try a malformed one; confirm current work remains intact. Also test replacing a dirty project and waiting for an image upload.
7. Choose **Save to ZIP**, check the download, close the editor, extract the newly saved project into a fresh folder and open its `editor.html`. Confirm the latest text, groups, contacts and all media are present without a backup import. Save another project and verify it reopens independently. Keep the older ZIP until this succeeds; the original ZIP/folder is not overwritten.
8. In Visitor preview and the finished website, inspect all contact cards at desktop and narrow widths, including long names, roles and addresses. Tab to the radio group and use arrow keys and Space to change the recipient; confirm the selected summary, draft, overrides, copied address and mailto all match. Check source links separately. Disable JavaScript and verify all card details remain readable. In Edit page, selecting a card should open the correct contact sidebar without changing radio choices or opening external links.
9. Prepare a site-only ZIP through the AI/CLI workflow, extract it, open root `index.html` and inspect relative assets. Confirm no editor outlines, controls or scripts appear in the exported site. Review the email draft without sending.

Still without comprehensive recorded acceptance evidence: actual `file://` startup, file pickers/downloads, image decoding and visual layout across supported browsers, real clipboard denial, keyboard-only and screen-reader behavior, mobile browsers, real email clients and long mailto links. The maintainer reported deploying the example above; the earlier automated checks did not perform deployment, provider-account changes or outgoing email.

## Release decisions still open

Complete asset/dependency review, choose GPLv3-only versus GPLv3-or-later, and perform the browser checks above. Preserve dated evidence and known gaps; never mark an unperformed check as passed.
