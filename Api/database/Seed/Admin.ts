import * as AdminRow from "../../src/Database/AdminRow"
import * as Hash from "../../src/Data/Hash"
import { createEmail } from "../../../Core/Data/User/Email"
import { createName } from "../../../Core/App/Admin/Name"
import { createPassword } from "../../../Core/App/Admin/Password"

type SeedAdmin = {
  email: string
  name: string
  password: string
}

const devAdmins: SeedAdmin[] = [
  {
    email: "admin@example.com",
    name: "Titan Admin",
    password: "Qwe@1234",
  },
]

export async function seedDev(): Promise<void> {
  for (const a of devAdmins) {
    await upsertAdmin(a)
  }
}

export async function seedProd(): Promise<void> {
  await seedDev()
}

async function upsertAdmin(seed: SeedAdmin): Promise<void> {
  const email = createEmail(seed.email)
  const name = createName(seed.name)
  const password = createPassword(seed.password)

  if (email == null || name == null || password == null) {
    throw new Error(`Invalid admin seed data for ${seed.email}`)
  }

  const existed = await AdminRow.getByEmail(email)
  if (existed != null) {
    console.info(`Skipped admin seed: ${seed.email} already exists`)
    return
  }

  const hashedPassword = await Hash.issue(password.unwrap())
  if (hashedPassword == null) {
    throw new Error(`Cannot hash password for admin ${seed.email}`)
  }

  await AdminRow.create({
    email,
    name,
    hashedPassword,
  })

  console.info(`Seeded admin: ${seed.email}`)
}
