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
    unzip -j gtfs.zip -d data/gtfs
    mkdir extracted-pathways
    extract-gtfs-pathways data/gtfs/pathways.txt data/gtfs/stops.txt extracted-pathways
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

### with Docker

You can use the [`derhuerst/extract-gtfs-pathways` Docker image](https://hub.docker.com/r/derhuerst/extract-gtfs-pathways).

Remember to mount (using `-v`) the directory you're passing as `<output-directory>` (see above), otherwise the file will be created within the Docker container's virtual file system (and removed after the extraction has finished).

```shell
unzip -j gtfs.zip -d gtfs # directory with GTFS input
mkdir extracted-pathways # output directory
docker run -it --rm \
    -v $PWD/gtfs:/gtfs \
    -v $PWD/extracted-pathways:/extracted-pathways
    derhuerst/extract-gtfs-pathways /gtfs/pathways.txt /gtfs/stops.txt /extracted-pathways
```

### pro tip: customize color nodes & pathways

By default, `extract-gtfs-pathways` adds some style properties to the generated features, following the [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/api/) naming scheme, e.g. `line-color`, `line-width` & `circle-radius`. If you open them with a tool that supports these style properties – e.g. [view-geojson](https://npmjs.com/package/view-geojson), it will be easier to tell the nodes & pathways apart.

You can use `--pathway-props`/`-f` and `--node-props`/`-F` to customize the pathways' and nodes' properties, respectively. As an example, let's define two functions that override some default properties:

```js
const WALKWAY = '1'
const ESCALATOR = '4'
const pwOpacities = {[WALKWAY]: .3, [ESCALATOR]: 1}
const pathwayProps = (pw) => ({
	'line-opacity': pwOpacities[pw.pathway_mode] || .5,
	'line-width': 2,
})

const STOP = '0' // or empty
const ENTRANCE_EXIT = '2'
const BOARDING_AREA = '4'
const nodeColors = {
    [STOP]: '#ff0000', '': '#ff0000',
    [ENTRANCE_EXIT]: '#00ff00',
    [BOARDING_AREA]: '#0000ff',
}
const nodeProps = (n) => ({
	'circle-color': nodeColors[n.location_type] || '#444444',
})
```

We minify the functions and declare them as Bash variables:

```bash
pw_props='pw => ({"line-opacity": {"1": .3, "4": 1}[pw.pathway_mode] || .5, "line-width": 2})'
node_props='n => ({"circle-color": {"0": "#ff0000", "": "#ff0000", "2": "#00ff00", "4": "#0000ff"}[n.location_type] || "#444444"})'
```

Then, we can use them:

```bash
extract-gtfs-pathways --pathway-props "$pw_props" --node-props "$node_props" gtfs/pathways.txt gtfs/stops.txt out
```


## Related

- [view-geojson](https://github.com/finnp/view-geojson) – View an GeoJSON in the browser that has been piped into it.
- [extract-gtfs-shapes](https://github.com/derhuerst/extract-gtfs-shapes) – Command-line tool to extract shapes from a GTFS dataset.
- [Awesome GTFS: Frameworks and Libraries](https://github.com/andredarcie/awesome-gtfs#frameworks-and-libraries) – A collection of libraries for working with GTFS.


## Contributing

If you have a question or need support using `extract-gtfs-pathways`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, use [the issues page](https://github.com/derhuerst/extract-gtfs-pathways/issues).
