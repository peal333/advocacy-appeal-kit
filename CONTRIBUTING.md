# Contributing

This is an early-release/public-beta candidate. Repository publication and the final license decision remain pending. Authorized collaborators can propose changes through the repository; this guide does not grant repository access or establish a private vulnerability-reporting channel. The final license grant and ownership notices are pending; do not assume this draft authorizes redistribution. See the [release checklist](app/workflow/release-checklist.md).

## Start here

Read [AGENTS.md](AGENTS.md) and the [data format](app/workflow/campaign-format.md). Preserve both the manual and AI-assisted workflows. Campaign content belongs in `campaign.json` and media, not a campaign-specific renderer fork. Do not put real campaign records, credentials, private contacts, or confidential evidence in examples, tests, screenshots, or reports.

Organizers need only the extracted toolkit and a desktop browser. Maintainer checks were run with **Node.js v24.19.0**; this is the tested version, not a claimed minimum or compatibility promise. No package installation is required. There is no package manager dependency manifest in this prototype.

## Source map

- `campaign.json` and `campaign.schema.json`: starter data and versioned contract.
- `app/src/core.js`, `app/src/archive.js`, `app/src/site.css`: shared validation/rendering, ZIP handling and public styling.
- `app/setup/`: local editor UI. `app/setup/bundle.js` embeds the starter and public CSS.
- `app/src/schema.js`: generated schema wrapper.
- `app/tools/export-campaign.cjs`: shared-validator export of a portable project, public website and full editable backup. `app/src/project.js` is the canonical browser/CLI project packager with offline SHA-256; `app/tools/project-bundle.cjs` reads the explicit source inventory. Generated `app/setup/project-template.js` embeds that inventory without recursively embedding itself; `app/setup/bundle.js` carries current campaign/media for offline startup.
- `app/tests/`: Node tests, including simulated browser objects. These are not real-browser tests.
- `app/workflow/`: organizer guidance and verification/release records.

Do not hand-edit generated files. Source or documentation changes also require rebuilding `app/setup/project-template.js`; it embeds the exact distributable inventory used by browser saves. After changing their inputs, rebuild:

```sh
node app/tools/build.cjs
node --test app/tests/*.test.cjs
# After reviewing intentional changes and the distributable file inventory:
node app/tools/check-release.cjs --write-checksums
node app/tools/check-release.cjs
```

The final command checks generated-file drift, local documentation/entry-page references and the checksum inventory. Refresh checksums only after reviewing intentional changes and the complete file list. This updates hashes only; it does not make an archive or publish anything. Run syntax checks for changed JavaScript too (`node --check path/to/file.js`).

## Proposing a change

- **Bug reports:** use the repository's issue tracker if you have access and it is enabled. Include a concise problem statement, reproduction with fictional data, expected and actual behavior, toolkit version, OS/browser version, test results and known gaps. If no reporting route is available, prepare the report locally and ask the maintainer how to share it; do not invent a public contact.
- **Scoped improvements:** explain the user problem and proposed change before starting a large feature or dependency change. Small, focused fixes and documentation improvements are easier to review.
- **Pull requests:** authorized collaborators should submit focused changes with a summary, related issue when available, regression coverage, commands actually run and any remaining checks. Include regenerated outputs and reviewed checksums when their inputs change. Follow the repository's collaboration rules; a PR is not release or deployment approval.

For editor changes, distinguish actual browser testing from simulations. Use visibly fictional records and reserved example-domain contacts in tests. Do not send real email, submit real forms, make donations or deploy a campaign as a test. Do not promise a fix or response time on another maintainer's behalf.

Keep changes focused and add regression tests. Preserve IDs, assets, optional fields and supported placeholders on round trips. A schema-version change needs an explicit migration plan and tests, not silent data loss. Discuss new dependencies and their permissions before adding them. Do not submit third-party code or media without provenance and permission evidence.

Use [the browser checklist](app/workflow/verification.md) for behavior changes. Do not mark accessibility, offline startup, clipboard, downloads or email-client checks passed from source inspection alone. Consult [SECURITY.md](SECURITY.md) before sharing a potential vulnerability.

## Four different artifacts

1. **Toolkit:** source, generated local editor files, tests and documentation. Open `editor.html` after extraction. Preserve the directory structure.
2. **Website export:** public campaign output with root `index.html`, `styles/`, `scripts/` and the selected hero/social-sharing assets. This revision omits unused asset files and records from public output; backups retain them. It must not include the editor, tests or editable campaign backup.
3. **Editable backup:** campaign JSON and media for reopening in the toolkit. It is not a website and retains images no longer selected as the hero.
4. **Customized project:** the main AI handoff, carrying the toolkit, current campaign, every listed image and rebuilt offline bundle/checksums. Extract and open its editor, or reupload it for another revision without the original toolkit. It is not the public website. After browser edits, **Save to ZIP** returns a new self-contained project carrying those edits and all media. Use that newest project for the next AI revision. The original ZIP/folder is not overwritten. If only a newer editable backup was saved, supply it alongside the older project and identify it as current.

Neither export nor checksum generation is permission to publish. Release approval, license completion, privacy review and browser acceptance remain separate gates.

## Validate a customized project

The full test-suite evidence applies to the generic toolkit. Some tests assert starter titles or example-domain contacts; a valid customized campaign can fail those fixture assumptions. Do not change real campaign content or application code merely to satisfy them.

Use the customized project's bundled exporter from its extracted directory:

```sh
node app/tools/export-campaign.cjs . ../new-campaign-output
```

The output directory must be new. For browser edits, pass the latest editable-backup ZIP instead of `.`. Extract the newly generated project ZIP into a fresh directory, then run `node app/tools/check-release.cjs` there. Check the actual website archive layout, restore the editable backup and complete browser/content review. The exporter validates the shared data contract and reads back the backup; it does not verify facts or decode images. Image decoding and the 40-megapixel limit require the editor. See [the AI workflow](app/workflow/ai.md).

Portable project packaging uses an explicit file allowlist. When adding a required toolkit file, update `PROJECT_FILES` in `app/src/project.js` and its regression tests. Conventional root LICENSE/NOTICE/COPYING files, with optional `.md`/`.txt` extensions, are retained when present; this behavior does not authorize or invent a license.

## Reproducible local toolkit packaging

After reviewing the manifest and completing the applicable release gates, this maintainer-only recipe uses the existing dependency-free ZIP writer. It uses sorted paths, fixed ZIP timestamps and the current file bytes. It refuses to overwrite a file or place the output inside the toolkit. It does not publish or establish that licensing/browser gates passed. Choose a new candidate filename; never overwrite the delivered v2 ZIP.

Run from the toolkit root:

```sh
node - ../advocacy-appeal-kit-candidate.zip <<'NODE'
const fs = require('node:fs'), path = require('node:path');
const output = path.resolve(process.argv[2]);
process.argv = process.argv.slice(0, 2);
require('./app/tools/check-release.cjs');
const root = process.cwd();
if (output === root || output.startsWith(root + path.sep)) throw Error('Choose an output outside the toolkit.');
const names = fs.readFileSync('SHA256SUMS', 'utf8').trim().split('\n').map(line => line.slice(66).replace(/^\.\//, ''));
names.push('SHA256SUMS');
const files = Object.fromEntries(names.sort().map(name => ['advocacy-appeal-kit/' + name, fs.readFileSync(name)]));
const bytes = require('./app/src/archive.js').write(files);
fs.writeFileSync(output, bytes, {flag: 'wx'});
console.log(require('node:crypto').createHash('sha256').update(bytes).digest('hex') + '  ' + output);
NODE
```

Independently inspect and freshly extract the resulting ZIP, then run the release checker from its toolkit folder and compare the full archive entry list with `SHA256SUMS` plus the manifest itself. Use a standard ZIP utility; the toolkit's backup importer intentionally rejects toolkit/source archives. Keep the archive hash outside the archive, and run real-browser acceptance on this exact extracted candidate.
