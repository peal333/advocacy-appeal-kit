# Open-source release checklist

Status: **early-release/public-beta candidate; publication, license and reporting decisions pending**, 20 October 2026. This checklist does not authorize publication or certify comprehensive acceptance. Preserve previously delivered test archives; prepare any new candidate separately.

## Decisions and evidence required before release

- [ ] Choose GPL version 3 only or GPL version 3 or later; confirm who can authorize the code license and the correct copyright notices. Then add the approved license text/notices. The current note is not a license grant.
- [ ] Review code, CSS, documentation and any assets for origin, permissions and attribution. No bundled image files or package dependencies were found in this pass, but absence is not proof of ownership or a completed provenance audit.
- [ ] Confirm the approved project/contribution destination and release approver. Configure and verify a private security-reporting route and a supported-version/triage policy before inviting public reports. Update [SECURITY.md](../../SECURITY.md) and [CONTRIBUTING.md](../../CONTRIBUTING.md); do not invent contacts or support promises.
- [ ] Complete the [real-browser acceptance checks](verification.md) against the exact candidate archive after fresh extraction. Record browser/OS versions, date, archive hash, actual outcomes and failures. The maintainer has reported guided AI creation, a correct exported hero and a deployed example, as recorded in the verification guide. That limited result is not a full checklist pass.
- [ ] Before selecting an early-release/public-beta version/name, explicitly document unperformed checks and known failures. Do not label an incomplete checklist as comprehensive browser acceptance. Schema version 1 is a data-format version, not the toolkit's release version.

## Build and validate the exact candidate

- [ ] Run `node app/tools/build.cjs`, all Node tests and JavaScript syntax checks. Record the tested Node version. No package installation is needed.
- [ ] Run `node app/tools/check-release.cjs`. Review any unexpected file; fix local links and generated-file drift. External links need a separate online check, not a claim based on this script.
- [ ] Review starter and fixtures: fictional names, reserved example domains, no real campaign content, private records, credentials, real-recipient email, tracking or unlicensed media. Review screenshots and logs too if adding any.
- [ ] Review every distribution file. Include the approved license/notices, README, contributor/security docs, campaign/schema, root `index.html` and `editor.html`, public `styles/` and `scripts/`, `app/setup/`, `app/src/`, `app/tests/`, `app/tools/`, `app/workflow/`, and checksum manifest. Exclude working backups, other projects, private notes, browser profiles, logs, caches, `.git`, credentials, temporary exports and prior archives. Never ZIP the entire parent workspace.
- [ ] Refresh `SHA256SUMS` with `node app/tools/check-release.cjs --write-checksums` after the final content review. Run the checker again. The manifest deliberately excludes itself; checksums detect drift, not authorship or trust.
- [ ] Assemble a fresh, separately named toolkit ZIP using only the reviewed files. Verify its entry list, absence of symlinks/path traversal/duplicate paths, and every extracted file against the manifest. Check for extra files not in the manifest. Record the archive's SHA-256 outside that archive. Do not overwrite the user's v2 test ZIP.
- [ ] Exercise the AI handoff from that extracted toolkit: create a customized project ZIP, extract it, change a contact and regenerate using only that project. Also save inline edits with **Save to ZIP**, reopen the fresh download and save again without the original toolkit. Verify all media survive, public output excludes unused images, source bundle/checksums match, and no notes/old outputs ship. Include README.md, all bundled prompts and every required exporter/bundle helper in the explicit project allowlist. Test optional legal-notice retention when licensing is completed.
- [ ] From that extracted toolkit, export a website and an editable backup with a permitted test image. Confirm root-level public `index.html` and relative assets, no editor/config in website output, and close/reopen/import preservation of text, groups and image bytes. Inspect embedded public data and all exported assets for privacy, confirming unused files and asset records are absent while checking included image metadata. Review the full inventory separately before sharing a backup.

## Approve and publish separately

- [ ] Obtain explicit approval of the final candidate, destination and release notes. Git operations and publication belong to the coordinating owner, not background reviewers.
- [ ] Release notes identify version, known limitations, tested environments, checksums, license, contribution/reporting routes and what changed. Do not call this audited, production-certified or fully accessible without supporting evidence.
- [ ] After authorized publication, verify the downloadable archive, checksum and documentation links match the approved candidate. This step is not authorized or performed by this preparation pass.

See [the release-preparation record](release-verification.md) for completed checks and unresolved evidence.
