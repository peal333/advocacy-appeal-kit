# Campaign data: first-iteration reference

Both routes read and write `campaign.json`. Use the bundled `campaign.schema.json` and current example as the authoritative field/type reference; this is a practical map, not a replacement validator. This iteration uses numeric `schemaVersion: 1`.

## Main fields

- Identity: `id`, `title`, `summary`, `language`, `siteUrl`, `updated`.
- Content: `introduction`, `action`, optional `petitionUrl`, `sections` with `heading`/`body`, and `socialLinks` with `label`/`url`.
- Appearance: `theme.accent` and `theme.background` are six-digit hex colors. The current validator requires a light background, dark accent, and at least 4.5:1 contrast. `poster` and `socialImage` refer to listed asset paths; `posterAlt` describes the poster and may be omitted or blank. A poster without alternative text produces an accessibility warning but does not block preview or export.
- Sources: `sources` records have stable `id`, `title`, `url`, `publisher`, and `checked` date. `timeline` entries carry a visible `date` label, `text`, and a matching `sourceId`. A timeline label may describe an approximate date.
- Event: `event` is null when unused, or supplies `label`, `dateTime`, `sourceId`, and `afterText`. Timed values must include `Z` or a numeric UTC offset, for example `2026-11-05T14:00:00+00:00`; verify the actual local-time conversion.
- Contacts: `id`, `name`, `role`, `group`, `email`, `priority`, optional `country`, optional `sourceUrl`/`verified`, and optional `subject`/`body` overrides. Each entry describes one public email address. Optional `country` is plain text up to 200 characters; omit it or leave it blank when unknown. Both editor forms place Country below Role, and a supplied country appears below the role on public cards. IDs must be unique within the contact list. Omit or leave `sourceUrl` and `verified` blank when not recorded; either can be provided independently. A supplied source URL must use HTTP or HTTPS, and a supplied verification date must be valid. Missing values do not produce an empty public source link or a verification claim.
- Groups: optional top-level `groups` is an array of unique names, with at most 100 entries of 1–200 characters each. Names must be nonblank, have no leading/trailing whitespace, and contain no control characters. Empty groups persist in editable backups. Contact `group: ""` means Ungrouped. Old version-1 files without `groups` are supported; the editor merges their contact-derived groups into the saved list. Deleting a group moves its contacts to Ungrouped rather than deleting them.
- Messages: `messages.subject` and `messages.body` are defaults. Nonempty contact-level overrides replace their corresponding defaults. Supported placeholders are exactly `{{name}}`, `{{personalMessage}}`, and `{{recipient}}`. When Your own words is empty or whitespace-only, a standalone `{{personalMessage}}` line and its extra paragraph separator are omitted. Inline placeholders become empty without changing surrounding text; nonempty visitor wording and unrelated template spacing are preserved.
- Media: `assets` records identify `path`, `creator`, `sourceUrl`, and `permission`. Image bytes travel in the full backup separately from JSON. Backups include every listed asset. In this release-preparation revision, website exports retain only the hero and social-sharing asset files and records; the previously delivered v2 ZIP exports the whole inventory. Original image metadata is not removed. Other campaign fields remain embedded in the public script; this format is not private storage.

Use `YYYY-MM-DD` for `updated`, source `checked`, and contact `verified`. A contact verification date must reflect a real review; leave it blank or omit it rather than fill today's date to satisfy validation. Source `checked` and campaign `updated` dates remain required. Web links use HTTP or HTTPS. Content is plain text, not HTML.

## Instructional starter

The bundled starter uses `id: "my-campaign"` and `title: "Your campaign title"`. Its instructions and `recipient@example.com` address are placeholders, not real campaign facts or recipients. Sources, timeline and event start empty to avoid invented evidence or dates. Replace or remove every placeholder before publication.

## Portability rules

Keep referenced source IDs and filenames stable when revising an existing campaign. Use editor-managed media paths and the supported raster image types. Keep the schema version unchanged unless following an explicit migration. Do not add unsupported fields: this version rejects unknown fields rather than silently dropping them.

Set the public `siteUrl` only when you know the final address. A social image needs both a valid media reference and the public URL for its absolute sharing metadata; inspect the exported page and hosted result. Some sharing services may cache old previews.

Group-level message templates and arbitrary custom layouts are not part of this first-iteration data format. Every field may become public; this format has no private-notes area.

## Import limits

Images must be PNG, JPEG, or WebP, at most 5 MiB and 40 megapixels each; all images together must fit within 19 MiB. Pretty-printed UTF-8 campaign JSON is limited to 1 MiB and the complete ZIP, including overhead, to 20 MiB. Backup import supports only this kit's unmodified uncompressed (ZIP STORE) archives. Compressed/repacked ZIPs, archive comments, split archives, unsafe paths, and unsupported files are rejected. Use the original downloaded backup.
