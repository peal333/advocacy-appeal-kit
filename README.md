# Advocacy Appeal Kit

Make it easy for anyone to create an appeals website.

**[Download the latest ZIP](https://github.com/peal333/advocacy-appeal-kit/archive/refs/heads/main.zip)**

*The ZIP contains the latest version on `main`. While this repository is private, you need authorized GitHub access to download it.*

Add your story, images, sources and a call to action. Visitors can prepare an email or copy a message, then decide whether to send it themselves.

**Keep the whole project with you.** It carries the toolkit and its source, your campaign and your images, so you can switch between AI-assisted work and the visual editor. You do not need to choose one route forever.

## Two files to know

After extracting the ZIP, open either file in the main folder:

- **`index.html` is your cause’s website.** Open it to see the visitor-facing page.
- **`editor.html` is your visual editor.** Open it to make changes, then choose **Save to ZIP** to download the updated package, including the website.

Keep the whole folder together so both pages can find their supporting files.

## Choose how to start

### Build with AI

1. Upload the whole toolkit ZIP to ChatGPT or Claude.
2. Copy the prompt from **[Start here](START-HERE.md)** into the chat.
3. Talk through your cause, review the draft, and ask for your customized **project ZIP** to keep.

It needs tools that can read the ZIP, run the included exporter and return downloadable files; the starter prompt asks it to check first. If your chat cannot do that, it can still help with the wording and you can finish in the editor.

[Open the AI starter prompt →](START-HERE.md)

### Edit it yourself

1. Extract the **whole ZIP** and keep its folders together.
2. Open **`editor.html`** in a desktop browser, not inside a ZIP viewer.
3. Click the outlined text to edit it. Use the sidebar for images, contacts and page settings, then check **Visitor preview**.

No installation, terminal, server or AI account is needed. **All fields** opens the full form if you prefer that way of editing.

[See the step-by-step editor guide →](workflow/manual.md)

## Save now. Pick it up later.

Choose **Save to ZIP** and make sure the download finishes before closing or refreshing. It saves a **new, complete project ZIP** with the toolkit, source, your current campaign, all your images and an updated `index.html` website. Keep that newest ZIP: it is the one file you need for either workflow.

- **Reopen in the editor:** extract your saved project ZIP, keep its folders together, and open `editor.html`. Your campaign and images load automatically.
- **Continue with AI:** upload your saved project ZIP and explain what you want to change. Ask for an updated project ZIP to keep afterward.
The editor has one save/download action: **Save to ZIP**. **Open backup** remains available for older data/media backups or supported JSON; reopen a whole project by extracting it and opening its `editor.html`.

Saving downloads a new file; it does not overwrite your original ZIP or extracted folder. Unsaved changes can be lost when you close or refresh the editor. Always continue from your newest saved project.

## Ready to share your website?

**Save to ZIP** keeps your complete editable project. It does not publish anything. Do not upload the whole project to a public host: it includes editor/source files and every listed image, including unused ones. For a site-only hosting package, ask your AI assistant to prepare it from your saved ZIP, or use the advanced [CLI workflow](workflow/ai.md).

Before publishing, replace all example content and review the facts, public contacts, message wording, image permissions and full visitor preview. Treat campaign data as public. Do not include confidential evidence, private contact details or sensitive image metadata, or upload them to an AI service.

Your project and backup retain unused images. The website export includes only the selected hero and social-sharing images, but included image metadata is not removed. Review the files before uploading.

[Review before publishing](workflow/review-and-recovery.md) · [Publish with Cloudflare Pages](workflow/publish-cloudflare.md)

## About this version

This is a **development prototype**, not a release certified for live campaigns. Automated checks have been run; real desktop-browser acceptance testing is still outstanding. See [verification status](workflow/verification.md) for the evidence and remaining checks.

GPLv3 is the intended licensing direction, but the exact version choice, final license text and copyright notices are still pending. This note is not a completed license grant. See [contributor guidance](CONTRIBUTING.md) and the [release checklist](workflow/release-checklist.md).

For technical work: [AI workflow](workflow/ai.md) · [Campaign data reference](workflow/campaign-format.md) · [Code-editing guidance](AGENTS.md) · [Security information](SECURITY.md)
