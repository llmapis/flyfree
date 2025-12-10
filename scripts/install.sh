#!/bin/sh

npm run build && chmod +x dist/index.js && npm install -g . --force