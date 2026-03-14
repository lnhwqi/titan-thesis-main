import * as UserRow from "../../src/Database/UserRow"
import * as Hash from "../../src/Data/Hash"
import { createEmail } from "../../../Core/Data/User/Email"
import { createName } from "../../../Core/App/User/Name"
import { createPassword } from "../../../Core/App/User/Password"

type SeedUser = {
  email: string
  name: string
  password: string
}

const devUsers: SeedUser[] = [
  {
    email: "user@titan.local",
    name: "Titan User",
    password: "User@1234",
  },
]

const prodUsers: SeedUser[] = []

export async function seedDev(): Promise<void> {
  for (const u of devUsers) {
    await upsertUser(u)
  }
}

export async function seedProd(): Promise<void> {
  for (const u of prodUsers) {
    await upsertUser(u)
  }
}

async function upsertUser(seed: SeedUser): Promise<void> {
  const email = createEmail(seed.email)
  const name = createName(seed.name)
  const password = createPassword(seed.password)

  if (email == null || name == null || password == null) {
    throw new Error(`Invalid user seed data for ${seed.email}`)
  }

  const existed = await UserRow.getByEmail(email)
  if (existed != null) {
    console.info(`Skipped user seed: ${seed.email} already exists`)
    return
  }

  const hashedPassword = await Hash.issue(password.unwrap())
  if (hashedPassword == null) {
    throw new Error(`Cannot hash password for user ${seed.email}`)
  }

  await UserRow.create({
    email,
    name,
    hashedPassword,
  })

  console.info(`Seeded user: ${seed.email}`)
}
