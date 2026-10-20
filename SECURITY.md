# Security and sensitive reports

## Current status

This prototype has no published supported-version policy, private vulnerability-reporting channel, security contact or response-time commitment. Establish and verify a private reporting route before public release. Do not treat an invented email address, ordinary public issue or campaign recipient as that route.

Until a route is configured, do not post exploit details, live campaign backups, personal data or credentials publicly. Keep a minimal reproduction using fictional data locally. If you obtained the toolkit directly from its distributor, ask that distributor for a verified private reporting route before transmitting sensitive details. This document does not assert that any particular channel is monitored.

A useful sanitized report includes the toolkit version or archive hash, affected file/feature, OS and browser version, reproduction steps, expected versus observed behavior, and impact. Remove real people, contacts, evidence and secrets. Share only the minimum needed through the verified route. Do not test against other people's campaigns, hosting accounts or inboxes without authorization.

## Security boundaries

- Campaign data and website exports are public-facing material, not secure evidence storage. Backups retain all listed media, including unused images. This revision filters website media and asset records to the hero/social-sharing images; the previously delivered v2 ZIP does not. Original metadata in included images is not stripped, and other campaign fields remain embedded in the public script. Review every included file before sharing.
- The toolkit runs locally without a backend, accounts or automatic sending. This does not make imported files trustworthy or replace device/browser security.
- Import validation, archive limits, text escaping, URL restrictions and the isolated editor preview reduce risk. Automated tests are evidence for specific cases, not a security audit or guarantee.
- Visitor email drafting/copying remains under visitor control. External links, email clients and hosting providers have their own behavior and privacy practices.

If an import seems unsafe, stop using it and preserve a known-good backup separately. Do not upload suspected sensitive material to a public issue, public scanner or hosted demo. For known limitations and unperformed checks, see [verification status](app/workflow/verification.md).

## Maintainer release gate

Before release, choose a monitored private report destination, verify who can read submissions, document how reporters can find it, and define supported versions and a realistic triage process. Do not imply these are in place until verified. Security fixes need regression tests and renewed checks of the affected import/render/export boundaries.
