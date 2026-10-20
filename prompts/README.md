# Prompts for the AI-assisted workflow

Upload the **whole project ZIP** to ChatGPT, then open one of these files and copy the text inside its prompt block into the chat. A GitHub download may have one containing directory; the prompt tells the assistant how to find the project. These prompts are also kept in the complete project returned by the AI exporter and by the editor's **Save to ZIP**.

- **[BRISTOL_COMMUNITY_CLEANUP.md](BRISTOL_COMMUNITY_CLEANUP.md)** is a complete, ready-to-paste one-shot example for a real constructive cause: helping prospective Bristol community litter-pick organizers use official guidance and, if needed, make one appropriate equipment/location/waste-arrangements inquiry. It supplies the campaign brief, public sources, recipient, appeal and design without inventing an event or volunteers. The campaign is independent, not an official Bristol Waste Company or council publication. Live facts and contacts still need verification; the prompt includes a safe review-draft fallback. It does not send email.
- **[GUIDED_WORKFLOW.md](GUIDED_WORKFLOW.md)** starts a conversation about your own cause. The assistant asks a few questions at a time, checks sources and contacts, helps you review the copy and design, and produces the same portable files.

“Finished” means a generated review package, **not** approval to publish or email anyone. Test drafts without sending them. A public email address is not permission for bulk mail: send only a genuine, relevant, personally reviewed inquiry and respect the recipient's published contact guidance.

## What to expect

A capable session returns four downloadable files:

1. `<campaign-id>-project.zip`: the main handoff, with root `index.html` and `editor.html`, campaign data, all listed images, these prompts and the toolkit. Reupload this file for later AI changes, or extract it and open `editor.html` offline.
2. `<campaign-id>-website.zip`: just the visitor-facing website for hosting after review. Do not host the complete project ZIP.
3. `<campaign-id>-editable-backup.zip`: campaign data and all listed images for **Open backup** in a compatible editor. It is not a standalone editor.
4. A separate review/change summary with source checks, uncertainties, test results and human checks still needed.

File reading, a compatible Node.js runtime and downloadable-file tools are required for the complete in-chat workflow. Browsing is needed to independently verify live sources. These capabilities vary by session: neither prompt promises they exist. If file generation is unavailable, the assistant should say so and help prepare data for the local editor instead of pretending to have made a tested ZIP.

## Quick acceptance check

- Download and extract the returned **project** ZIP, keeping its folders together. Open `index.html` to see the campaign and `editor.html` to edit it.
- Check the title, copy, recipients, sources, image/empty-image layout and prefilled appeal. Do not send a test email.
- Change a line in the editor, choose **Save to ZIP**, then extract that new ZIP and open its editor. Confirm the edit and these three prompt files survived.
- For an AI revision, upload that newest ZIP and ask for a specific change. Do not rerun the ready-filled example unless you want to replace your campaign with that cause.

The repository's generic starter and automated fixtures remain fictional, with reserved example addresses. The real-cause brief lives only in prompt documentation; merely adding or reading these files does not publish a campaign or establish affiliation with any organization.

[Start with the README](../README.md) · [Detailed AI workflow](../app/workflow/ai.md) · [Manual editor guide](../app/workflow/manual.md) · [Verification limitations](../app/workflow/verification.md)
