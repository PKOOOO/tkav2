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
 * Three kinds of edit, in the order they are applied:
 *   OVERRIDES     one word in a text block, found via its `layoutId`
 *   PROP_OVERRIDES  string props on a nested component, found via its `id`
 *   REPLACEMENTS  whole-file patterns, for copy that repeats per breakpoint
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
		// Testimonial heading: "What families say" -> "Our success Stories".
		// Three separate text blocks, one word each; the third is inside the
		// "Highlight" wrapper, so "Stories" inherits the squiggle and the tilt.
		{ layoutId: 'IaMh5UOjK', from: 'What', to: 'Our' },
		{ layoutId: 'D68jUZi5r', from: 'families', to: 'success' },
		{ layoutId: 'fYhGqeUSl', from: 'say', to: 'Stories' },
		// Closing CTA band: "Start learning with confidence" -> "Start coding
		// with confidence". Same four-block split as the headings above, and
		// only the second word moves, so "confidence" keeps its highlight.
		{ layoutId: 'QxCtDPQJ9', from: 'learning', to: 'coding' },
	],
	// The same band on every mentor detail page -- same three words, same
	// three-block split, different ids because it is a different component.
	'mentor-detail-section-3-testimonial.jsx': [
		{ layoutId: 'wc0TJYZHv', from: 'What', to: 'Our' },
		{ layoutId: 'Mcui1tc8F', from: 'families', to: 'success' },
		{ layoutId: 'wkBiLa7yk', from: 'say', to: 'Stories' },
	],
	// The comparison table two sections below the pricing cards restates the
	// same figures, so re-pricing the cards without it left /pricing arguing
	// with itself -- a card offering groups of up to 30 above a table saying
	// "Up to 4", and five sessions a week above a "2".
	//
	// Only the three cells the new card copy actually contradicts are touched.
	// The columns are in painted order (Group, Private, Intensive), which was
	// confirmed from their byte offsets rather than assumed -- both "Sessions
	// per week" values are the literal `2`, and the anchor is the only thing
	// telling them apart.
	'pricing-section-2-comparison.jsx': [
		{ layoutId: 'Y9JAQA32N', from: 'Group', to: 'School programs' },
		{ layoutId: 'th53jXLnj', from: '2', to: '5' }, // Private, sessions/week
		{ layoutId: 'MclInIJLh', from: 'Up to 4', to: 'Up to 30' }, // School, learners
	],
}

/**
 * The three testimonial cards in that same band, which are not text blocks but
 * props on a nested component instance:
 *
 *     _jsx(stdin_default, { id: "fdG02DhOD", mUwwmeoSV: "Sophia Taylor", ... })
 *
 * so the `{"word"}` form above cannot reach them. Anchored on `id`, which the
 * export writes alongside `layoutId` and which is unique per card.
 *
 *   mUwwmeoSV  name        bLdPVDbAB  role/attribution     vzedQzXjZ  quote
 *
 * `dAtjPtYy7` (the avatar) is deliberately NOT set here. It is a hot-linked
 * Framer stock portrait, and these are named, identifiable people -- putting a
 * stranger's face against a county official's name is not a layout detail.
 * Omitting the prop does not help either: the card falls back to its own
 * default portrait, which is why the avatar is hidden in `app/globals.css`
 * instead. Give these three real photographs and both can go.
 *
 * file -> [{ id, props }]
 */
const PROP_OVERRIDES = (() => {
	const cards = [
		{
			mUwwmeoSV: 'Mohammed Noor',
			bLdPVDbAB: 'KSEF Chairman, Mombasa County',
			// Abridged to fit the card: the closing sentence ("We truly
			// appreciate ... empowering innovators") is dropped whole, so what
			// is left is verbatim and ends on its own full stop.
			vzedQzXjZ:
				'“Through Tech Kidz Africa’s work in retooling teachers, we’ve seen a remarkable improvement in the quality of innovation projects from junior secondary schools, with many advancing to the national level.”',
		},
		{
			mUwwmeoSV: 'Bernard Maraga',
			bLdPVDbAB: 'Regional Director, Coast Region, Communications Authority of Kenya',
			vzedQzXjZ:
				'“As the Communication Authority of Kenya, we remain committed to working closely with Tech Kidz Africa, particularly on critical areas like online safety, responsible use of AI and child protection, which are essential as learners acquire digital skills.”',
		},
		{
			mUwwmeoSV: 'Prof. Jostinah Wawasi Mwang’ombe',
			bLdPVDbAB:
				'SSP, OGW - OIC, Shimo LaTewa Borstal Institution & Boys Education Centre',
			// Likewise abridged. The first sentence is verbatim; the second is
			// cut after "skills" and the trailing ellipsis marks the omission
			// rather than passing a shortened sentence off as the whole one.
			vzedQzXjZ:
				'“As an institution with children in conflict with the law, we have experienced meaningful inclusion through Tech Kidz Africa and the Raspberry Pi Foundation. Learners in our center have gained digital literacy skills…”',
		},
	]
	const ids = {
		'section-1-main.jsx': ['HIpkk2MXV', 'D22ak1_DT', 'N3f87zGJ8'],
		'mentor-detail-section-3-testimonial.jsx': ['fdG02DhOD', 'sYlzl1LKs', 'c3gNh_0le'],
	}
	// Merged per file, not spread: `section-1-main.jsx` carries both the
	// testimonial cards and the pricing cards, and `{...a, ...b}` would drop
	// whichever list came first.
	return mergeByFile({
		...Object.fromEntries(
			Object.entries(ids).map(([file, list]) => [
				file,
				list.map((id, i) => ({ id, props: cards[i] })),
			]),
		),
		// Footer social row. Same mechanism, different component: each icon is
		// its own instance with a unique `id`, and `tAd8hENoz` is its href.
		// They shipped pointing at bare platform home pages -- facebook.com,
		// x.com, and linkedin.com twice -- which is the export's placeholder
		// state, not a link to anything of ours.
		//
		// Verified as the right organisation rather than assumed: the X
		// profile lists techkidzafrica.co.ke, which is the same domain as the
		// contact email already in this repo.
		//
		// Two of the four slots are repurposed: Dribbble is gone (no account
		// on a design-portfolio site) and Facebook was not among the accounts
		// to list, while YouTube and LinkedIn were missing. The glyphs for
		// those two slots are swapped in app/globals.css -- change one without
		// the other and an icon points somewhere it does not belong.
		//
		//   shNVU7kNi  Facebook glyph -> LinkedIn
		//   ef1C9Vql8  X        (unchanged glyph)
		//   mSKss5lS4  Dribbble glyph -> YouTube
		//   NxmRVi0hw  Instagram(unchanged glyph)
		'footer.jsx': [
			{ id: 'shNVU7kNi', props: { tAd8hENoz: 'https://ke.linkedin.com/company/tech-kidz-africa' } },
			{ id: 'ef1C9Vql8', props: { tAd8hENoz: 'https://x.com/techkidzafrica' } },
			{ id: 'mSKss5lS4', props: { tAd8hENoz: 'https://www.youtube.com/@techkidzafrica' } },
			{ id: 'NxmRVi0hw', props: { tAd8hENoz: 'https://www.instagram.com/techkidzafrica/' } },
		],
	}, pricingCards(), faqAnswers())
})()

/**
 * The five FAQ answers, which the export ships in *three* places: the Pricing
 * FAQ, the Contact FAQ and the Home page. One component, one set of prop
 * names, three instance ids.
 *
 * These answers already existed, as a runtime find-and-replace in
 * `components/ContactDetails.tsx`. That hook is scoped to
 * `[data-route="/contact"]`, so Contact read correctly while Pricing and Home
 * kept the template's answers -- the same route-scoping trap the footer was
 * in. Fixing the source covers all three and drops the runtime work; the
 * matching entries have been removed from that file's COPY map so the copy
 * has one home.
 *
 *   iz8dLER8f/H6bBZRZOD  Ud8d5BBpu/wdAkIO5Do  UKJn2h870/x_pLEqbCc
 *   IXxCcNeJ6/Q4ZZO31fL  Fymv0_Zvc/cSEHqsEip        (question/answer)
 *
 * Only the answers are set. The questions are already right, and Home words
 * its first answer slightly differently from the other two ("a personal
 * learning plan" vs "a personal plan") -- which is exactly why this overwrites
 * by prop rather than matching on the old text.
 */
function faqAnswers() {
	const props = {
		H6bBZRZOD:
			'Your child meets a Tech Kidz Africa mentor and tries an age-appropriate coding, robotics, or digital skills activity. We learn what interests them, then recommend a program and the best next step.',
		wdAkIO5Do:
			'Group sessions let learners build and solve problems together. If your child would benefit from individual support, ask us about one-on-one availability and we’ll help you choose a suitable option.',
		x_pLEqbCc:
			'Our team includes software engineers, robotics trainers, and learning facilitators. Mentors such as Pius Khainja, Peter Lagat, and Clemence Kibet help learners turn ideas into games, websites, apps, and working robots.',
		Q4ZZO31fL:
			'We look at what learners can make and explain—not just what they have covered. Mentors review their games, apps, websites, or robots, help them improve each project, and share their progress with families.',
		cSEHqsEip:
			'If you need to reschedule, pause, or stop sessions, contact us at info@techkidzafrica.co.ke. We’ll explain the options for your child’s program and help with the next step.',
	}
	const ids = {
		'pricing-section-4-fa-qs.jsx': 'G_OT5urlD',
		'contact-section-3-fa-qs.jsx': 'qocF5gvde',
		'section-1-main.jsx': 'by1Elj_pT',
	}
	return Object.fromEntries(
		Object.entries(ids).map(([file, id]) => [file, [{ id, props }]]),
	)
}

/** Concatenates the per-file entry lists of several maps into one map. */
function mergeByFile(...maps) {
	const out = {}
	for (const map of maps) {
		for (const [file, entries] of Object.entries(map)) {
			out[file] = [...(out[file] ?? []), ...entries]
		}
	}
	return out
}

/**
 * The three "Simple, honest, transparent pricing" cards, which the export
 * ships twice: once in the Pricing hero and once on the Home page. Identical
 * component, identical prop names, different instance ids — so the copy is
 * written once here and mapped onto both.
 *
 *   rPYXfJmS9  plan name          Fj80Jlaio  price
 *   G3zABwSLu  billing period     gU9f4qP3I  one-line summary
 *   AwzJEdurJ / UJoKm97Jo / U5Z617BJa / LJgQOnm9S   the four feature rows
 *
 * `zZCpEH6gD` (the button) is left alone on purpose: the two pages label it
 * differently — "Choose Group" on /pricing, "See what's included" on Home —
 * and writing one value here would flatten that distinction.
 */
function pricingCards() {
	const cards = [
		{
			rPYXfJmS9: 'School programs',
			Fj80Jlaio: 'Talk to support',
			G3zABwSLu: '',
			gU9f4qP3I: 'Whole-class sessions, twice a week.',
			AwzJEdurJ: 'Groups of up to 30 learners',
			UJoKm97Jo: '2 sessions / week',
		},
		{
			// Keep the contact prompt and empty period together on every card.
			Fj80Jlaio: 'Talk to support',
			G3zABwSLu: '',
			AwzJEdurJ: '1 learner per session',
			UJoKm97Jo: '5 sessions / week',
		},
		{
			// No figure to show, so the period has to go too -- otherwise the
			// card reads "Talk to support / month".
			Fj80Jlaio: 'Talk to support',
			G3zABwSLu: '',
		},
	]
	// [School programs, Private, Intensive].
	//
	// Read the ids off the file with a brace-matched scan, never a fixed-size
	// window: the three instances sit close enough together that a window wide
	// enough to hold one card overruns into the next, and a first-match regex
	// then reports the following card's name against this card's id. That is
	// exactly how `Q3z99ddd2` and `ay2izVInd` came to be swapped here on the
	// first pass, which put "Talk to support" on Private and the per-session
	// price on Intensive. The Pricing hero also declares them in a different
	// order than it paints them, so the names are the only reliable guide.
	const ids = {
		// ZophSeEVu = Group, ay2izVInd = Private, Q3z99ddd2 = Intensive
		'pricing-section-1-hero.jsx': ['ZophSeEVu', 'ay2izVInd', 'Q3z99ddd2'],
		// m6YzKd1Xi = Group, uK9a2VVIz = Private, uACsxAk2h = Intensive
		'section-1-main.jsx': ['m6YzKd1Xi', 'uK9a2VVIz', 'uACsxAk2h'],
	}
	return mergeByFile(
		Object.fromEntries(
			Object.entries(ids).map(([file, list]) => [
				file,
				list.map((id, i) => ({ id, props: cards[i] })),
			]),
		),
		// The one button that has to move with the rename. /pricing labels
		// these "Choose <plan>", so renaming Group left a "Choose Group"
		// button on a card headed "School programs". Home is untouched here --
		// its buttons all read "See what's included", which still fits.
		{
			'pricing-section-1-hero.jsx': [
				{ id: 'ZophSeEVu', props: { zZCpEH6gD: 'Choose School programs' } },
			],
		},
	)
}

/**
 * Whole-file patterns, for copy the export repeats once per breakpoint — a
 * `layoutId` anchor reaches the first copy only, and the footer's credit line
 * exists twice (Desktop and Phone) with identical markup.
 *
 * The footer renders on every route from `components/Shell.tsx`, but only
 * `/contact` ever showed the right details: `components/ContactDetails.tsx`
 * rewrites them at runtime and is scoped to that route, so every other page
 * was still advertising `hello@yourbrand.com`. Fixing the source here makes
 * all routes agree and costs nothing at runtime — ContactDetails simply stops
 * matching the footer, while its own contact-card entries keep working.
 *
 * `expect` is a tripwire. These are blunt instruments compared to an id
 * anchor, so each one states how many hits it should make; anything else is
 * reported rather than silently applied. Zero means "already applied", which
 * is the normal case on a re-run.
 *
 * file -> [{ what, find, to, expect }]
 */
const REPLACEMENTS = {
	'footer.jsx': [
		// Both the visible text and the `mailto:` beside it.
		{
			what: 'contact email',
			find: /hello@yourbrand\.com/g,
			to: 'info@techkidzafrica.co.ke',
			expect: 2,
		},
		{
			what: 'opening hours',
			find: /\{"Open Mon\\u2013Sat, 9:00\\u201319:00"\}/g,
			to: '{"Open Mon\\u2013Sat, 8:00 AM\\u20135:00 PM"}',
			expect: 1,
		},
		{
			what: 'address',
			find: /\{"In-center and online, worldwide"\}/g,
			to: '{"Bustani Close, Off Links Road, Nyali"}',
			expect: 1,
		},
		// "Designed by <a>Webestica</a>, Powered by <a>Framer</a>" collapses to
		// one text node. Swapping the four strings in place would leave two
		// empty anchors behind -- zero-width, still focusable, still in the
		// accessibility tree -- so the links go with the words. Matching the
		// span between the two known endpoints keeps this to one entry instead
		// of a 45-line literal, and `expect: 2` catches it if the export ever
		// stops emitting the pair.
		{
			what: 'footer credit',
			find: /\{"Designed by "\}[\s\S]*?\{", Powered by "\}[\s\S]*?<\/Link2>/g,
			to: '{"Developed by Tech Kidz Africa"}',
			expect: 2,
		},
	],
	// The paragraph under that same CTA heading, so the band reads as one
	// thought. On its own line inside the braces, like the comparison heading
	// below, so it needs the pattern form rather than a `layoutId` anchor.
	//
	// The em dash is new: the template ran "...a personal learning plan no
	// commitment, no card required" straight through with no punctuation
	// between the two clauses.
	'section-1-main.jsx': [
		{
			what: 'closing CTA paragraph',
			find: /"Meet a mentor, find your level, and get a personal learning plan no commitment, no card required\."/g,
			to: '"Meet a mentor, find your level, and get a personal coding plan — no commitment, no card required."',
			expect: 1,
		},
	],
	// The comparison heading names the plans in prose, so the rename has to
	// reach it too. Not a `layoutId` entry: this string is long enough that
	// the export puts it on its own line inside the braces, and the `{"..."}`
	// form the OVERRIDES matcher looks for never appears.
	'pricing-section-2-comparison.jsx': [
		{
			what: 'comparison heading',
			find: /"Comprehensive Comparison of Group, Private, and Intensive "/g,
			to: '"Comprehensive Comparison of School programs, Private, and Intensive "',
			expect: 1,
		},
	],
}

/**
 * The span of the object literal passed to the `_jsx(...)` call that contains
 * `anchor`. Walks back to the call, then brace-matches forward, skipping over
 * string contents so a brace inside a quote cannot unbalance the count.
 */
function propsObjectSpan(source, anchor) {
	const call = source.lastIndexOf('_jsx', anchor)
	if (call === -1) return null
	const open = source.indexOf('{', source.indexOf('(', call))
	if (open === -1 || open > anchor) return null

	let depth = 0
	for (let i = open; i < source.length; i++) {
		const ch = source[i]
		if (ch === '"' || ch === "'" || ch === '`') {
			const quote = ch
			i++
			while (i < source.length && source[i] !== quote) {
				if (source[i] === '\\') i++
				i++
			}
			continue
		}
		if (ch === '{') depth++
		else if (ch === '}') {
			depth--
			if (depth === 0) return [open, i + 1]
		}
	}
	return null
}

let changed = 0
// The union of the three maps: footer.jsx is only in REPLACEMENTS, and
// iterating OVERRIDES alone would never open it.
const files = [
	...new Set([
		...Object.keys(OVERRIDES),
		...Object.keys(PROP_OVERRIDES),
		...Object.keys(REPLACEMENTS),
	]),
]

for (const file of files) {
	const path = join(framerDir, file)
	if (!existsSync(path)) {
		console.warn(`  ${file}: not found — skipped`)
		continue
	}
	let source = readFileSync(path, 'utf8')
	let applied = 0

	for (const { layoutId, from, to } of OVERRIDES[file] ?? []) {
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

	for (const { id, props } of PROP_OVERRIDES[file] ?? []) {
		const anchor = source.indexOf(`id: "${id}"`)
		if (anchor === -1) continue
		const span = propsObjectSpan(source, anchor)
		if (!span) {
			console.warn(`  ${file}: could not bracket the props for ${id} — skipped`)
			continue
		}

		// Rebuild the whole object in one pass: every offset inside it moves as
		// soon as one value changes length, so editing in place would need the
		// span recomputed per prop.
		let [from, to] = span
		let body = source.slice(from, to)
		for (const [key, value] of Object.entries(props)) {
			// Prettier puts a long value on its own line, hence the \s* before
			// the quote. Two delimiters, not one: the export switches to a
			// template literal for any string that itself contains a double
			// quote -- one of these three quotes does -- and a `"`-only pattern
			// silently skips exactly those.
			const re = new RegExp(
				`(\\b${key}:\\s*)(?:"(?:[^"\\\\]|\\\\.)*"|\`(?:[^\`\\\\]|\\\\.)*\`)`,
			)
			if (!re.test(body)) {
				console.warn(`  ${file}: ${id} has no ${key} prop — skipped`)
				continue
			}
			const next = body.replace(re, (_m, lead) => lead + JSON.stringify(value))
			if (next !== body) {
				body = next
				applied++
			}
		}
		source = source.slice(0, from) + body + source.slice(to)
	}

	for (const { what, find, to, expect } of REPLACEMENTS[file] ?? []) {
		const hits = source.match(find)?.length ?? 0
		// Zero is the steady state once this has run; anything other than the
		// stated count means the export moved and the pattern is guessing.
		if (hits === 0) continue
		if (hits !== expect) {
			console.warn(`  ${file}: ${what} matched ${hits}x, expected ${expect} — skipped`)
			continue
		}
		source = source.replace(find, to)
		applied += hits
	}

	if (applied) {
		writeFileSync(path, source)
		console.log(`  ${file}: ${applied} text override(s) applied`)
		changed++
	}
}

console.log(changed ? `patched ${changed} file(s)` : 'no text overrides to apply')
