# Review, update, and recover

## Before a real campaign goes live

- Check every claim, quotation, timeline item, and event against its linked source. Resolve contradictions and label uncertainty.
- Check public recipient addresses on authoritative pages and record when you checked them. Use appropriate organizational addresses where possible. Remove the non-real example recipient and all instructional placeholders. Contact source URLs and verification dates are optional in the editor; leaving them blank does not remove the need to check addresses before publication.
- Review each suggested message for accuracy, tone, and a request relevant to that recipient. Try the composer without sending a message.
- Check asset ownership or permission, required attribution, and meaningful alternative text. Missing alternative text is a warning, not a preview or export block. Do not assume the toolkit's planned code license covers an image.
- This release-preparation revision exports only the hero and social-sharing image in the website ZIP, excluding unused asset files and records. Backups still preserve all project images. Original bytes and embedded metadata in exported images are not stripped. Review every included image before publication. The previously delivered v2 ZIP exports the full inventory; do not assume this filtering applies to that archive.
- “Remove hero from page” does not delete its file from the project backup, and an image still selected for social sharing remains public. Use **All fields** and the image inventory’s **Remove image** button to remove an unwanted file from the project entirely, then export again.
- The public JavaScript embeds campaign fields, including fields not visibly displayed, with only unused asset records omitted by this revision. Inspect every field as public information, including metadata, filenames, and source URLs. No confidential evidence, private notes, personal credentials, or unpublished contact details belong here.
- Check headings, links, keyboard navigation, visible focus, narrow-screen layout, and text contrast. Review optional sections and past-event wording.
- Save and reimport a full backup. Extract the website ZIP and check that `index.html` is at the top level. Open it and check images, content, links, and composer controls.
- Have the responsible organizer approve the exact export before uploading. A preview hosted online is still a disclosure; do not upload confidential drafts.

## Safe updates

Keep the last working website ZIP and full backup with a date in their filenames. Import the backup, make changes, recheck affected sources and contacts, and review the whole preview. Export a new backup and website ZIP. Upload the complete website export to the existing hosting project; do not mix files from different versions. Check the live site after each upload.

To recover local editing, reopen `setup/index.html` and import the last good backup. A JSON file restores settings only; it needs the referenced media too. Keep the broken or newer file separately until you have recovered what you need. Do not remove validation checks to force an incompatible file through.

To recover the public site, restore a previous production deployment using your host's controls, or upload your last known-good website ZIP. Confirm the public result. Hosting recovery does not restore unsaved editor work. See the [Cloudflare guide](publish-cloudflare.md).

## Troubleshooting

- **Editor is blank or buttons fail:** extract the whole toolkit again into a new folder and open its `setup/index.html` in a current desktop browser. Keep the original backup. If it still fails, record browser/version and the exact error for a maintainer; do not upload private campaign data in a bug report.
- **Import rejected:** read the error. Use an original toolkit-created backup or valid supported JSON. Unsupported schema versions need an explicit migration, not a hand-edited version number. Use only this kit's original, unmodified backup ZIP: compressed or repacked archives and comments are rejected. See [format limits](campaign-format.md#import-limits).
- **Images missing:** JSON does not carry media. Re-add the matching files or restore a full backup. Check that filenames and references agree.
- **Copy fails:** browser clipboard permissions vary, particularly on local pages. Select the displayed text and copy it manually.
- **Email app does not open:** configure a default email handler in your device/browser, or copy recipient, subject, and body into your preferred mail app. Long drafts may exceed a mailto handler's practical limit. No particular tab-opening or draft behavior is guaranteed; there is no automatic send.
- **Hosted page is missing or unstyled:** upload the website ZIP, not the backup or toolkit. `index.html`, `styles/`, `scripts/`, and `assets/` must share the uploaded root. Check case-sensitive filenames and whether all files were accepted.

There is no built-in tracking or visitor database. This does not make publication anonymous: hosts may log requests, and email apps, petitions, social sites, and source links are separate services.
