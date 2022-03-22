#!/bin/bash

# Delete all /dist in child directories
#find . -maxdepth 2 -name 'dist' -type d -prune -print -exec rm -rf '{}' \;

# Delete all leftover .d.ts files - this may be a Mac specific issue with `tsc --clean`
find . -name '*.d.ts' ! -path './node_modules/*' -delete
