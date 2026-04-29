import * as path from "path"
import { promises } from "fs"
import { FileMigrationProvider, Migrator, sql } from "kysely"
import db from "../src/Database"

const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs: promises,
    path,
    migrationFolder: path.join(__dirname, "./migrations"),
  }),
  allowUnorderedMigrations: false,
})

async function run(): Promise<void> {
  if (_shouldResetSchema()) {
    await _resetSchema()
  }

  const { results, error } = await migrator.migrateToLatest()

  if (error != null) {
    throw error
  }

  if (results == null) {
    throw new Error("No migration results")
  }

  if (results.length > 0) {
    results.forEach((r) => {
      switch (r.status) {
        case "Success":
          console.info(
            `Migration "${r.migrationName}" was executed successfully`,
          )
          break

        case "Error":
          console.error(
            `Migration "${r.migrationName}" was executed unsuccessfully`,
          )
          break

        case "NotExecuted":
          console.warn(`Migration "${r.migrationName}" was not executed`)
          break
      }
    })
  } else {
    console.info("Nothing to migrate")
  }
}

function _shouldResetSchema(): boolean {
  const value = (process.env.DB_MIGRATE_RESET_SCHEMA ?? "").trim()
  return value === "1" || value.toLowerCase() === "true"
}

async function _resetSchema(): Promise<void> {
  await sql`drop schema if exists public cascade`.execute(db)
  await sql`create schema public`.execute(db)
}

run()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(`Migration error: ${error}`)
    process.exit(1)
  })
