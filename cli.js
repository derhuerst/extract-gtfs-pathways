#!/usr/bin/env node
'use strict'

const mri = require('mri')
const pkg = require('./package.json')

const argv = mri(process.argv.slice(2), {
	boolean: [
		'help', 'h',
		'version', 'v',
		'quiet', 'q',
	]
})

if (argv.help || argv.h) {
	process.stdout.write(`
Usage:
    extract-gtfs-pathways <path-to-pathways-file> <path-to-stops-file> <output-directory>
Options:
    --quiet          -q  Don't log the written files.
    --pathway-props -f  A JS function to determine additional pathway properties.
                           Example: pw => ({isWalking: pw.pathway_mode === '1'})
                           Note: The argument will be eval-ed!
    --node-props    -F  A JS function to determine additional node properties.
                           Example: n => ({isFoo: n.stop_id === 'foo'})
                           Note: The argument will be eval-ed!
Examples:
    extract-gtfs-pathways data/gtfs/shapes.txt data/gtfs/stops.txt pathways
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

if (argv.version || argv.v) {
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

const pathToPathwaysFile = argv._[0]
if (!pathToPathwaysFile) {
	showError('Missing path-to-pathways-file parameter.')
}
const pathwaysSrc = readCsv(pathToPathwaysFile)

const pathToStopsFile = argv._[1]
if (!pathToStopsFile) {
	showError('Missing path-to-pathways-file parameter.')
}
const stopsSrc = readCsv(pathToStopsFile)

const outputDir = argv._[2]
if (!outputDir) {
	showError('Missing output-directory parameter.')
}

const quiet = !!(argv.quiet || argv.q)

const pathwayProps = argv['pathway-props'] || argv.f
	? eval(argv['pathway-props'] || argv.f)
	: () => ({})
const nodeProps = argv['node-props'] || argv.F
	? eval(argv['node-props'] || argv.F)
	: () => ({})

let file = 0
const writeFile = async (stationId, data) => {
	const filename = stationId + '.geo.json'
	if (!quiet) process.stderr.write(`${++file} ${filename}: ${data.length}b\n`)
	await fsWriteFile(pathJoin(outputDir, filename), data)
}

extractGtfsPathways(stopsSrc, pathwaysSrc, writeFile, {
	pathwayProps,
	nodeProps,
})
.catch(showError)
