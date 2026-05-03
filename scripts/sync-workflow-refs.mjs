#!/usr/bin/env node
// Rewrites internal `kethalia/workflows/...@<ref>` uses: lines in this repo's
// own REUSABLE workflows and composite actions to pin them to the version in
// package.json. Runs from the `version` npm script after `changeset version`,
// so the tag created for vX.Y.Z references its own actions at @vX.Y.Z.
//
// Why absolute refs in reusables: GitHub's nested-reusable resolver mishandles
// annotated tags when an outer caller pins `@vX.Y.Z` and the inner ref is
// relative (`./.github/workflows/...`). Pinning the inner ref absolutely
// dodges the bug entirely.
//
// Why we SKIP non-reusable workflows: files triggered by `push`, `pull_request`,
// `workflow_dispatch`, `schedule`, etc. only ever run inside this repo on the
// commit being tested. They're not consumed transitively by external callers,
// so they're immune to the annotated-tag bug. They MUST keep relative refs —
// otherwise the auto-generated "Version Packages" PR rewrites them to point at
// `@vX.Y.Z` BEFORE that tag exists, causing the PR's own CI to fail with
// "workflow was not found" forever (chicken-and-egg).
//
// Detection rule: a workflow is treated as reusable iff its `on:` block
// contains a `workflow_call` trigger. Composite actions (`.github/actions/.../action.yml`)
// are always rewritten — they have no `on:` block and are inherently reusable.
//
// Idempotent: re-running with the same package.json version is a no-op.

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, basename, dirname, sep } from "node:path";

const ROOT = process.cwd();
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const version = pkg.version;
if (!version || !/^\d+\.\d+\.\d+/.test(version)) {
	console.error(`sync-workflow-refs: invalid package.json version: ${version}`);
	process.exit(1);
}
const tag = `v${version}`;

// Match `uses: kethalia/workflows/<path>@<ref>` and capture the path so we can
// rewrite the ref. Path may not contain whitespace or `@`.
const REF_RE = /(uses:\s*kethalia\/workflows\/[^@\s]+)@[^\s"'#]+/g;

function walk(dir, out = []) {
	for (const entry of readdirSync(dir)) {
		const p = join(dir, entry);
		const s = statSync(p);
		if (s.isDirectory()) walk(p, out);
		else if (/\.(ya?ml)$/.test(entry)) out.push(p);
	}
	return out;
}

// Returns true if the file should have its kethalia/workflows refs rewritten
// to the release tag. Composite actions (action.yml) are always rewritten.
// Workflow files are rewritten only when they declare `workflow_call` in `on:`.
function shouldRewrite(file, contents) {
	const name = basename(file);
	// Composite actions: action.yml / action.yaml
	if (name === "action.yml" || name === "action.yaml") return true;

	// Workflow files: only reusables (declare `workflow_call` trigger).
	// Normalize path separators so the check works on Windows too (node:path's
	// `dirname` returns backslashes there).
	const posixDir = dirname(file).split(sep).join("/");
	const isWorkflow = posixDir.endsWith(".github/workflows");
	if (!isWorkflow) return false;

	// Heuristic: match `workflow_call:` as a top-level key. We don't anchor to
	// the `on:` block — that would require a YAML parser — but `workflow_call`
	// is a reserved trigger name, so collisions elsewhere in the file are
	// extremely unlikely. Tolerates either short form (`on: workflow_call:`)
	// or block form (`on:\n  workflow_call:`).
	return /^\s*workflow_call\s*:/m.test(contents) || /\bon:\s*workflow_call\b/.test(contents);
}

const targets = walk(join(ROOT, ".github"));

let changed = 0;
let skipped = 0;
for (const file of targets) {
	const before = readFileSync(file, "utf8");
	if (!shouldRewrite(file, before)) {
		if (REF_RE.test(before)) {
			skipped++;
			console.log(`sync-workflow-refs: skipped ${relative(ROOT, file)} (internal — relative refs preserved)`);
		}
		REF_RE.lastIndex = 0;
		continue;
	}
	const after = before.replace(REF_RE, `$1@${tag}`);
	if (before !== after) {
		writeFileSync(file, after);
		changed++;
		console.log(`sync-workflow-refs: pinned ${relative(ROOT, file)} -> @${tag}`);
	}
}
console.log(`sync-workflow-refs: done (${changed} file(s) updated, ${skipped} internal file(s) skipped, target ${tag})`);
