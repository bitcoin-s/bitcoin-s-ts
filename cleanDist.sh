#!/bin/bash

# Delete all leftover .d.ts files - this may be a Mac specific issue with `tsc --clean`
find . -name '*.d.ts' ! -path './node_modules/*' -delete
