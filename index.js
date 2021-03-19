'use strict'

const extractGtfsPathways = async (stopsSrc, pathwaysSrc, writeFile) => {
	const names = Object.create(null) // stop_name, by stop_id
	const coords = Object.create(null) // stop_lon,stop_lat, by stop_id
	const stations = Object.create(null) // "top-most" parent_station, by stop_id

	for await (const s of stopsSrc) {
		names[s.stop_id] = s.stop_name || null
		coords[s.stop_id] = [parseFloat(s.stop_lon), parseFloat(s.stop_lat)]
		// todo: DRY with gtfs-utils/lib/read-stop-stations
		// stops.txt is sorted so that we get stations first.
		stations[s.stop_id] = s.parent_station
			? stations[s.parent_station] || s.parent_station
			: s.stop_id
	}

	// todo: add a --sorted mode that doesn't have to group in-memory
	const pws = Object.create(null) // pathways, grouped by station ID

	for await (const pw of pathwaysSrc) {
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

			addFeature({
				type: 'Feature',
				properties: {
					stop_id: nodeId,
					stop_name: names[nodeId],
					// todo: marker-color based on color hash of the id
				},
				geometry: {
					type: 'Point',
					coordinates: coords[nodeId],
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
				},
				geometry: {
					type: 'LineString',
					coordinates: [
						coords[from_stop_id],
						coords[to_stop_id],
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
