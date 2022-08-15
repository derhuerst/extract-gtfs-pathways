#!/usr/bin/env node
'use strict'

const {parseArgs} = require('util')
const pkg = require('./package.json')

const {
	values: flags,
	positionals: args,
} = parseArgs({
	options: {
		'help': {
			type: 'boolean',
			short: 'h',
		},
		'version': {
			type: 'boolean',
			short: 'v',
		},
		'quiet': {
			type: 'boolean',
			short: 'q',
		},
		'pathway-props': {
			type: 'string',
			short: 'f',
		},
		'node-props': {
			type: 'string',
			short: 'F',
		},
	},
	allowPositionals: true,
})

if (flags.help) {
	process.stdout.write(`
Usage:
    extract-gtfs-pathways <path-to-pathways-file> <path-to-stops-file> <output-directory>
Options:
    --quiet          -q  Don't log the written files.
    --pathway-props  -f  A JS function to determine additional pathway properties.
                           Example: pw => ({isWalking: pw.pathway_mode === '1'})
                           Note: The argument will be eval-ed!
    --node-props     -F  A JS function to determine additional node properties.
                           Example: n => ({isFoo: n.stop_id === 'foo'})
                           Note: The argument will be eval-ed!
Examples:
	mkdir extracted-pathways
    extract-gtfs-pathways data/gtfs/pathways.txt data/gtfs/stops.txt extracted-pathways
Notes:
    This tool will read a reduced form of stops.txt into memory.

    stops.txt needs to be sorted by
    1. parent_station: lexically ascending, empty first
    2. location_type: numerically descending, empty first
    You can use Miller (https://miller.readthedocs.io/) and the
    Unix tool sponge to do this:
    mlr --csv sort -f parent_station -nr location_type \\
      stops.txt | sponge stops.txt
\n`)
	process.exit(0)
}

if (flags.version) {
	process.stdout.write(`extract-gtfs-pathways v${pkg.version}\n`)
	process.exit(0)
}

const {join: pathJoin} = require('path')
const readCsv = require('gtfs-utils/read-csv')
const {writeFile: fsWriteFile} = require('fs/promises')
const extractGtfsPathways = require('.')

const showError = (err) => {
	console.error(err)
	process.exit(1)
}

const pathToPathwaysFile = args[0]
if (!pathToPathwaysFile) {
	showError('Missing path-to-pathways-file parameter.')
}

const pathToStopsFile = args[1]
if (!pathToStopsFile) {
	showError('Missing path-to-pathways-file parameter.')
}

const outputDir = args[2]
if (!outputDir) {
	showError('Missing output-directory parameter.')
}

const quiet = !!flags.quiet

const pathwayProps = flags['pathway-props']
	? eval(flags['pathway-props'])
	: () => ({})
const nodeProps = flags['node-props']
	? eval(flags['node-props'])
	: () => ({})

let file = 0
const writeFile = async (stationId, data) => {
	const filename = stationId + '.geo.json'
	if (!quiet) process.stderr.write(`${++file} ${filename}: ${data.length}b\n`)
	await fsWriteFile(pathJoin(outputDir, filename), data)
}

;(async () => {
	const pathwaysSrc = await readCsv(pathToPathwaysFile)
	const stopsSrc = await readCsv(pathToStopsFile)

	extractGtfsPathways(stopsSrc, pathwaysSrc, writeFile, {
		pathwayProps,
		nodeProps,
	})
})()
.catch(showError)
