import { count, create } from "../../src/Database/CategoryRow"
import * as Logger from "../../src/Logger"
import { nameDecoder } from "../../../Core/App/Category/Name"
import { slugDecoder } from "../../../Core/App/Category/Slug"

export async function seedProd(): Promise<void> {
  return _seedCategories()
}

export async function seedDev(): Promise<void> {
  return _seedCategories()
}

async function _seedCategories(): Promise<void> {
  const currentCount = await count()

  if (currentCount.unwrap() > 0) {
    Logger.log(`Skipping seeding categories. Data already exists.`)
    return
  }

  try {
    const fashionRow = await create({
      name: nameDecoder.verify("Fashion"),
      slug: slugDecoder.verify("fashion"),
      parentId: null,
    })
    Logger.log(`Seeded Root Category: Fashion`)

    await create({
      name: nameDecoder.verify("T-shirt"),
      slug: slugDecoder.verify("t-shirt"),
      parentId: fashionRow.id,
    })
    await create({
      name: nameDecoder.verify("Pants"),
      slug: slugDecoder.verify("pants"),
      parentId: fashionRow.id,
    })
    Logger.log(`Seeded children for Fashion: T-shirt, Pants`)

    const electronicsRow = await create({
      name: nameDecoder.verify("Electronics"),
      slug: slugDecoder.verify("electronics"),
      parentId: null,
    })
    Logger.log(`Seeded Root Category: Electronics`)

    await create({
      name: nameDecoder.verify("Mouse"),
      slug: slugDecoder.verify("mouse"),
      parentId: electronicsRow.id,
    })
    await create({
      name: nameDecoder.verify("Keyboard"),
      slug: slugDecoder.verify("keyboard"),
      parentId: electronicsRow.id,
    })
    Logger.log(`Seeded children for Electronics: Mouse, Keyboard`)

    Logger.log(`Successfully finished seeding all categories.`)
  } catch (error) {
    Logger.log(`Error seeding categories: ${error}`)
    throw error
  }
}
