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

	// todo: generate GeoJSON
}

module.exports = extractGtfsPathways
