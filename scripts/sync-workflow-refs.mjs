#!/usr/bin/env node
// Rewrites internal `kethalia/workflows/...@<ref>` uses: lines in this repo's
// own workflows and composite actions to pin them to the version in
// package.json. Runs from the `version` npm script after `changeset version`,
// so the tag created for vX.Y.Z references its own actions at @vX.Y.Z.
//
// Idempotent: re-running with the same package.json version is a no-op.

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

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

const targets = walk(join(ROOT, ".github"));

let changed = 0;
for (const file of targets) {
	const before = readFileSync(file, "utf8");
	const after = before.replace(REF_RE, `$1@${tag}`);
	if (before !== after) {
		writeFileSync(file, after);
		changed++;
		console.log(`sync-workflow-refs: pinned ${relative(ROOT, file)} -> @${tag}`);
	}
}
console.log(`sync-workflow-refs: done (${changed} file(s) updated, target ${tag})`);
