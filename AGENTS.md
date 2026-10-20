# Working on Advocacy Appeal Kit

## AI chat and Codex entrypoint

For whole-toolkit ZIP customization, follow [START-HERE.md](START-HERE.md) and [app/workflow/ai.md](app/workflow/ai.md). Check file/runtime/download capabilities; use `app/tools/export-campaign.cjs` and the shared renderer to produce a self-contained cause-specific project ZIP (the main reuploadable handoff), website ZIP and complete editable backup. Do not assume every chat auto-discovers this file. Export drafts are not human content approval or permission to publish.

## Preserve the two pathways

- The non-AI form editor and AI-assisted data workflow are equally supported. Both use the same `campaign.json`, versioned schema, validation, renderer, and backup format.
- Ordinary campaign changes belong in data and media. Do not fork the renderer or embed a particular real campaign in application code.
- The organizer starts by extracting the toolkit and opening `editor.html` via `file://`. No installs, terminal, local server, remote dependency, module fetch, or provider credential may be required.
- Keep data fields aligned with the schema. Preserve stable IDs, supported placeholders, references, and assets across imports/exports. Reject unsupported versions; migrations must be explicit and tested. Never silently discard unsupported data.
- Website exports contain root-level `index.html` and relative `styles/`, `scripts/`, and `assets/`. Full backups preserve editable settings and media. JSON-only is optional and must warn that media is separate.

## Content and safety

- Keep the example visibly fictional with reserved example domains and no active real-world recipients. Do not copy a real campaign's names, case details, media, branding, or metadata into fixtures.
- Never invent facts, quotes, public email addresses, sources, verification dates, or asset permissions. Ask or flag uncertainty outside publishable data. Verify real contacts against authoritative public sources.
- Treat all campaign data as public. Keep confidential evidence, private annotations, credentials, and sensitive unpublished records out of fixtures, generated files, and reports.
- Render text safely, restrict URL schemes and placeholders, validate imports and archive paths/limits, and avoid executing imported content. Keep essential campaign content and links readable without JavaScript.
- Do not add autosending, bulk sending, scraping, tracking, analytics, databases, provider keys, accounts, or GitHub deployment integration as shortcuts. Visitor messages remain under visitor control.
- Publication and external messages require the organizer's explicit approval. Export is not publication.

## Work ownership and verification

- During a coordinated project workflow, only the root coordinating agent performs Git/GitHub operations, commits, pushes, branch changes, and repository publication. Workers edit only their assigned files and report changes; they do not run Git commands or publish.
- Keep dependencies minimal and reviewed. Do not copy code or media without checking permissions and attribution.
- GPLv3 is the selected direction, but version 3 only versus version 3 or later is unresolved. Do not invent copyright ownership, install final license headers, or claim the licensing decision is complete.
- Run relevant validation, rendering, import/export, archive safety, and regression tests after changes. Test the actual `file://` path, offline startup, backup round trip with images, deployment-root layout, static metadata, optional sections, and hostile text/links.
- Include keyboard/narrow-screen checks, clipboard failure, unavailable mail handlers, and long drafts in browser review. Report actual evidence and browser versions. Never label a planned check as passed or equate source inspection with browser execution.
- Update workflow guides when controls or format change. Keep known limitations and unperformed tests visible. Do not promise full release acceptance from this first iteration.
