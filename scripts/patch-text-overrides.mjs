/**
 * Applies text edits made in Framer that the export cannot currently deliver.
 *
 * The React Export subscription for this project is lapsed, so `pnpm framer`
 * fails and the generated components still carry the old copy. The Framer
 * project is already correct; this re-applies the same edits to the generated
 * output so the running app matches.
 *
 * Each entry is anchored on the block's `layoutId`, which is stable and unique,
 * rather than on the word itself — several of these words ("the") appear more
 * than once in the same file.
 *
 * DELETE THIS SCRIPT once a successful `pnpm framer` runs: the export will carry
 * the new copy on its own, and leaving a second source of truth for site copy is
 * exactly the kind of thing that goes stale silently.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const framerDir = join(here, '..', 'framer')

/** file -> [{ layoutId, from, to }] */
const OVERRIDES = {
	'section-1-main.jsx': [
		// Home hero: "Learning that fits the Learner" -> "Empowering Innovators".
		// "Innovators" goes in the Highlight block so it keeps the squiggle.
		{ layoutId: 'ARJXLZ2Jk', from: 'Learning', to: 'Empowering' },
		{ layoutId: 'd3qRf7kaf', from: 'Learner', to: 'Innovators' },
		{ layoutId: 'TqrsHiFkq', from: 'that', to: '' },
		{ layoutId: 'pItmLGFmj', from: 'fits', to: '' },
		{ layoutId: 'ipAZMU44_', from: 'the', to: '' },
	],
}

let changed = 0
for (const [file, edits] of Object.entries(OVERRIDES)) {
	const path = join(framerDir, file)
	if (!existsSync(path)) {
		console.warn(`  ${file}: not found — skipped`)
		continue
	}
	let source = readFileSync(path, 'utf8')
	let applied = 0

	for (const { layoutId, from, to } of edits) {
		const anchor = source.indexOf(`layoutId={"${layoutId}"}`)
		if (anchor === -1) {
			// Already applied, or the export renamed things.
			continue
		}
		// The rendered string is the first {"..."} after the anchor.
		const rest = source.slice(anchor)
		const match = rest.match(new RegExp(`\\{"${from}"\\}`))
		if (!match) continue
		const at = anchor + match.index
		source = source.slice(0, at) + `{"${to}"}` + source.slice(at + match[0].length)
		applied++
	}

	if (applied) {
		writeFileSync(path, source)
		console.log(`  ${file}: ${applied} text override(s) applied`)
		changed++
	}
}

console.log(changed ? `patched ${changed} file(s)` : 'no text overrides to apply')
