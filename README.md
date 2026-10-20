# Advocacy Appeal Kit

Use this repo to create an appeals website for your mission or cause.

**[Download ZIP](https://github.com/peal333/advocacy-appeal-kit/archive/refs/heads/main.zip)**

*The ZIP contains the latest version on `main`. While this repository is private, you need authorized GitHub access to download it.*

## Choose how to start

Choose either path below. Both produce the same kind of complete project ZIP: your campaign, images, updated website, visual builder and toolkit source. You can switch paths whenever you want.

```text
                       Downloaded project ZIP
                                 |
                 +---------------+---------------+
                 |                               |
        PATH 1: AI-ASSISTED             PATH 2: VISUAL BUILDER
        Upload ZIP to ChatGPT          Extract the whole ZIP
                 |                               |
        Converse, update and review    Open editor.html and edit
                 |                               |
        Ask for updated project ZIP    Choose Save to ZIP
                 |                               |
                 +---------------+---------------+
                                 |
                       Updated project ZIP
                                 |
                 Keep it and reopen with EITHER path
```

### Path 1: AI-assisted in ChatGPT

1. Upload the **whole project ZIP** to ChatGPT.
2. Copy the prompt from **[Start here](START-HERE.md)** into the chat, then talk through your cause and the changes you want.
3. Review the result and ask for an **updated project ZIP** to download and keep.

The chat needs tools that can read the ZIP, run the included exporter and return downloadable files; the starter prompt asks it to check first. If those tools are unavailable, it can help with wording and you can finish using Path 2.

[Open the AI starter prompt →](START-HERE.md)

### Path 2: Visual Builder in editor.html

1. Extract the **whole project ZIP** and keep its folders together.
2. Open **`editor.html`** in a desktop browser, not inside a ZIP viewer.
3. Click the outlined text to edit it. Use the sidebar for images, contacts and page settings, then check **Visitor preview**.
4. Choose **Save to ZIP** and wait for the download to finish. Keep this **updated project ZIP**.

No installation, terminal, server or AI account is needed. **All fields** opens the full form if you prefer that way of editing.

[See the step-by-step editor guide →](app/workflow/manual.md)

## What is in the folder?

- `index.html`: your campaign website.
- `editor.html`: open this to edit your campaign offline.
- `campaign.json` and `campaign.schema.json`: campaign data and its format.
- `assets/`, `styles/` and `scripts/`: supporting website files.
- `app/`: the editor, tools, tests and detailed guides. You do not need to open it for everyday editing.

Keep the whole folder together. `AGENTS.md` and `START-HERE.md` stay at the top level so AI assistants can find the instructions.

## Keep one ZIP. Continue with either path.

Your newest project ZIP is the portable handoff for both workflows. Next time:

- **Use AI:** upload that ZIP to ChatGPT, explain your changes, and ask for an updated project ZIP afterward.
- **Use the Visual Builder:** extract that ZIP and open `editor.html`. Your saved campaign and images load automatically. Edit, then choose **Save to ZIP** again.

Saving downloads a **new file**; it does not overwrite your original ZIP or extracted folder. Unsaved editor changes can be lost when you close or refresh. Always continue from your newest saved project ZIP.

### Which HTML file should I open?

Inside the extracted project’s main folder:

- **`index.html` is your cause’s website:** the visitor-facing page.
- **`editor.html` is the Visual Builder:** where you edit the project and use **Save to ZIP**.

Keep the whole folder together so both pages can find their supporting files.

## Ready to share your website?

**Save to ZIP** keeps your complete editable project. It does not publish anything. Do not upload the whole project to a public host: it includes editor/source files and every listed image, including unused ones. For a site-only hosting package, ask your AI assistant to prepare it from your saved ZIP, or use the advanced [CLI workflow](app/workflow/ai.md).

Before publishing, replace all example content and review the facts, public contacts, message wording, image permissions and full visitor preview. Treat campaign data as public. Do not include confidential evidence, private contact details or sensitive image metadata, or upload them to an AI service.

Your project and backup retain unused images. The website export includes only the selected hero and social-sharing images, but included image metadata is not removed. Review the files before uploading.

[Review before publishing](app/workflow/review-and-recovery.md) · [Publish with Cloudflare Pages](app/workflow/publish-cloudflare.md)

## About this version

This is a **development prototype**, not a release certified for live campaigns. Automated checks have been run; real desktop-browser acceptance testing is still outstanding. See [verification status](app/workflow/verification.md) for the evidence and remaining checks.

GPLv3 is the intended licensing direction, but the exact version choice, final license text and copyright notices are still pending. This note is not a completed license grant. See [contributor guidance](app/CONTRIBUTING.md) and the [release checklist](app/workflow/release-checklist.md).

For technical work: [AI workflow](app/workflow/ai.md) · [Campaign data reference](app/workflow/campaign-format.md) · [Code-editing guidance](AGENTS.md) · [Security information](SECURITY.md)
