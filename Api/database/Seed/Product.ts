import * as ProductRow from "../../src/Database/ProductRow"
import * as ProductImageRow from "../../src/Database/ProductImageRow"
import * as ProductCategoryRow from "../../src/Database/ProductCategoryRow"
import * as CategoryRow from "../../src/Database/CategoryRow"
import * as Logger from "../../src/Logger"
import { nameDecoder } from "../../../Core/App/Product/Name"
import { descriptionDecoder } from "../../../Core/App/Product/Description"
import { priceDecoder } from "../../../Core/App/Product/Price"
import { imageUrlDecoder } from "../../../Core/App/Product/ProductImageUrl"

type SeedDefinition = {
  name: string
  price: number
  description: string
  image: string
  categorySlug: string
}

const PRODUCTS_DATA: SeedDefinition[] = [
  // --- FASHION: T-SHIRT ---
  {
    name: "Basic White Tee",
    price: 150000,
    description: "100% Cotton basic white t-shirt",
    image: "../assets/images/tee1.png",
    categorySlug: "t-shirt",
  },
  {
    name: "Vintage Graphic Tee",
    price: 250000,
    description: "Retro style graphic t-shirt",
    image: "../assets/images/tee2.png",
    categorySlug: "t-shirt",
  },
  {
    name: "Black Slim Fit Tee",
    price: 180000,
    description: "Elegant black slim fit shirt",
    image: "../assets/images/tee3.png",
    categorySlug: "t-shirt",
  },
  {
    name: "Oversized Streetwear",
    price: 350000,
    description: "Modern oversized fit tee",
    image: "../assets/images/tee4.png",
    categorySlug: "t-shirt",
  },
  {
    name: "Striped Summer Shirt",
    price: 220000,
    description: "Lightweight striped t-shirt",
    image: "../assets/images/tee1.png",
    categorySlug: "t-shirt",
  },
  {
    name: "V-neck Casual",
    price: 170000,
    description: "Comfortable v-neck t-shirt",
    image: "../assets/images/tee3.png",
    categorySlug: "t-shirt",
  },
  {
    name: "Polo Classic",
    price: 450000,
    description: "High quality polo shirt",
    image: "../assets/images/tee2.png",
    categorySlug: "t-shirt",
  },

  // --- FASHION: PANTS ---
  {
    name: "Slim Fit Jeans",
    price: 550000,
    description: "Classic blue slim fit jeans",
    image: "../assets/images/pants1.png",
    categorySlug: "pants",
  },
  {
    name: "Cargo Joggers",
    price: 420000,
    description: "Utility cargo pants with joggers fit",
    image: "../assets/images/pants2.png",
    categorySlug: "pants",
  },
  {
    name: "Chino Trousers",
    price: 480000,
    description: "Khaki chinos for office wear",
    image: "../assets/images/pants2.png",
    categorySlug: "pants",
  },
  {
    name: "Denim Shorts",
    price: 300000,
    description: "Summer denim shorts",
    image: "/../assets/images/pants2.png",
    categorySlug: "pants",
  },
  {
    name: "Formal Slacks",
    price: 600000,
    description: "Black formal pants for suits",
    image: "../assets/images/pants1.png",
    categorySlug: "pants",
  },
  {
    name: "Corduroy Pants",
    price: 520000,
    description: "Warm corduroy material pants",
    image: "../assets/images/pants2.png",
    categorySlug: "pants",
  },
  {
    name: "Linen Beach Pants",
    price: 380000,
    description: "Breathable linen pants",
    image: "../assets/images/pants2.png",
    categorySlug: "pants",
  },

  // --- ELECTRONICS: MOUSE ---
  {
    name: "Logi Wireless Mouse",
    price: 850000,
    description: "Silent wireless optical mouse",
    image: "../assets/images/mouse1.jpg",
    categorySlug: "mouse",
  },
  {
    name: "Gaming RGB Mouse",
    price: 1200000,
    description: "High DPI gaming mouse with RGB",
    image: "../assets/images/mouse2.webp",
    categorySlug: "mouse",
  },
  {
    name: "Ergonomic Vertical",
    price: 1500000,
    description: "Prevent wrist pain with vertical design",
    image: "../assets/images/mouse2.webp",
    categorySlug: "mouse",
  },
  {
    name: "Travel Mini Mouse",
    price: 350000,
    description: "Compact mouse for travelers",
    image: "../assets/images/mouse1.jpg",
    categorySlug: "mouse",
  },
  {
    name: "Bluetooth Multi-device",
    price: 950000,
    description: "Switch between 3 devices easily",
    image: "../assets/images/mouse2.webp",
    categorySlug: "mouse",
  },
  {
    name: "Pro Laser Mouse",
    price: 2100000,
    description: "Precision laser for designers",
    image: "../assets/images/mouse1.jpg",
    categorySlug: "mouse",
  },
  {
    name: "Trackball Mouse",
    price: 1800000,
    description: "Stationary trackball for comfort",
    image: "../assets/images/mouse1.jpg",
    categorySlug: "mouse",
  },

  // --- ELECTRONICS: KEYBOARD ---
  {
    name: "Mechanical Blue Switch",
    price: 1450000,
    description: "Clicky mechanical gaming keyboard",
    image: "../assets/images/kb1.webp",
    categorySlug: "keyboard",
  },
  {
    name: "Wireless Slim KB",
    price: 900000,
    description: "Ultra slim aluminum keyboard",
    image: "../assets/images/kb2.jpg",
    categorySlug: "keyboard",
  },
  {
    name: "Tenkeyless RGB",
    price: 1100000,
    description: "Compact TKL mechanical keyboard",
    image: "../assets/images/kb1.webp",
    categorySlug: "keyboard",
  },
  {
    name: "Split Ergonomic",
    price: 3200000,
    description: "Ortholinear split ergonomic board",
    image: "../assets/images/kb2.jpg",
    categorySlug: "keyboard",
  },
  {
    name: "Backlit Office KB",
    price: 550000,
    description: "White backlit quiet keyboard",
    image: "../assets/images/kb1.webp",
    categorySlug: "keyboard",
  },
  {
    name: "Foldable Bluetooth",
    price: 750000,
    description: "Pocket sized foldable keyboard",
    image: "../assets/images/kb1.webp",
    categorySlug: "keyboard",
  },
  {
    name: "Custom Wood Keyboard",
    price: 4500000,
    description: "Luxury walnut wood mechanical KB",
    image: "../assets/images/kb2.jpg",
    categorySlug: "keyboard",
  },
  {
    name: "Mac Style Keyboard",
    price: 1250000,
    description: "Optimized layout for macOS users",
    image: "../assets/images/kb1.webp",
    categorySlug: "keyboard",
  },
  {
    name: "NumPad Wireless",
    price: 400000,
    description: "External numeric keypad",
    image: "../assets/images/kb1.webp",
    categorySlug: "keyboard",
  },
]

export async function seedDev(): Promise<void> {
  const currentCount = await ProductRow.count()
  if (currentCount.unwrap() > 0) {
    Logger.log("Products already seeded. Skipping...")
    return
  }

  const categories = await CategoryRow.getAll()
  const categoryMap = new Map(categories.map((c) => [c.slug.unwrap(), c.id]))

  Logger.log("Starting to seed 30 products...")

  for (const item of PRODUCTS_DATA) {
    try {
      const product = await ProductRow.create({
        name: nameDecoder.verify(item.name),
        price: priceDecoder.verify(item.price),
        description: descriptionDecoder.verify(item.description),
      })

      await ProductImageRow.create({
        productID: product.id,
        url: imageUrlDecoder.verify(item.image),
      })

      const catID = categoryMap.get(item.categorySlug)
      if (catID) {
        await ProductCategoryRow.create({
          productID: product.id,
          categoryID: catID,
        })
      }

      Logger.log(`Successfully seeded: ${item.name}`)
    } catch (e) {
      Logger.error(`Failed to seed ${item.name}: ${e}`)
    }
  }

  Logger.log("Finished seeding products, images, and categories link.")
}

export async function seedProd(): Promise<void> {
  return seedDev()
}
