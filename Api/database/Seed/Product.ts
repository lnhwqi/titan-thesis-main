import { count, create as createProduct } from "../../src/Database/ProductRow"
import { create as createProductImage } from "../../src/Database/ProductImageRow"
import * as Logger from "../../src/Logger"
import { nameDecoder } from "../../../Core/App/Product/Name"
import { descriptionDecoder } from "../../../Core/App/Product/Description"
import { priceDecoder } from "../../../Core/App/Product/Price"
import { imageUrlDecoder } from "../../../Core/App/Product/ProductImageUrl"
import { productIDDecoder } from "../../../Core/App/Product/ProductID"

type NewProductData = {
  nameStr: string
  priceNum: number
  descriptionStr: string
  imageUrls: string[]
}

const PRODUCTS_TO_SEED: NewProductData[] = [
  {
    nameStr: "4K USB-C Monitor",
    priceNum: 4999000,
    descriptionStr:
      "27-inch 4K UHD monitor with USB-C power delivery and display port.",
    imageUrls: ["../Web/public/assets/images/product2.jpg"],
  },
  {
    nameStr: "Ergonomic Office Chair",
    priceNum: 2500000,
    descriptionStr:
      "Fully adjustable ergonomic chair designed for all-day comfort and back support.",
    imageUrls: ["../Web/public/assets/images/product3.jpg"],
  },
  {
    nameStr: "Noise-Cancelling Headphones",
    priceNum: 750000,
    descriptionStr:
      "Over-ear headphones with industry-leading noise cancellation and 30-hour battery life.",
    imageUrls: ["../Web/public/assets/images/product4.jpg"],
  },
  {
    nameStr: "Smart Home Hub",
    priceNum: 450000,
    descriptionStr:
      "Central device for controlling all smart devices in your home.",
    imageUrls: ["../Web/public/assets/images/product5.jpg"],
  },
  {
    nameStr: "Portable SSD 1TB",
    priceNum: 1590000,
    descriptionStr:
      "Ultra-fast external solid-state drive for quick data transfer and backup.",
    imageUrls: ["../Web/public/assets/images/product1.jpg"],
  },
  {
    nameStr: "Le Ngoc Huy Cheeze",
    priceNum: 2718,
    descriptionStr: "lengocjhuy.",
    imageUrls: ["../Web/public/assets/images/product1.jpg"],
  },
  {
    nameStr: "test1",
    priceNum: 2718,
    descriptionStr: "test1.",
    imageUrls: ["../Web/public/assets/images/product1.jpg"],
  },
]

export async function seedProd(): Promise<void> {
  return _seedProducts(PRODUCTS_TO_SEED)
}

export async function seedDev(): Promise<void> {
  return _seedProducts(PRODUCTS_TO_SEED)
}

/**
 * Seeds products into the database if the product table is currently empty.
 * @param newProductData An array of product data objects to insert.
 */
async function _seedProducts(newProductData: NewProductData[]): Promise<void> {
  const currentProductCount = await count()
  if (currentProductCount.unwrap() > 0) {
    Logger.log(
      `Skipping seeding products. ${currentProductCount.unwrap()} products already exist.`,
    )
  } else {
    for (const {
      nameStr,
      priceNum,
      descriptionStr,
      imageUrls,
    } of newProductData) {
      try {
        const newProduct = await createProduct({
          name: nameDecoder.verify(nameStr),
          price: priceDecoder.verify(priceNum),
          description: descriptionDecoder.verify(descriptionStr),
        })
        const newProductID = newProduct.id.unwrap()

        const imageRowsToInsert = imageUrls.map((urlStr) => {
          return {
            productID: productIDDecoder.verify(newProductID),
            url: imageUrlDecoder.verify(urlStr),
          }
        })

        await Promise.all(
          imageRowsToInsert.map((row) => createProductImage(row)),
        )
        Logger.log(`Seeded product: "${nameStr}"`)
      } catch (e) {
        Logger.error(`Failed to seed product "${nameStr}": ${e}`)
      }
    }
    Logger.log(`Successfully seeded ${newProductData.length} products.`)
  }
}
