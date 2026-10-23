# Publish with Cloudflare Pages: direct upload

Documentation checked against Cloudflare's official instructions on **20 October 2026**. This walkthrough has not been tested by publishing a campaign. Dashboard labels can change. No GitHub connection or local build is needed for the dashboard upload. The editor offers **Save to ZIP** for the editable project and **Download website ZIP** for a separate hosting package. AI or the advanced [CLI workflow](ai.md) can also prepare the hosting package.

## Prepare locally

Finish the [review checklist](review-and-recovery.md), obtain the organizer's approval, and download the current project using **Save to ZIP**. Choose **Download website ZIP** to prepare the separate site-only package. This does not save your editable project or publish it. Use the **website ZIP** for hosting. Open the archive to confirm `index.html` is at its root, with `styles/`, `scripts/`, and `assets/` alongside it. Do not upload the toolkit, full backup, JSON-only file, or confidential drafts.

Use your own Cloudflare account. Review any terms, plan, and charges presented before proceeding. Publication makes the uploaded content accessible online; an obscure or preview URL is not confidentiality protection.

## Upload in the dashboard

1. Open [Cloudflare's dashboard](https://dash.cloudflare.com/) and select **Workers & Pages**.
2. Choose **Create application → Get started → Drag and drop your files**.
3. Name the project and upload the website ZIP, or its extracted website folder.
4. Check the file list, then choose **Deploy site** and any **Save and Deploy** confirmation shown.
5. Open the resulting `pages.dev` address.

Cloudflare's dashboard accepts a ZIP or folder. Its documented drag-and-drop limits are 1,000 files and 25 MiB per file. Resolve rejected files and upload the whole export again. A Direct Upload project cannot later switch to Git integration; that requires a new project. See [official Direct Upload instructions](https://developers.cloudflare.com/pages/get-started/direct-upload/#drag-and-drop).

## Check the public result

Open the assigned address with HTTPS. Check the title, image, sources, dates, contact list, wide/narrow layout, and email/copy controls. Test without sending a message. Check that no editor or backup was accidentally uploaded. If anything differs from local preview, pause sharing the link and repair or restore the site. Custom domains are optional and outside this first walkthrough.

## Update

In the existing project, select **Create a new deployment**, choose production or preview, and upload the new complete website export. Preview is useful for reviewing changes but still puts content online. Recheck the result before sharing it. See [Direct Upload updates](https://developers.cloudflare.com/pages/get-started/direct-upload/#create-a-new-deployment).

## Restore a previous version

In the project's **Deployments** view, find a successful previous production deployment. Open its three-dot actions menu, choose **Rollback to this deployment**, and confirm only after verifying the target. Cloudflare does not allow a preview deployment as a rollback target. Check the public address again after restoration. See [official rollback instructions](https://developers.cloudflare.com/pages/configuration/rollbacks/).

Keep your local full backup as well: a hosting rollback restores the public deployment, not your editable project.
