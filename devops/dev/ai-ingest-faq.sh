#!/bin/bash
set -e

export NODE_ENV=development
source ./devops/dev/.env.development

npx tsx ./Api/src/AI/RunFaqIngestion.ts
echo "FAQ ingestion completed."
