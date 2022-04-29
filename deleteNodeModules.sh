#!/bin/bash

# Delete all /dist in child directories
find . -maxdepth 2 -name 'node_modules' -type d -prune -print -exec rm -rf '{}' \;
