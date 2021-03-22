# extract-gtfs-pathways

Command line tool to **extract [pathways](https://gtfs.org/reference/static#pathwaystxt) from a [GTFS](https://gtfs.org) dataset.**

[![npm version](https://img.shields.io/npm/v/extract-gtfs-pathways.svg)](https://www.npmjs.com/package/extract-gtfs-pathways)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/extract-gtfs-pathways.svg)
![minimum Node.js version](https://img.shields.io/node/v/extract-gtfs-pathways.svg)
[![support me via GitHub Sponsors](https://img.shields.io/badge/support%20me-donate-fa7664.svg)](https://github.com/sponsors/derhuerst)
[![chat with me on Twitter](https://img.shields.io/badge/chat%20with%20me-on%20Twitter-1da1f2.svg)](https://twitter.com/derhuerst)


## Installation

```shell
npm install -g extract-gtfs-pathways
```


## Usage

```
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
    mlr --csv sort -f parent_station -nr location_type \
      stops.txt | sponge stops.txt
```

### pro tip: color nodes & pathways

If you're using `extract-gtfs-pathways` to render the GeoJSON on a map, you can use `--pathway-props`/`-f` and `--node-props`/`-F` to color the pathways and nodes in a helpful way ([example map](https://geojson.io/#id=gist:derhuerst/4421dab3e3ff907a9908d2abb2972815&map=19/52.54651/13.35904)).

Let's define two functions to compute properties that will be picked up by [geojson.io](https://geojson.io) (because it uses [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/api/) underneath):

```js
// pathwayProps
// - 1 (walkway) gray
// - 2 (stairs) red
// - 4 (escalator) dark orange
// - 5 (elevator) blue
pw => ({
	stroke: {1: "#95a5a6", 2: "#e74c3c", 4: "#d35400", 5: "#2980b9"}[pw.pathway_mode],
	"stroke-width": .5,
})

// nodeProps
// - 0/empty (stop/platform) turquoise
// - 2 (entrance/exit) violet
// - 4 (boarding area) yellow
n => ({
	"marker-color": {0: "#16a085", "": "#16a085", 2: "#8e44ad", 4: "#f1c40f"}[n.location_type],
	"marker-size": "small",
})
```

In Bash, we define one variable for each function:

```shell
pw_props='pw => ({stroke: {1: "#95a5a6", 2: "#e74c3c", 4: "#d35400", 5: "#2980b9"}[pw.pathway_mode], "stroke-width": .5})'
node_props='n => ({"marker-color": {0: "#16a085", "": "#16a085", 2: "#8e44ad", 4: "#f1c40f"}[n.location_type], "marker-size": "small"})'
```

Then, we can use them:

```shell
extract-gtfs-pathways --pathway-props $pw_props --node-props $node_props gtfs/pathways.txt gtfs/stops.txt out
```


## Contributing

If you have a question or need support using `extract-gtfs-pathways`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, use [the issues page](https://github.com/derhuerst/extract-gtfs-pathways/issues).
