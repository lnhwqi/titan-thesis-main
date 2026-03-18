import db from "../Database"
import * as Logger from "../Logger"
import { toDate, createNow } from "../../../Core/Data/Time/Timestamp"

import { ProductRow, productRowDecoder } from "../Database/ProductRow"
import {
  ProductImageRow,
  productImageRowDecoder,
} from "../Database/ProductImageRow"
import {
  ProductVariantRow,
  productVariantRowDecoder,
} from "../Database/ProductVariantRow"
import {
  ProductCategoryRow,
  productCategoryRowDecoder,
} from "../Database/ProductCategoryRow"

import { SellerID } from "../../../Core/App/Seller/SellerID"
import { createProductID, ProductID } from "../../../Core/App/Product/ProductID"
import { createProductVariantID } from "../../../Core/App/ProductVariant/ProductVariantID"
import { createImageID } from "../../../Core/App/Product/ProductImageID"
import { ImageUrl } from "../../../Core/App/Product/ProductImageUrl"

import * as API from "../../../Core/Api/Auth/Product/create"
import * as UpdateAPI from "../../../Core/Api/Auth/Product/update"

export type CreateFullResult = {
  productRow: ProductRow
  imageRows: ProductImageRow[]
  variantRows: ProductVariantRow[]
  categoryRow: ProductCategoryRow
}

export async function createFull(
  sellerId: SellerID,
  params: API.BodyParams,
  categoryID: string,
): Promise<CreateFullResult> {
  const now = toDate(createNow())
  const newProductID = createProductID()

  return db
    .transaction()
    .execute(async (trx) => {
      const productRow = await trx
        .insertInto("product")
        .values({
          id: newProductID.unwrap(),
          sellerId: sellerId.unwrap(),
          categoryId: categoryID,
          name: params.name.unwrap(),
          price: params.price.unwrap(),
          description: params.description.unwrap(),
          attributes: params.attributes,
          isDeleted: false,
          createdAt: now,
          updatedAt: now,
        })
        .returningAll()
        .executeTakeFirstOrThrow()
        .then(productRowDecoder.verify)

      const [categoryRow, imageRows, variantRows] = await Promise.all([
        trx
          .insertInto("productCategory")
          .values({
            productID: newProductID.unwrap(),
            categoryID: categoryID,
            isDeleted: false,
            createdAt: now,
            updatedAt: now,
          })
          .returningAll()
          .executeTakeFirstOrThrow()
          .then(productCategoryRowDecoder.verify),

        params.urls.length > 0
          ? trx
              .insertInto("productImage")
              .values(
                params.urls.map((url: ImageUrl) => ({
                  id: createImageID().unwrap(),
                  productID: newProductID.unwrap(),
                  url: url.unwrap(),
                  isDeleted: false,
                  createdAt: now,
                  updatedAt: now,
                })),
              )
              .returningAll()
              .execute()
              .then((rows) =>
                rows.map((row) => productImageRowDecoder.verify(row)),
              )
          : Promise.resolve([]),

        trx
          .insertInto("product_variant")
          .values(
            params.variants.map((v: API.CreateVariantBody) => ({
              id: createProductVariantID().unwrap(),
              productId: newProductID.unwrap(),
              name: v.name.unwrap(),
              sku: v.sku.unwrap(),
              price: v.price ? v.price.unwrap() : null,
              stock: v.stock.unwrap(),
              isDeleted: false,
              createdAt: now,
              updatedAt: now,
            })),
          )
          .returningAll()
          .execute()
          .then((rows) =>
            rows.map((row) =>
              productVariantRowDecoder.verify({
                ...row,
                productID: row.productId,
              }),
            ),
          ),
      ])

      return {
        productRow,
        imageRows,
        variantRows,
        categoryRow,
      }
    })
    .catch((e: unknown) => {
      Logger.error(`ProductTx.createFull error: ${e}`)
      throw e
    })
}

export async function deleteFull(productID: ProductID): Promise<void> {
  const idStr = productID.unwrap()
  const now = toDate(createNow())

  try {
    await db.transaction().execute(async (trx) => {
      await Promise.all([
        trx
          .updateTable("product")
          .set({ isDeleted: true, updatedAt: now })
          .where("id", "=", idStr)
          .execute(),

        trx
          .updateTable("product_variant")
          .set({ isDeleted: true })
          .where("productId", "=", idStr)
          .execute(),

        trx
          .updateTable("productImage")
          .set({ isDeleted: true })
          .where("productID", "=", idStr)
          .execute(),

        trx
          .updateTable("productCategory")
          .set({ isDeleted: true, updatedAt: now })
          .where("productID", "=", idStr)
          .execute(),
      ])
    })
  } catch (e) {
    Logger.error(`ProductTx.deleteFull error: ${e}`)
    throw e
  }
}

export async function updateFull(
  sellerId: SellerID,
  productID: ProductID,
  params: UpdateAPI.BodyParams,
): Promise<CreateFullResult> {
  const now = toDate(createNow())
  const idStr = productID.unwrap()

  return db
    .transaction()
    .execute(async (trx) => {
      const productRow = await trx
        .updateTable("product")
        .set({
          categoryId: params.categoryID.unwrap(),
          name: params.name.unwrap(),
          price: params.price.unwrap(),
          description: params.description.unwrap(),
          attributes: params.attributes,
          updatedAt: now,
        })
        .where("id", "=", idStr)
        .where("sellerId", "=", sellerId.unwrap())
        .returningAll()
        .executeTakeFirstOrThrow()
        .then(productRowDecoder.verify)

      await Promise.all([
        trx
          .updateTable("productImage")
          .set({ isDeleted: true })
          .where("productID", "=", idStr)
          .execute(),
        trx
          .updateTable("product_variant")
          .set({ isDeleted: true })
          .where("productId", "=", idStr)
          .execute(),
      ])

      const [categoryRow, imageRows, variantRows] = await Promise.all([
        trx
          .updateTable("productCategory")
          .set({
            categoryID: params.categoryID.unwrap(),
            updatedAt: now,
            isDeleted: false,
          })
          .where("productID", "=", idStr)
          .returningAll()
          .executeTakeFirstOrThrow()
          .then(productCategoryRowDecoder.verify),

        params.urls.length > 0
          ? trx
              .insertInto("productImage")
              .values(
                params.urls.map((url: ImageUrl) => ({
                  id: createImageID().unwrap(),
                  productID: idStr,
                  url: url.unwrap(),
                  isDeleted: false,
                  createdAt: now,
                  updatedAt: now,
                })),
              )
              .returningAll()
              .execute()
              .then((rows) =>
                rows.map((row) => productImageRowDecoder.verify(row)),
              )
          : Promise.resolve([]),

        params.variants.length > 0
          ? trx
              .insertInto("product_variant")
              .values(
                params.variants.map((v: UpdateAPI.UpdateVariantBody) => ({
                  id: v.id ? v.id.unwrap() : createProductVariantID().unwrap(),
                  productId: idStr,
                  name: v.name.unwrap(),
                  sku: v.sku.unwrap(),
                  price: v.price ? v.price.unwrap() : params.price.unwrap(),
                  stock: v.stock.unwrap(),
                  isDeleted: false,
                  createdAt: now,
                  updatedAt: now,
                })),
              )
              .onConflict((oc) =>
                oc.column("id").doUpdateSet({
                  name: (eb) => eb.ref("excluded.name"),
                  sku: (eb) => eb.ref("excluded.sku"),
                  price: (eb) => eb.ref("excluded.price"),
                  stock: (eb) => eb.ref("excluded.stock"),
                  isDeleted: false,
                  updatedAt: now,
                }),
              )
              .returningAll()
              .execute()
              .then((rows) =>
                rows.map((row) =>
                  productVariantRowDecoder.verify({
                    ...row,
                    productID: row.productId,
                  }),
                ),
              )
          : Promise.resolve([]),
      ])

      return {
        productRow,
        imageRows,
        variantRows,
        categoryRow,
      }
    })
    .catch((e: unknown) => {
      Logger.error(`ProductTx.updateFull error: ${e}`)
      throw e
    })
}
