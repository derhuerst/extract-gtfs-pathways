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


## Contributing

If you have a question or need support using `extract-gtfs-pathways`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, use [the issues page](https://github.com/derhuerst/extract-gtfs-pathways/issues).
