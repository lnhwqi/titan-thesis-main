import ENV from "../src/Env"

// import * as Voucher from "./Seed/Voucher"

export async function run(): Promise<void | never> {
  const { APP_ENV } = ENV
  console.info(`Seeding for ${APP_ENV}:`)

  switch (APP_ENV) {
    case "production":
      // await Voucher.seedProd()
      return

    case "staging":
      // await Voucher.seedProd()
      return

    case "development":
      // await Voucher.seedDev()
      return

    case "test":
      return
  }
}

run()
  .then(() => {
    console.info(`Seeded database successfully`)
    process.exit(0)
  })
  .catch((error) => {
    console.error(`Seeding error: ${error}`)
    process.exit(1)
  })
