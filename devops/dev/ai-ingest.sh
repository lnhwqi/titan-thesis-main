#!/bin/bash
set -e

export NODE_ENV=development
source ./devops/dev/.env.development

npx tsx ./Api/src/AI/RunIngestion.ts
