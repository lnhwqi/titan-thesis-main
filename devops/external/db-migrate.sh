#!/bin/bash
set -e

echo
echo "✈️  === [DEV] Migration ==="

echo
echo "🌡  Running migration for development database:"
export NODE_ENV=development
source ./devops/dev/.env.development
npx tsx ./Api/database/migrate.ts

echo
echo "✈️  === [TEST] Migration ==="

echo
echo "🧪 Running migration for test database:"
export NODE_ENV=test
source ./devops/test/.env.test
export TOTAL_TEST_DB=$(source ./devops/test/.env.test && echo $TOTAL_TEST_DB)

for i in $(seq $TOTAL_TEST_DB); do
  (
    export VITEST_WORKER_ID="${i}"
    export DB_MIGRATE_RESET_SCHEMA=true
    tsx ./Api/database/migrate.ts
  ) &
done
wait

echo
echo "🏁 Database migration completed."
