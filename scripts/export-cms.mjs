/**
 * Refreshes src/cms.json from the Framer project.
 *
 * lib/cms.json is a snapshot: editing content in Framer does not update the app
 * until this runs. It opens a Framer agent session, reads every collection, and
 * writes each item with:
 *   - named fields, for our own React code
 *   - a `byId` map keyed by Framer field id, which feeds __bindCmsFields and so
 *     drives the real Framer components on the CMS detail routes
 * References store the target's *slug* (not an id) and are expanded into joined
 * `<refFieldId>_<targetFieldId>` keys, which is how the exported components
 * bind through a reference (e.g. Program.Team -> Mentor.Title).
 *
 * Usage: pnpm cms
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const PROJECT_ID = 'vwoNWCIAhOAVyz4RfKbR'
const here = dirname(fileURLToPath(import.meta.url))
const script = join(here, 'export-cms.framer.js')
const outFile = join(here, '..', 'lib', 'cms.json')

const run = (args, opts = {}) =>
    execFileSync('npx', ['@framer/agent@latest', ...args], {
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
        ...opts,
    })

console.log(`opening a session on Framer project ${PROJECT_ID}...`)
const session = run(['session', 'new', PROJECT_ID]).trim().split('\n').pop().trim()
if (!/^\d+$/.test(session)) throw new Error(`unexpected session id: ${session}`)

console.log(`session ${session}; reading collections...`)
const json = run(['exec', '-s', session], { input: readFileSync(script, 'utf8') })

const start = json.indexOf('{')
if (start === -1) throw new Error(`no JSON in output:\n${json.slice(0, 400)}`)
const data = JSON.parse(json.slice(start))

writeFileSync(outFile, JSON.stringify(data, null, 2) + '\n')
const counts = Object.entries(data).map(([k, v]) => `${k}: ${v.length}`).join(', ')
console.log(`wrote lib/cms.json (${counts})`)
