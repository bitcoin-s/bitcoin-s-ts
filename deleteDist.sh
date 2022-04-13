#!/bin/bash

# Delete all /dist in child directories
find . -maxdepth 2 -name 'dist' -type d -prune -print -exec rm -rf '{}' \;
