# Advocacy Appeal Kit

Use this repo to create an effective appeals website for your mission or cause. The result is a lightweight, static website that’s easy to deploy and [inexpensive to host](#hosting-options).

**[Download ZIP](https://github.com/peal333/advocacy-appeal-kit/archive/refs/heads/main.zip)**

*This public repository’s ZIP contains the latest version on `main`. Keep your customized project ZIP separately for future edits.*

## Choose how to start

Choose either path below. Both produce the same kind of complete project ZIP: your campaign, images, updated website, visual builder and toolkit source. You can switch paths whenever you want.

```text
                    Project ZIP or repository URL
                                 |
                 +---------------+---------------+
                 |                               |
        PATH 1: AI-ASSISTED             PATH 2: VISUAL BUILDER
        Upload ZIP or paste URL        Download and extract ZIP
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

### Path 1: AI-assisted in ChatGPT Chat / Work

1. Upload the **whole project ZIP** to ChatGPT Chat / Work, **or paste the repository URL** and ask it to read the project:
   https://github.com/peal333/advocacy-appeal-kit.git
2. Say what you want, for example: “Use this kit to help me build a new campaign site. Read prompts/GUIDED_WORKFLOW.md and begin the questions.” If the assistant does not read the bundled prompt, open **[GUIDED_WORKFLOW.md](prompts/GUIDED_WORKFLOW.md)** and paste its entire prompt block instead.
3. Review the result and ask for an **updated project ZIP** to download and keep.

The URL option works when the chat can access or clone the repository. Private repositories require authorized access; pasting a link does not grant it. If URL access is unavailable, download the ZIP yourself and upload it instead.

The chat needs tools that can read the project, run the included exporter and return downloadable files; the guided prompt asks it to check first. If those tools are unavailable, it can help with wording and you can finish using Path 2.

Starting from this repository gives you the toolkit example. For later changes to **your campaign**, upload your newest saved project ZIP, or use a repository URL that contains that same up-to-date customized project.

Prefer a ready-filled example? Paste the complete **[Bristol Community Cleanup prompt](prompts/BRISTOL_COMMUNITY_CLEANUP.md)** instead, or **[view the deployed Bristol example](https://bristol-community-cleanup.pages.dev)**. The **[prompts guide](prompts/README.md)** explains both options and how to check the returned files.

### Update a campaign — or reuse it for a different case

Upload your **newest complete project ZIP** and say: “Read prompts/GUIDED_UPDATE_WORKFLOW.md and help me update these contacts…” The [guided update workflow](prompts/GUIDED_UPDATE_WORKFLOW.md) preserves unrelated copy, stable IDs, groups, ordering and images while checking new or changed facts and recipients. You do not have to repeat the creation interview.

You can also say: “Use this campaign as a starting point for a different case, keeping these relevant contacts.” The assistant preserves your original, creates a new campaign ID, confirms which contacts to retain and rechecks their suitability. It replaces or clears old-case facts, sources, dates, images, appeal overrides and sharing details rather than silently carrying them into the new cause. It asks which route you mean only if unclear.

Want a fuller fictional example first? Use **[ALL_FEATURES_DEMO.md](prompts/ALL_FEATURES_DEMO.md)**: three groups, six contacts, country labels, individual appeals, a timeline and more. It is opt-in, uses reserved example addresses, and is not for real outreach.

#### For assistants receiving this kit

When the user uploads this kit and makes an ordinary request to build a site or website without enough details (for example, “I need to build a site” or “Help me build a website”; no cause/campaign keyword is required), **read [prompts/GUIDED_WORKFLOW.md](prompts/GUIDED_WORKFLOW.md) yourself and begin its initial questions**. Use this kit, not an unrelated website implementation. Do not merely send the user away to copy the prompt.

For revisions or explicitly adapting an existing project to a different case, read [prompts/GUIDED_UPDATE_WORKFLOW.md](prompts/GUIDED_UPDATE_WORKFLOW.md). If it is unclear whether they want a new campaign or edits to the uploaded one, ask first and preserve the existing data. A ZIP with no request is not authorization to build or replace anything: ask what they want to do. Honor an explicitly unrelated request rather than forcing this kit. Follow an explicit complete brief, pasted prompt or revision request instead of restarting an unnecessary interview; preserve unrelated content and media during revisions.

Not every assistant automatically reads bundled instructions or has file tools. If it cannot read the kit, explain that limitation; the user can paste the guided prompt or use the local editor. Uploading files alone does not grant publication or outreach permission.

### Path 2: Visual Builder in editor.html

1. Extract the **whole project ZIP** and keep its folders together.
2. Open **`editor.html`** in a desktop browser, not inside a ZIP viewer.
3. Click the outlined text to edit it. Use the sidebar for images, contacts and page settings, then check **Visitor preview**.
4. Choose **Save to ZIP** and wait for the download to finish. Keep this **updated project ZIP**.
5. When you want a hosting package, choose **Download website ZIP**. This exports the current valid visitor-facing site; it does not publish it or save your editable project. Use **Save to ZIP** separately before closing.

No installation, terminal, server or AI account is needed. **All fields** opens the full form if you prefer that way of editing. Contacts have an optional **Country** field below **Role** in both editing forms; a supplied country also appears below the role on the public card. Leave it blank when unnecessary or unknown.

[See the step-by-step editor guide →](app/workflow/manual.md)

## What is in the folder?

- `index.html`: your campaign website.
- `editor.html`: open this to edit your campaign offline.
- `campaign.json` and `campaign.schema.json`: campaign data and its format.
- `assets/`, `styles/` and `scripts/`: supporting website files.
- `prompts/`: copy-and-paste one-shot and guided AI workflow prompts.
- `app/`: the editor, tools, tests and detailed guides. You do not need to open it for everyday editing.

Keep the whole folder together. This README is the starting point; `AGENTS.md` contains guidance for assistants working on the toolkit.

## Keep one ZIP. Continue with either path.

Your newest project ZIP is the portable handoff for both workflows. Next time:

- **Use AI:** upload that ZIP to ChatGPT, explain your changes, and ask for an updated project ZIP afterward.
- **Use the Visual Builder:** extract that ZIP and open `editor.html`. Your saved campaign and images load automatically. Edit, then choose **Save to ZIP** again.

Saving downloads a **new file**; it does not overwrite your original ZIP or extracted folder. Unsaved editor changes can be lost when you close or refresh. Always continue from your newest saved project ZIP.

### What else does the AI export?

Alongside the complete **project ZIP**, the AI workflow returns a **website ZIP** for hosting, an **editable-backup ZIP** containing campaign data and all listed images, and a separate review/change summary. Keep the project ZIP as your main handoff. Use **Open backup** only for the editable backup or campaign JSON; to open a project ZIP, extract it and open its own `editor.html`. JSON alone does not include images. See the [prompt guide](prompts/README.md) for the acceptance check and [technical workflow](app/workflow/ai.md) for build and export details.

### Which HTML file should I open?

Inside the extracted project’s main folder:

- **`index.html` is your cause’s website:** the visitor-facing page.
- **`editor.html` is the Visual Builder:** where you edit the project and use **Save to ZIP**.

Keep the whole folder together so both pages can find their supporting files.

## Hosting Options

**Save to ZIP** keeps your complete editable project. It does not publish anything. Do not upload the whole project to a public host: it includes editor/source files and every listed image, including unused ones. Choose **Download website ZIP** in the visual editor for a site-only hosting package. You can also ask your AI assistant to prepare it from your saved project ZIP, or use the advanced [CLI workflow](app/workflow/ai.md).

### Easiest options

- **Cloudflare Pages Direct Upload — recommended:** sign in to Cloudflare and upload your site-only ZIP or extracted website folder. No build setup is needed for this static site. [Our walkthrough](app/workflow/publish-cloudflare.md) · [Direct Upload guide](https://developers.cloudflare.com/pages/get-started/direct-upload/#drag-and-drop).
- **Netlify Drop:** extract the site-only ZIP, sign in to the intended Netlify team and drag the website folder into [Netlify Drop](https://app.netlify.com/drop). [Drag-and-drop guide](https://docs.netlify.com/deploy/create-deploys/#drag-and-drop). Account plan and usage limits apply.
- **Vercel Drop:** upload the site-only ZIP or extracted website folder at [Vercel Drop](https://vercel.com/drop), select your team/project name and deploy. It accepts files, folders and ZIPs; static sites need no build step or Git repository. Each drop creates a new project. [Official introduction](https://vercel.com/changelog/vercel-drop). Use your Vercel account and an eligible plan; Hobby is restricted to non-commercial personal use under its [fair-use guidelines](https://vercel.com/docs/limits/fair-use-guidelines).

### Other good options

- **GitHub Pages:** useful if you prefer updating a dedicated website repository. [Create a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).
- **Render Static Sites:** another option for a website maintained in Git. [Static-site guide](https://render.com/docs/static-sites).
- **DigitalOcean App Platform:** supports static-site hosting from a repository. [Plans and pricing](https://www.digitalocean.com/pricing/app-platform).
- **Tiiny.host:** upload the site-only ZIP with `index.html` at its root. [Upload guide](https://helpdesk.tiiny.host/en/article/how-to-deploy-your-project-from-vs-code-fast-16yackv/) · [Current plans and pricing](https://tiiny.host/pricing). Check upload limits and plan eligibility before publishing.
- **Neocities:** file-upload hosting for static sites. [Features and plans](https://neocities.org/supporter).
- **Surge:** command-line publishing for static websites. [Getting started](https://surge.sh/docs/getting-started).
- **Firebase Hosting:** static hosting with a command-line workflow. [Quickstart](https://firebase.google.com/docs/hosting/quickstart).
- **AWS Amplify Hosting:** upload a site-only ZIP without connecting Git. [Manual upload guide](https://docs.aws.amazon.com/amplify/latest/userguide/manual-deploys.html). Hosting is usage-priced, not permanently free. New-customer offers include a free plan for up to six months and eligible credits; older accounts may have different allowances. Check your account's eligibility and [current pricing](https://aws.amazon.com/amplify/pricing/).
- **Amazon S3:** can serve a static website, but its website endpoint does not support HTTPS. Add CloudFront for HTTPS. [S3 website endpoints](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteEndpoints.html).
- **A small VPS:** works with a web server such as Nginx or Caddy, but you manage security updates, HTTPS and backups yourself. It is usually unnecessary for this site.
- **Existing shared or managed hosting:** upload the website files into the host’s public website folder, such as `public_html`. No WordPress or database is required.

Check each provider’s current account requirements, limits, pricing and acceptable-use terms before deploying. Free allowances can change or run out; a custom domain may cost extra. Do not assume an organization’s campaign qualifies for a personal-use plan.

Whichever host you choose, upload only the **website package**, with `index.html` at the deployment root. Keep the complete editable project ZIP separately for future changes.

### Before you publish

Before publishing, replace all example content and review the facts, public contacts, message wording, image permissions and full visitor preview. Treat campaign data as public. Do not include confidential evidence, private contact details or sensitive image metadata, or upload them to an AI service.

Your project and backup retain unused images. The website export includes only the selected hero and social-sharing images, but included image metadata is not removed. Review the files before uploading.

[Review before publishing](app/workflow/review-and-recovery.md) · [Publish with Cloudflare Pages](app/workflow/publish-cloudflare.md) · [Cloudflare upload guide](https://developers.cloudflare.com/pages/get-started/direct-upload/#drag-and-drop)

## Disclaimer

This toolkit is provided **as is, without warranty**. Use it at your own risk. Automated checks and successful examples do not guarantee correctness, availability, security or suitability for your campaign.

## Responsible use

- Verify facts, public contact details and image/content permissions. Personally review your campaign before publishing and every message before sending.
- Keep private information, confidential evidence and credentials out of campaign files and uploads. Review image metadata and remember that backups retain unused media.
- Do not use the toolkit for harassment, impersonation or unsolicited bulk email. Respect recipients' contact guidance and applicable rules.
- You are responsible for your hosting accounts, published content and messages. The toolkit does not automatically send messages or provide a security guarantee.

## Credits and contributions

Created and maintained by **Panupan Sriautharawong (peal333)**, with AI assistance from **ChatGPT**.

Bug reports, focused improvements and pull requests are welcome through the public repository. See [CONTRIBUTING.md](CONTRIBUTING.md) for reporting guidance, development checks and safe test practices. These credits acknowledge contributions; they do not resolve the pending license or copyright notices described below.

## About this version

This is an **early release / public-beta candidate**, not a production or accessibility certification. Automated checks pass, and the maintainer has reported a successful guided AI campaign build, correctly exported hero image and deployed example. Comprehensive desktop/mobile browser, accessibility and recovery acceptance testing remains incomplete. See [verification status](app/workflow/verification.md) for the evidence and remaining checks. The repository is public; final licensing and remaining release-acceptance checks are still pending.

GPLv3 is the intended licensing direction, but the exact version choice, final license text and copyright notices are still pending. This note is not a completed license grant. See [contributor guidance](CONTRIBUTING.md) and the [release checklist](app/workflow/release-checklist.md).

For technical work: [AI workflow](app/workflow/ai.md) · [Campaign data reference](app/workflow/campaign-format.md) · [Code-editing guidance](AGENTS.md) · [Security information](SECURITY.md)
