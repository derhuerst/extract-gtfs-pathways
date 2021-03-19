#!/usr/bin/env node

const {join: pathJoin} = require('path')
const {execSync} = require('child_process')
const {readFileSync} = require('fs')
const {strictEqual: eql} = require('assert')

const stopsSrc = require.resolve('sample-gtfs-feed/gtfs/stops.txt')
const pwSrc = require.resolve('sample-gtfs-feed/gtfs/pathways.txt')
const cwd = __dirname

const expected = {
	// todo
}

execSync('rm -rf out', {cwd})
execSync('mkdir out', {cwd})

execSync(`./cli.js '${pwSrc}' '${stopsSrc}' out`, {cwd})

for (const [stationId, features] of Object.entries(expected)) {
	const file = `${stationId}.geo.json`
	const path = pathJoin(cwd, 'out', file)
	const pw = readFileSync(path, {encoding: 'utf8'})

	eql(pw, JSON.stringify({
		type: 'FeatureCollection',
		features: features,
	}), `${path} is invalid`)
}

console.log('files look correct ✔︎')
