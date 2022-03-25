'use strict'

const {
	STOP,
	STATION,
	ENTRANCE_EXIT,
	GENERIC_NODE,
	BOARDING_AREA,
} = require('gtfs-utils/lib/location-types')

const nodeColors = {
	// stops/stations/boarding areas orange/red, entrances/exits green, others gray
	[STOP]: '#d35400', // pumpkin
	[STATION]: '#c0392b', // pomegranate
	[ENTRANCE_EXIT]: '#16a085', // green sea
	[GENERIC_NODE]: '#7f8c8d', // asbestos
	[BOARDING_AREA]: '#f39c12', // orange
}

const nodeRadiuses = {
	[STOP]: 5,
	[STATION]: 7,
	[ENTRANCE_EXIT]: 5,
	[GENERIC_NODE]: 4,
	[BOARDING_AREA]: 5,
}

// todo: pull these from gtfs-utils
// possible pathway_mode values:
// https://gtfs.org/reference/static/#pathwaystxt
// - `1`: Walkway.
const WALKWAY = '1'
// - `2`: Stairs.
const STAIRS = '2'
// - `3`: Moving sidewalk/travelator.
const MOVING_SIDEWALK_TRAVELATOR = '3'
// - `4`: Escalator.
const ESCALATOR = '4'
// - `5`: Elevator.
const ELEVATOR = '5'
// - `6`: Fare gate (or payment gate): A pathway that crosses into an area of the station where proof of payment is required to cross. Fare gates may separate paid areas of the station from unpaid ones, or separate different payment areas within the same station from each other. This information can be used to avoid routing passengers through stations using shortcuts that would require passengers to make unnecessary payments, like directing a passenger to walk through a subway platform to reach a busway.
const FARE_GATE = '6'
// - `7`: Exit gate: A pathway exiting a paid area into an unpaid area where proof of payment is not required to cross.
const EXIT_GATE = '7'

const pwColors = {
	[WALKWAY]: '#2c3e50', // midnight blue
	[STAIRS]: '#34495e', // wet asphalt
	[MOVING_SIDEWALK_TRAVELATOR]: '#8e44ad', // wisteria
	[ESCALATOR]: '#9b59b6', // amethyst
	[ELEVATOR]: '#2980b9', // belize hole
	[FARE_GATE]: '#27ae60', // nephritis
	[EXIT_GATE]: '#2ecc71', // emerald
}

const pwWidths = {
	[WALKWAY]: .7,
	[STAIRS]: 1,
	[MOVING_SIDEWALK_TRAVELATOR]: 2,
	[ESCALATOR]: 2,
	[ELEVATOR]: 2,
	[FARE_GATE]: 2,
	[EXIT_GATE]: 2,
}

const extractGtfsPathways = async (stopsSrc, pathwaysSrc, writeFile, opt = {}) => {
	const {
		pathwayProps,
		nodeProps,
	} = opt

	const nodes = Object.create(null) // nodes, by stop_id
	const stations = Object.create(null) // "top-most" parent_station, by stop_id

	for await (const s of stopsSrc) {
		const props = {}
		if (s.location_type in nodeColors) {
			props['circle-color'] = nodeColors[s.location_type]
		}
		if (s.location_type in nodeRadiuses) {
			props['circle-radius'] = nodeRadiuses[s.location_type]
		}

		nodes[s.stop_id] = [
			parseFloat(s.stop_lon),
			parseFloat(s.stop_lat),
			s.stop_name || null,
			s.location_type,
			s.level_id,
			{
				...props,
				...nodeProps(s),
			},
		]

		// todo: DRY with gtfs-utils/lib/read-stop-stations
		// stops.txt is sorted so that we get stations first.
		stations[s.stop_id] = s.parent_station
			? stations[s.parent_station] || s.parent_station
			: s.stop_id
	}

	// todo: add a --sorted mode that doesn't have to group in-memory
	const pws = Object.create(null) // pathways, grouped by station ID

	for await (const pw of pathwaysSrc) {
		const props = {}
		if (pw.pathway_mode in pwColors) {
			props['line-color'] = pwColors[pw.pathway_mode]
		}
		if (pw.pathway_mode in pwWidths) {
			props['line-width'] = pwWidths[pw.pathway_mode]
		}

		const encodedPw = [
			pw.pathway_id || undefined,
			pw.from_stop_id,
			pw.to_stop_id,
			pw.pathway_mode ? parseInt(pw.pathway_mode) : undefined,
			pw.is_bidirectional === '1',
			pw.length ? parseFloat(pw.length) : undefined,
			pw.traversal_time ? parseInt(pw.traversal_time) : undefined,
			pw.stair_count ? parseInt(pw.stair_count) : undefined,
			pw.max_slope ? parseFloat(pw.max_slope) : undefined,
			pw.min_width ? parseFloat(pw.min_width) : undefined,
			pw.signposted_as || undefined,
			pw.reversed_signposted_as || undefined,
			{
				...props,
				...pathwayProps(pw),
			},
		]

		const fromStationId = stations[pw.from_stop_id]
		if (pws[fromStationId]) pws[fromStationId].push(encodedPw)
		else pws[fromStationId] = [encodedPw]

		const toStationId = stations[pw.to_stop_id]
		if (pws[toStationId]) pws[toStationId].push(encodedPw)
		else pws[toStationId] = [encodedPw]
	}

	for (const stationId in pws) {
		let data = '{"type": "FeatureCollection", "features": ['
		let first = true
		const addFeature = (feature) => {
			data += (first ? '' : ',') + JSON.stringify(feature) + '\n'
			first = false
		}

		const nodesAdded = new Set()
		const addNode = (nodeId) => {
			if (nodesAdded.has(nodeId)) return;
			nodesAdded.add(nodeId)

			const n = nodes[nodeId]
			addFeature({
				type: 'Feature',
				properties: {
					stop_id: nodeId,
					stop_name: n[2],
					location_type: n[3],
					level_id: n[4],
					...n[5], // additional props
				},
				geometry: {
					type: 'Point',
					coordinates: [n[0], n[1]],
				},
			})
		}

		for (const pw of pws[stationId]) {
			const from_stop_id = pw[1]
			addNode(from_stop_id)
			const to_stop_id = pw[2]
			addNode(to_stop_id)

			addFeature({
				type: 'Feature',
				properties: {
					pathway_id: pw[0],
					pathway_mode: pw[3],
					is_bidirectional: pw[4],
					length: pw[5],
					traversal_time: pw[6],
					stair_count: pw[7],
					max_slope: pw[8],
					min_width: pw[9],
					signposted_as: pw[10],
					reversed_signposted_as: pw[11],
					...pw[12], // additional props
				},
				geometry: {
					type: 'LineString',
					coordinates: [
						[nodes[from_stop_id][0], nodes[from_stop_id][1]],
						[nodes[to_stop_id][0], nodes[to_stop_id][1]],
					],
				},
			})
		}

		data += ']}'
		// todo: write concurrently
		await writeFile(stationId, data)
	}
}

module.exports = extractGtfsPathways
