import { count, create } from "../../src/Database/AdminRow"
import * as Hash from "../../src/Data/Hash"
import * as Logger from "../../src/Logger"
import { emailDecoder } from "../../../Core/Data/User/Email"
import { nameDecoder } from "../../../Core/App/BaseProfile/Name"

type NewAdminData = {
  nameStr: string
  emailStr: string
}

export async function seedProd(): Promise<void> {
  return _seedAdmins([{ nameStr: " dmin", emailStr: "admin@titan.com" }])
}

export async function seedDev(): Promise<void> {
  return _seedAdmins([{ nameStr: "Admin", emailStr: "admin@titan.com" }])
}

async function _seedAdmins(newAdminData: NewAdminData[]): Promise<void> {
  const password = "Admin234#"
  const hashedPassword = await Hash.issue(password)

  if (hashedPassword == null) {
    throw new Error(`_seedAdmins: Failed to hash password`)
  }

  const currentCount = await count()

  if (currentCount.unwrap() > 0) {
    Logger.log(`Skipping seeding admins. Table is not empty.`)
  } else {
    for (const { nameStr, emailStr } of newAdminData) {
      await create({
        email: emailDecoder.verify(emailStr),
        name: nameDecoder.verify(nameStr),
        hashedPassword,
      })

      Logger.log(`Seeded admin: ${emailStr}`)
    }
    Logger.log(`Admin seed finished. Default password: ${password}`)
  }
}
