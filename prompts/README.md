# Prompts for the AI-assisted workflow

Upload the **whole project ZIP** and tell the assistant what you want. For a new campaign without a full brief, ask it to read **GUIDED_WORKFLOW.md** and begin the questions. If it cannot read the bundled prompt, open that file and paste its complete prompt block. To use the ready-filled Bristol example instead, explicitly choose it and paste its prompt. A GitHub download may have one containing directory; the prompt tells the assistant how to find the project. These prompts are also kept in the complete project returned by the AI exporter and by the editor's **Save to ZIP**.

- **[BRISTOL_COMMUNITY_CLEANUP.md](BRISTOL_COMMUNITY_CLEANUP.md)** is a complete, ready-to-paste one-shot example for a real constructive cause: helping prospective Bristol community litter-pick organizers use official guidance and, if needed, make one appropriate equipment/location/waste-arrangements inquiry. It supplies the campaign brief, public sources, recipient, appeal and design without inventing an event or volunteers. The campaign is independent, not an official Bristol Waste Company or council publication. Live facts and contacts still need verification; the prompt includes a safe review-draft fallback. It does not send email. [View the deployed Bristol example](https://bristol-community-cleanup.pages.dev).
- **[GUIDED_WORKFLOW.md](GUIDED_WORKFLOW.md)** starts a conversation about your own cause. The assistant asks a few questions at a time, checks sources and contacts, helps you review the copy and design, and produces the same portable files.

- **[GUIDED_UPDATE_WORKFLOW.md](GUIDED_UPDATE_WORKFLOW.md)** updates your newest customized project without repeating the creation interview. Contact changes preserve stable IDs, order and groups. It also handles an explicitly different case using chosen contacts from an existing project, preserving the original and checking for old-case carryover.

- **[ALL_FEATURES_DEMO.md](ALL_FEATURES_DEMO.md)** is an opt-in, entirely fictional loaded example: three groups, six contacts, countries, individual appeals, sharing, header timer, bottom background/timeline/sources/existing-efforts sections, footer and optional images. The X follow URL stays empty because no real account should be invented. Reserved example addresses and visible demo warnings make it a safe preview, not a real campaign or replacement for the starter.

“Finished” means a generated review package, **not** approval to publish or email anyone. Test drafts without sending them. A public email address is not permission for bulk mail: send only a genuine, relevant, personally reviewed inquiry and respect the recipient's published contact guidance.

## What to expect

A capable session returns four downloadable files:

1. `<campaign-id>-project.zip`: the main handoff, with root `index.html` and `editor.html`, campaign data, all listed images, these prompts and the toolkit. Reupload this file for later AI changes, or extract it and open `editor.html` offline.
2. `<campaign-id>-website.zip`: just the visitor-facing website for hosting after review. Do not host the complete project ZIP.
3. `<campaign-id>-editable-backup.zip`: campaign data and all listed images for **Open backup** in a compatible editor. It is not a standalone editor.
4. A separate review/change summary with source checks, uncertainties, test results and human checks still needed.

File reading, a compatible Node.js runtime and downloadable-file tools are required for the complete in-chat workflow. Browsing is needed to independently verify live sources. These capabilities vary by session: none of these prompts promises they exist. If file generation is unavailable, the assistant should say so and help prepare data for the local editor instead of pretending to have made a tested ZIP.

## Quick acceptance check

- Download and extract the returned **project** ZIP, keeping its folders together. Open `index.html` to see the campaign and `editor.html` to edit it.
- Check the title, copy, recipients, sources, image/empty-image layout and prefilled appeal. For optional features, inspect both widths, visible/hidden sections, date-label-only and passed timer states, public sharing URL and footer. Test clipboard/native-sharing fallbacks in a real browser when available; do not post or send a test email.
- Change a line in the editor, choose **Save to ZIP**, then extract that new ZIP and open its editor. Confirm the edit and all bundled prompt files, including GUIDED_UPDATE_WORKFLOW.md, survived.
- For an AI revision, upload that newest ZIP and ask for a specific change using GUIDED_UPDATE_WORKFLOW.md. Do not rerun the ready-filled example unless you want to replace your campaign with that cause.

The repository's generic starter and automated fixtures remain fictional, with reserved example addresses. The real-cause brief lives only in prompt documentation; merely adding or reading these files does not publish a campaign or establish affiliation with any organization.

[Start with the README](../README.md) · [Detailed AI workflow](../app/workflow/ai.md) · [Manual editor guide](../app/workflow/manual.md) · [Verification limitations](../app/workflow/verification.md)
