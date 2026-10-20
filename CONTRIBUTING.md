# Contributing

This is a local prototype being prepared for an open-source release. No public contribution or security-reporting destination is configured in this distribution. The final license grant and ownership notices are pending; do not assume this draft authorizes redistribution. See the [release checklist](workflow/release-checklist.md).

## Start here

Read [AGENTS.md](AGENTS.md) and the [data format](workflow/campaign-format.md). Preserve both the manual and AI-assisted workflows. Campaign content belongs in `campaign.json` and media, not a campaign-specific renderer fork. Do not put real campaign records, credentials, private contacts, or confidential evidence in examples, tests, screenshots, or reports.

Organizers need only the extracted toolkit and a desktop browser. Maintainer checks were run with **Node.js v24.19.0**; this is the tested version, not a claimed minimum or compatibility promise. No package installation is required. There is no package manager dependency manifest in this prototype.

## Source map

- `campaign.json` and `campaign.schema.json`: starter data and versioned contract.
- `src/core.js`, `src/archive.js`, `src/site.css`: shared validation/rendering, ZIP handling and public styling.
- `setup/`: local editor UI. `setup/bundle.js` embeds the starter and public CSS.
- `src/schema.js`: generated schema wrapper.
- `tools/export-campaign.cjs`: shared-validator export of a portable project, public website and full editable backup. `src/project.js` is the canonical browser/CLI project packager with offline SHA-256; `tools/project-bundle.cjs` reads the explicit source inventory. Generated `setup/project-template.js` embeds that inventory without recursively embedding itself; `setup/bundle.js` carries current campaign/media for offline startup.
- `tests/`: Node tests, including simulated browser objects. These are not real-browser tests.
- `workflow/`: organizer guidance and verification/release records.

Do not hand-edit generated files. Source or documentation changes also require rebuilding `setup/project-template.js`; it embeds the exact distributable inventory used by browser saves. After changing their inputs, rebuild:

```sh
node tools/build.cjs
node --test tests/*.test.cjs
node tools/check-release.cjs
```

The last command checks generated-file drift, local documentation/entry-page references and the checksum inventory. If intentional changes make checksums stale, review the complete file list and run `node tools/check-release.cjs --write-checksums`, then run the check again. This updates hashes only; it does not make an archive or publish anything. Run syntax checks for changed JavaScript too (`node --check path/to/file.js`).

## Proposing a change

Before a contribution route is established, keep proposed changes local. Once an official route is announced, include a concise problem statement, reproduction with fictional data, expected and actual behavior, affected toolkit version, OS/browser version, test results, and known gaps. For editor changes, state whether you used an actual browser or a simulation. Do not promise a fix or response time on another maintainer's behalf.

Keep changes focused and add regression tests. Preserve IDs, assets, optional fields and supported placeholders on round trips. A schema-version change needs an explicit migration plan and tests, not silent data loss. Discuss new dependencies and their permissions before adding them. Do not submit third-party code or media without provenance and permission evidence.

Use [the browser checklist](workflow/verification.md) for behavior changes. Do not mark accessibility, offline startup, clipboard, downloads or email-client checks passed from source inspection alone. Consult [SECURITY.md](SECURITY.md) before sharing a potential vulnerability.

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
node tools/export-campaign.cjs . ../new-campaign-output
```

The output directory must be new. For browser edits, pass the latest editable-backup ZIP instead of `.`. Extract the newly generated project ZIP into a fresh directory, then run `node tools/check-release.cjs` there. Check the actual website archive layout, restore the editable backup and complete browser/content review. The exporter validates the shared data contract and reads back the backup; it does not verify facts or decode images. Image decoding and the 40-megapixel limit require the editor. See [the AI workflow](workflow/ai.md).

Portable project packaging uses an explicit file allowlist. When adding a required toolkit file, update `PROJECT_FILES` in `src/project.js` and its regression tests. Conventional root LICENSE/NOTICE/COPYING files, with optional `.md`/`.txt` extensions, are retained when present; this behavior does not authorize or invent a license.

## Reproducible local toolkit packaging

After reviewing the manifest and completing the applicable release gates, this maintainer-only recipe uses the existing dependency-free ZIP writer. It uses sorted paths, fixed ZIP timestamps and the current file bytes. It refuses to overwrite a file or place the output inside the toolkit. It does not publish or establish that licensing/browser gates passed. Choose a new candidate filename; never overwrite the delivered v2 ZIP.

Run from the toolkit root:

```sh
node - ../advocacy-appeal-kit-candidate.zip <<'NODE'
const fs = require('node:fs'), path = require('node:path');
const output = path.resolve(process.argv[2]);
process.argv = process.argv.slice(0, 2);
require('./tools/check-release.cjs');
const root = process.cwd();
if (output === root || output.startsWith(root + path.sep)) throw Error('Choose an output outside the toolkit.');
const names = fs.readFileSync('SHA256SUMS', 'utf8').trim().split('\n').map(line => line.slice(66).replace(/^\.\//, ''));
names.push('SHA256SUMS');
const files = Object.fromEntries(names.sort().map(name => ['advocacy-appeal-kit/' + name, fs.readFileSync(name)]));
const bytes = require('./src/archive.js').write(files);
fs.writeFileSync(output, bytes, {flag: 'wx'});
console.log(require('node:crypto').createHash('sha256').update(bytes).digest('hex') + '  ' + output);
NODE
```

Independently inspect and freshly extract the resulting ZIP, then run the release checker from its toolkit folder and compare the full archive entry list with `SHA256SUMS` plus the manifest itself. Use a standard ZIP utility; the toolkit's backup importer intentionally rejects toolkit/source archives. Keep the archive hash outside the archive, and run real-browser acceptance on this exact extracted candidate.
