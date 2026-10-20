# Customize without AI

You need the extracted toolkit, a desktop browser, public source material, and any images you have permission to publish.

## Open and edit

1. Extract the **whole toolkit ZIP** and open `setup/index.html` in your browser. Keep its folders together. Do not open it from inside a ZIP viewer. No install, terminal, server or online account is required.
2. Start with the instructional template (`Your campaign title`), or choose **Open backup** to load this kit's editable backup ZIP or version-1 campaign JSON. JSON does not contain images; restore the image files with their original filenames through **All fields → Images & permissions**.
3. In **Edit page**, click outlined page text and type directly. The selected item gets a blue outline and pencil label. The right sidebar shows that item's properties. Inline editing uses plain text. Press Escape to leave a text field; use the sidebar for dates, URLs and other structured details.
4. Click **Page settings** for the campaign ID, language, updated date, appearance, optional petition URL and sharing metadata. Desktop preview is a 1,100-pixel viewport; Mobile is 390 pixels. The canvas scales down to fit your editor window.
5. Click **Hero image** or the page's hero illustration to choose one PNG, JPEG or WebP image. Replacement clears the alternative text so you describe the new image. Missing alternative text produces an accessibility warning, but you can still preview and export. Add creator, source and permission information. Old images are retained in the project and can be managed through **All fields**. Images are limited to 5 MiB and 40 megapixels each; do not include confidential metadata or filenames.

## Contacts, messages and supporting content

- **Contacts & groups:** replace the non-real example recipient, or add a recipient and enter their name, public email and role. Never guess an address. Public source URL and verification date are optional, and may be entered independently. Leave them blank if not recorded rather than inventing them. Supplied values must be valid.
- **Manage groups:** add a group separately, then choose it from a contact’s group dropdown. Groups can remain empty and are saved in the editable backup. Renaming a group updates its member contacts. Deleting a group preserves all its contacts as **Ungrouped**. Groups label the recipient menu; they do not send messages or apply group-wide templates.
- **Message template:** edit the default subject and body. The supported placeholders are `{{name}}`, `{{personalMessage}}` and `{{recipient}}`. A contact can override either field; leave an override blank to inherit the default. Visitors remain responsible for reviewing and sending messages.
- **Page sections:** add or reorder extra sections, timeline entries, sources and further links. Add sources before selecting them in timeline/event controls. A source in use cannot be removed in the contextual editor until its references are updated. Review actual verification dates and public links.
- **Optional event:** use a sourced date-time with an explicit time zone and an after-event message. Do not invent an exact time for an approximate or unconfirmed event.
- **All fields:** use the original form editor whenever you need the complete field list or full image inventory. Both editors work on the same data and exports.

## Review and save

1. Open **Review before export** in the sidebar. Complete required fields and fix errors. The edit canvas stays available while a new entry is incomplete, but project, website and editable-backup exports remain blocked until validation passes. Warnings still require human review; validation cannot verify truth, consent or permissions. Missing poster alternative text is a warning, and blank contact source/verification fields are allowed. Neither blocks preview or export.
2. Switch to **Visitor preview**. Editor outlines and pencil labels disappear. Review both widths, recipient-specific messages and all links. Opening an email app does not send a message. Do not send test messages to real recipients.
3. Choose **Save project ZIP** and check that the download finished. This is your main take-away file: it contains this toolkit, your current campaign, every listed image, an updated offline bundle and fresh checksums. Extract the downloaded ZIP into a new folder and open its `setup/index.html` to verify it. Your campaign and images load automatically. Upload this one ZIP to an AI chat for later changes, or continue manually in the extracted editor. You do not need the original toolkit.
   - **Save editable backup** is a smaller optional data/media backup, not the full toolkit. Restore it with **Open backup**. That importer accepts backups/JSON, not whole project ZIPs.
4. Choose **Export website ZIP**. Its `index.html`, `styles/`, `scripts/` and `assets/` are at the root, ready for hosting. This is different from your project ZIP and editable backup, and exporting does not publish anything.
5. Complete the [publication review](review-and-recovery.md), then follow the [hosting guide](publish-cloudflare.md) only when you approve publication.

Edits live in memory, not in an automatically saved account. Closing or refreshing can lose unsaved changes. Save and confirm the project download before closing. Save creates a new ZIP download; it cannot overwrite the original ZIP or extracted folder. Continue from the newly extracted copy, not an older folder. There is no application-wide Undo/Redo or Cancel button. Your browser may undo text in the focused field, but that is not reliable recovery for deleting groups, sections or images. To discard unsaved changes, reload/close the editor and accept the browser's leave warning if shown; reopen your last saved project. Keep older saved versions until the new one is verified. **Download JSON only** can preserve in-progress data, including incomplete entries, but excludes images and an invalid JSON campaign will need its errors corrected before it can be imported again.

The importer accepts only this kit's unmodified, uncompressed backup ZIPs. Do not unzip and recompress them before import. Total images are limited to 19 MiB, campaign JSON to 1 MiB, and website/editable-backup archives and backup imports to 20 MiB. The full project ZIP has a separate 50 MiB limit because it also carries source files and embedded media for offline startup. Migration from unrelated platforms is not part of this prototype.

See [recovery](review-and-recovery.md) and [verification status](verification.md). Actual browser acceptance testing is still required; automated checks are not visual or browser certification.
