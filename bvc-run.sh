#!/bin/bash
# Store the current directory before changing
export USER_PWD="$(pwd)"
cd /home/luffy/Projects/Blockchain-Version-Control
npx . "$@"
