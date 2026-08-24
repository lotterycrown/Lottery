#!/bin/sh
export DATABASE_URL="${DATABASE_URL:-postgresql://user:pass@localhost:5432/db}"
prisma generate
tsc -p tsconfig.build.json
