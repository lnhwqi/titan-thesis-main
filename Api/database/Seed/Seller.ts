import * as SellerRow from "../../src/Database/SellerRow"
import * as CategoryRow from "../../src/Database/CategoryRow"
import * as ProductTx from "../../src/Transaction/ProductTx"
import * as Hash from "../../src/Data/Hash"
import { createEmail } from "../../../Core/Data/User/Email"
import { createName as createSellerName } from "../../../Core/App/Seller/Name"
import { createShopName } from "../../../Core/App/Seller/ShopName"
import { createPassword } from "../../../Core/App/Seller/Password"
import { createName as createProductName } from "../../../Core/App/Product/Name"
import { createDescription } from "../../../Core/App/Product/Description"
import { createPrice } from "../../../Core/App/Product/Price"
import { createProductAttributes } from "../../../Core/App/Product/Attributes"
import { createImageUrl } from "../../../Core/App/Product/ProductImageUrl"
import { createSKU } from "../../../Core/App/ProductVariant/ProductVarirantSKU"
import { createStock } from "../../../Core/App/ProductVariant/Stock"
import { createName as createCategoryName } from "../../../Core/App/Category/Name"
import { slugify } from "../../../Core/App/Category/Slug"
import { SellerID } from "../../../Core/App/Seller/SellerID"
import { CategoryID } from "../../../Core/App/Category/CategoryID"

type SeedSeller = {
  email: string
  name: string
  shopName: string
  password: string
}

type SeedProduct = {
  name: string
  price: number
  description: string
  category: string
  variants: { name: string; sku: string; price: number; stock: number }[]
}

const categories = [
  "Electronics",
  "Clothing",
  "Home & Garden",
  "Sports",
  "Books",
]

const devSellers: SeedSeller[] = [
  {
    email: "seller1@example.com",
    name: "Nguyen Van A",
    shopName: "Tech Galaxy",
    password: "Qwe@1234",
  },
  {
    email: "seller2@example.com",
    name: "Tran Thi B",
    shopName: "Fashion Hub",
    password: "Qwe@1234",
  },
  {
    email: "seller3@example.com",
    name: "Le Van C",
    shopName: "Home Essentials",
    password: "Qwe@1234",
  },
  {
    email: "seller4@example.com",
    name: "Pham Thi D",
    shopName: "Sport Zone",
    password: "Qwe@1234",
  },
  {
    email: "seller5@example.com",
    name: "Hoang Van E",
    shopName: "Book Corner",
    password: "Qwe@1234",
  },
]

function pickProductImage(seed: SeedProduct): string {
  const rawSeed = `${seed.category}-${seed.name}-${seed.price}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

  const safeSeed = rawSeed.length > 0 ? rawSeed : "titan-product"
  return `https://picsum.photos/seed/${encodeURIComponent(safeSeed)}/900/900`
}

function productsBySeller(sellerIndex: number): SeedProduct[] {
  const catalog: SeedProduct[][] = [
    // Seller 1 — Tech Galaxy (Electronics)
    Array.from({ length: 20 }, (_, i) => ({
      name: `Wireless Earbuds Pro ${i + 1}`,
      price: 150000 + i * 25000,
      description: `High quality wireless earbuds model ${i + 1} with noise cancellation and long battery life.`,
      category: "Electronics",
      variants: [
        {
          name: "Black",
          sku: `S1-P${i + 1}-BLK`,
          price: 150000 + i * 25000,
          stock: 50,
        },
        {
          name: "White",
          sku: `S1-P${i + 1}-WHT`,
          price: 155000 + i * 25000,
          stock: 30,
        },
      ],
    })),
    // Seller 2 — Fashion Hub (Clothing)
    Array.from({ length: 20 }, (_, i) => ({
      name: `Premium Cotton T-Shirt ${i + 1}`,
      price: 120000 + i * 15000,
      description: `Comfortable premium cotton t-shirt design ${i + 1}, available in multiple sizes.`,
      category: "Clothing",
      variants: [
        {
          name: "S",
          sku: `S2-P${i + 1}-S`,
          price: 120000 + i * 15000,
          stock: 40,
        },
        {
          name: "M",
          sku: `S2-P${i + 1}-M`,
          price: 120000 + i * 15000,
          stock: 60,
        },
        {
          name: "L",
          sku: `S2-P${i + 1}-L`,
          price: 125000 + i * 15000,
          stock: 35,
        },
      ],
    })),
    // Seller 3 — Home Essentials (Home & Garden)
    Array.from({ length: 20 }, (_, i) => ({
      name: `Ceramic Plant Pot ${i + 1}`,
      price: 80000 + i * 10000,
      description: `Handcrafted ceramic plant pot design ${i + 1}, perfect for indoor decoration.`,
      category: "Home & Garden",
      variants: [
        {
          name: "Small",
          sku: `S3-P${i + 1}-SM`,
          price: 80000 + i * 10000,
          stock: 25,
        },
        {
          name: "Large",
          sku: `S3-P${i + 1}-LG`,
          price: 120000 + i * 10000,
          stock: 15,
        },
      ],
    })),
    // Seller 4 — Sport Zone (Sports)
    Array.from({ length: 20 }, (_, i) => ({
      name: `Running Shoes Model ${i + 1}`,
      price: 350000 + i * 30000,
      description: `Lightweight running shoes model ${i + 1} with breathable mesh and cushioned sole.`,
      category: "Sports",
      variants: [
        {
          name: "Size 39",
          sku: `S4-P${i + 1}-39`,
          price: 350000 + i * 30000,
          stock: 20,
        },
        {
          name: "Size 41",
          sku: `S4-P${i + 1}-41`,
          price: 350000 + i * 30000,
          stock: 25,
        },
        {
          name: "Size 43",
          sku: `S4-P${i + 1}-43`,
          price: 355000 + i * 30000,
          stock: 15,
        },
      ],
    })),
    // Seller 5 — Book Corner (Books)
    Array.from({ length: 20 }, (_, i) => ({
      name: `Programming Guide Vol ${i + 1}`,
      price: 95000 + i * 8000,
      description: `Comprehensive programming guide volume ${i + 1} covering modern development practices.`,
      category: "Books",
      variants: [
        {
          name: "Paperback",
          sku: `S5-P${i + 1}-PB`,
          price: 95000 + i * 8000,
          stock: 100,
        },
        {
          name: "Hardcover",
          sku: `S5-P${i + 1}-HC`,
          price: 145000 + i * 8000,
          stock: 40,
        },
      ],
    })),
  ]

  return catalog[sellerIndex] ?? []
}

export async function seedDev(): Promise<void> {
  const categoryMap = await ensureCategories()

  for (let i = 0; i < devSellers.length; i++) {
    const seller = devSellers[i]
    const sellerRow = await upsertSeller(seller)
    if (sellerRow == null) continue

    const products = productsBySeller(i)
    for (const product of products) {
      await createProduct(sellerRow.id, product, categoryMap)
    }
  }
}

export async function seedProd(): Promise<void> {
  await seedDev()
}

async function ensureCategories(): Promise<Map<string, CategoryID>> {
  const map = new Map<string, CategoryID>()
  const existing = await CategoryRow.getAll()

  for (const row of existing) {
    map.set(row.name.unwrap(), row.id)
  }

  for (const catName of categories) {
    if (map.has(catName)) continue

    const name = createCategoryName(catName)
    const slug = slugify(catName)
    if (name == null || slug == null) {
      throw new Error(`Invalid category: ${catName}`)
    }

    const row = await CategoryRow.create({ name, slug, parentId: null })
    map.set(catName, row.id)
    console.info(`  Seeded category: ${catName}`)
  }

  return map
}

async function upsertSeller(
  seed: SeedSeller,
): Promise<SellerRow.SellerRow | null> {
  const email = createEmail(seed.email)
  const name = createSellerName(seed.name)
  const password = createPassword(seed.password)
  const shopName = createShopName(seed.shopName)

  if (email == null || name == null || password == null || shopName == null) {
    throw new Error(`Invalid seller seed data for ${seed.email}`)
  }

  const existed = await SellerRow.getByEmail(email)
  if (existed != null) {
    console.info(`  Skipped seller seed: ${seed.email} already exists`)
    return existed
  }

  const hashedPassword = await Hash.issue(password.unwrap())
  if (hashedPassword == null) {
    throw new Error(`Cannot hash password for seller ${seed.email}`)
  }

  const row = await SellerRow.create({
    email,
    name,
    hashedPassword,
    shopName,
  })

  console.info(`  Seeded seller: ${seed.email} (${seed.shopName})`)
  return row
}

async function createProduct(
  sellerId: SellerID,
  seed: SeedProduct,
  categoryMap: Map<string, CategoryID>,
): Promise<void> {
  const name = createProductName(seed.name)
  const price = createPrice(seed.price)
  const description = createDescription(seed.description)
  const attributes = createProductAttributes({})
  const imageUrl = createImageUrl(pickProductImage(seed))

  if (
    name == null ||
    price == null ||
    description == null ||
    attributes == null ||
    imageUrl == null
  ) {
    throw new Error(`Invalid product seed data for ${seed.name}`)
  }

  const categoryID = categoryMap.get(seed.category)
  if (categoryID == null) {
    throw new Error(`Category not found: ${seed.category}`)
  }

  const variants = seed.variants.map((v) => {
    const vName = createProductName(v.name)
    const vSku = createSKU(v.sku)
    const vPrice = createPrice(v.price)
    const vStock = createStock(v.stock)

    if (vName == null || vSku == null || vPrice == null || vStock == null) {
      throw new Error(`Invalid variant seed: ${v.sku}`)
    }

    return { name: vName, sku: vSku, price: vPrice, stock: vStock }
  })

  await ProductTx.createFull(
    sellerId,
    {
      name,
      price,
      description,
      attributes,
      urls: [imageUrl],
      categoryID,
      variants,
    },
    categoryID.unwrap(),
  )

  console.info(`    Seeded product: ${seed.name}`)
}
