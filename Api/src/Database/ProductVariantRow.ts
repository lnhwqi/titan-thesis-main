import * as JD from "decoders"
import db from "../Database"
import * as Logger from "../Logger"
import {
  ProductID,
  productIDDecoder,
} from "../../../Core/App/Product/ProductID"
import {
  Name,
  nameDecoder,
} from "../../../Core/App/ProductVariant/ProductVariantName"
import {
  Price,
  priceDecoder,
} from "../../../Core/App/ProductVariant/ProductVariantPrice"
import {
  ProductVariantID,
  productVariantIDDecoder,
} from "../../../Core/App/ProductVariant/ProductVariantID"
import { Stock, stockDecoder } from "../../../Core/App/ProductVariant/Stock"
import {
  SKU,
  skuDecoder,
} from "../../../Core/App/ProductVariant/ProductVarirantSKU"

const tableName = "product_variant"

export type ProductVariantRow = {
  id: ProductVariantID
  productID: ProductID
  name: Name
  sku: SKU
  price: Price
  stock: Stock
  isDeleted: boolean
}

export async function getByProductID(
  productID: ProductID,
): Promise<ProductVariantRow[]> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where("productId", "=", productID.unwrap())
    .where("isDeleted", "=", false)
    .execute()
    .then((rows) => JD.array(productVariantRowDecoder).verify(rows))
    .catch((e) => {
      Logger.error(`#${tableName}.getByProductID error ${e}`)
      throw e
    })
}

export async function getByProductIDs(
  productIDs: ProductID[],
): Promise<ProductVariantRow[]> {
  const idStrings = productIDs.map((id) => id.unwrap())

  if (idStrings.length === 0) {
    return []
  }

  return db
    .selectFrom(tableName)
    .selectAll()
    .where("productId", "in", idStrings)
    .where("isDeleted", "=", false)
    .execute()
    .then((rows) => JD.array(productVariantRowDecoder).verify(rows))
    .catch((e) => {
      Logger.error(`#${tableName}.getByProductIDs error ${e}`)
      throw e
    })
}

export async function decreaseStock(
  variantID: ProductVariantID,
  quantity: number,
): Promise<void> {
  return db
    .updateTable(tableName)
    .set((eb) => ({
      stock: eb("stock", "-", quantity),
    }))
    .where("id", "=", variantID.unwrap())
    .where("stock", ">=", quantity)
    .executeTakeFirstOrThrow()
    .then(() => {})
    .catch((e) => {
      Logger.error(`#${tableName}.decreaseStock error: INVALID ${e}`)
      throw e
    })
}

export const productVariantRowDecoder: JD.Decoder<ProductVariantRow> =
  JD.object({
    id: productVariantIDDecoder,
    productID: productIDDecoder,
    name: nameDecoder,
    sku: skuDecoder,
    price: priceDecoder,
    stock: stockDecoder,
    isDeleted: JD.boolean,
  })
