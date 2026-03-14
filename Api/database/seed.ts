import ENV from "../src/Env"

import * as User from "./Seed/User"
import * as Admin from "./Seed/Admin"
// import * as Voucher from "./Seed/Voucher"

export async function run(): Promise<void | never> {
  const { APP_ENV } = ENV
  console.info(`Seeding for ${APP_ENV}:`)

  switch (APP_ENV) {
    case "production":
      await User.seedProd()
      await Admin.seedProd()
      // await Voucher.seedProd()
      return

    case "staging":
      await User.seedProd()
      await Admin.seedProd()
      // await Voucher.seedProd()
      return

    case "development":
      await User.seedDev()
      await Admin.seedDev()
      // await Voucher.seedDev()
      return

    case "test":
      await User.seedDev()
      await Admin.seedDev()
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
