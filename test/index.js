#!/usr/bin/env node
'use strict'

const {join: pathJoin} = require('path')
const {execSync} = require('child_process')
const {readFileSync} = require('fs')
const {strictEqual: eql} = require('assert')

const stopsSrc = require.resolve('sample-gtfs-feed/gtfs/stops.txt')
const pwSrc = require.resolve('sample-gtfs-feed/gtfs/pathways.txt')
const cwd = __dirname

const expected = {
	'airport': readFileSync(pathJoin(__dirname, 'airport.json'), {encoding: 'utf8'}),
	'museum': readFileSync(pathJoin(__dirname, 'museum.json'), {encoding: 'utf8'}),
}

execSync('rm -rf out', {cwd})
execSync('mkdir out', {cwd})

const pwProps = pw => ({foo: pw.pathway_mode})
const nodeProps = n => ({bar: n.stop_id})

execSync(`../cli.js -f '${pwProps}' -F '${nodeProps}' '${pwSrc}' '${stopsSrc}' out`, {cwd})

for (const [stationId, expectedContent] of Object.entries(expected)) {
	const file = `${stationId}.geo.json`
	const path = pathJoin(cwd, 'out', file)
	const actualContent = readFileSync(path, {encoding: 'utf8'})
	eql(actualContent, expectedContent, `${path} is invalid`)
}

console.log('files look correct ✔︎')
