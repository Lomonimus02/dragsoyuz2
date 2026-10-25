#!/bin/sh
set -e

echo "Applying database migrations..."
node node_modules/prisma/build/index.js migrate deploy

echo "Starting application..."
# V8 heap stays inside MemoryMax=1G so libvips (native memory, outside the heap)
# still has room while a product photo is decoded. systemd can override NODE_OPTIONS.
case "${NODE_OPTIONS:-}" in
  *max-old-space-size*) ;;
  *) NODE_OPTIONS="${NODE_OPTIONS:+$NODE_OPTIONS }--max-old-space-size=512"
     export NODE_OPTIONS ;;
esac
exec node server.js
