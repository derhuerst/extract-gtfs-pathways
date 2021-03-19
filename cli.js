#!/usr/bin/env node
'use strict'

const mri = require('mri')
const pkg = require('./package.json')

const argv = mri(process.argv.slice(2), {
	boolean: [
		'help', 'h',
		'version', 'v',
	]
})

if (argv.help || argv.h) {
	process.stdout.write(`
Usage:
    extract-gtfs-pathways <path-to-pathways-file> <path-to-stops-file> <output-directory>
Options:
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

const showError = (err) => {
	console.error(err)
	process.exit(1)
}

// todo
