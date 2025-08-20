#!/usr/bin/env bash
# mesh-lite/import.sh
set -euo pipefail
TARBALL="$1"
mkdir -p /tmp/room && cd /tmp/room
zstd -d -c "$TARBALL" | tar -x
psql "$DATABASE_URL" < db.sql
# TODO: upload media/* to MinIO bucket
echo "Imported db.sql"
