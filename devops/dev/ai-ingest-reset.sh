#!/bin/bash
set -e

export NODE_ENV=development
source ./devops/dev/.env.development

echo "Clearing AI vector tables..."
npx tsx ./Api/src/AI/ResetVectorStore.ts
echo "Done. Run 'npm run ai:ingest' to re-ingest all data."
