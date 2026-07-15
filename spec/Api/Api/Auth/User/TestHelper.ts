import db from "../../../../../Api/src/Database"
import * as UserRow from "../../../../../Api/src/Database/UserRow"
import * as SellerRow from "../../../../../Api/src/Database/SellerRow"
import * as ProductRow from "../../../../../Api/src/Database/ProductRow"
import * as OrderPaymentRow from "../../../../../Api/src/Database/OrderPaymentRow"
import * as OrderPaymentItemRow from "../../../../../Api/src/Database/OrderPaymentItemRow"
import { _hashPassword } from "../../../../Fixture"
import { emailDecoder } from "../../../../../Core/Data/User/Email"
import { nameDecoder as sellerNameDecoder } from "../../../../../Core/App/Seller/Name"
import { shopNameDecoder } from "../../../../../Core/App/Seller/ShopName"
import {
  createProductVariantID,
  ProductVariantID,
} from "../../../../../Core/App/ProductVariant/ProductVariantID"
import { productVariantNameDecoder } from "../../../../../Core/App/ProductVariant/ProductVariantName"
import { skuDecoder } from "../../../../../Core/App/ProductVariant/ProductVarirantSKU"
import { createUUID } from "../../../../../Core/Data/UUID"
import { createNow, toDate } from "../../../../../Core/Data/Time/Timestamp"
import { createPrice, Price } from "../../../../../Core/App/Product/Price"
import { nameDecoder as productNameDecoder } from "../../../../../Core/App/Product/Name"
import { descriptionDecoder } from "../../../../../Core/App/Product/Description"
import { productAttributesDecoder } from "../../../../../Core/App/Product/Attributes"
import { SellerID } from "../../../../../Core/App/Seller/SellerID"
import { ProductID } from "../../../../../Core/App/Product/ProductID"
import { OrderPaymentStatus } from "../../../../../Core/App/OrderPayment/OrderPaymentStatus"
import {
  orderPaymentAddressDecoder,
  OrderPaymentAddress,
} from "../../../../../Core/App/Address"
import { UserID } from "../../../../../Core/App/User/UserID"

export function mustPrice(value: number): Price {
  const price = createPrice(value)
  if (price == null) {
    throw new Error(`Invalid price: ${value}`)
  }
  return price
}

export function createSampleAddress(): OrderPaymentAddress {
  return orderPaymentAddressDecoder.verify({
    provinceCode: "79",
    provinceName: "Ho Chi Minh",
    districtCode: "760",
    districtName: "District 1",
    wardCode: "26734",
    wardName: "Ben Nghe",
    detail: "123 Le Loi",
  })
}

export async function createSeller(): Promise<SellerRow.SellerRow> {
  const suffix = createUUID().unwrap().slice(0, 8)
  const hashedPassword = await _hashPassword("Valid4Good.Password")

  return SellerRow.create({
    email: emailDecoder.verify(`seller-${suffix}@example.com`),
    name: sellerNameDecoder.verify("Seller Test"),
    hashedPassword,
    shopName: shopNameDecoder.verify(`Shop ${suffix}`),
  })
}

export async function createProductWithVariant(params: {
  sellerID: SellerID
  basePrice?: number
  variantPrice?: number
  stock?: number
}): Promise<{
  product: ProductRow.ProductRow
  productID: ProductID
  variantID: ProductVariantID
}> {
  const suffix = createUUID().unwrap().slice(0, 8)
  const now = toDate(createNow())
  const basePrice = params.basePrice ?? 10000
  const variantPrice = params.variantPrice ?? basePrice
  const stock = params.stock ?? 10

  const product = await ProductRow.create({
    sellerId: params.sellerID,
    categoryId: createUUID().unwrap(),
    name: productNameDecoder.verify(`Product ${suffix}`),
    price: mustPrice(basePrice),
    description: descriptionDecoder.verify("Sample product description"),
    attributes: productAttributesDecoder.verify({}),
  })

  const variantID = createProductVariantID()

  await db
    .insertInto("product_variant")
    .values({
      id: variantID.unwrap(),
      productId: product.id.unwrap(),
      name: productVariantNameDecoder.verify("Default").unwrap(),
      sku: skuDecoder.verify(`SKU-${suffix}-${stock}`).unwrap(),
      price: mustPrice(variantPrice).unwrap(),
      stock,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    })
    .execute()

  return {
    product,
    productID: product.id,
    variantID,
  }
}

export async function insertCartItem(params: {
  userID: UserID
  productID: ProductID
  variantID: ProductVariantID
  quantity: number
}): Promise<void> {
  const now = toDate(createNow())

  await db
    .insertInto("user_cart_item")
    .values({
      userId: params.userID.unwrap(),
      productId: params.productID.unwrap(),
      variantId: params.variantID.unwrap(),
      quantity: params.quantity,
      createdAt: now,
      updatedAt: now,
    })
    .onConflict((oc) =>
      oc.columns(["userId", "productId", "variantId"]).doUpdateSet({
        quantity: params.quantity,
        updatedAt: now,
      }),
    )
    .execute()
}

export async function createOrder(params: {
  user: UserRow.UserRow
  sellerID: SellerID
  price?: number
  status?: OrderPaymentStatus
  isPaid?: boolean
}): Promise<OrderPaymentRow.OrderPaymentRow> {
  const created = await OrderPaymentRow.create({
    userId: params.user.id,
    sellerId: params.sellerID,
    username: params.user.name,
    address: createSampleAddress(),
    price: mustPrice(params.price ?? 10000),
  })

  if (params.status == null && params.isPaid == null) {
    return created
  }

  const now = toDate(createNow())

  await db
    .updateTable("order_payment")
    .set({
      status: params.status ?? created.status,
      isPaid: params.isPaid ?? created.isPaid,
      updatedAt: now,
    })
    .where("id", "=", created.id.unwrap())
    .executeTakeFirst()

  const refreshed = await OrderPaymentRow.getByID(created.id)
  if (refreshed == null) {
    throw new Error("ORDER_NOT_FOUND_AFTER_CREATE")
  }

  return refreshed
}

export async function addOrderItem(params: {
  orderID: OrderPaymentRow.OrderPaymentRow["id"]
  productID: ProductID
  variantID: ProductVariantID
  quantity?: number
}): Promise<void> {
  const product = await db
    .selectFrom("product")
    .select(["name"])
    .where("id", "=", params.productID.unwrap())
    .executeTakeFirstOrThrow()

  const variant = await db
    .selectFrom("product_variant")
    .select(["name"])
    .where("id", "=", params.variantID.unwrap())
    .executeTakeFirstOrThrow()

  await OrderPaymentItemRow.createMany([
    {
      orderPaymentId: params.orderID,
      productId: params.productID,
      variantId: params.variantID,
      productName: product.name,
      variantName: variant.name,
      quantity: params.quantity ?? 1,
    },
  ])
}

export async function createOrderWithItem(params: {
  user: UserRow.UserRow
  sellerID: SellerID
  productID: ProductID
  variantID: ProductVariantID
  quantity?: number
  price?: number
  status?: OrderPaymentStatus
  isPaid?: boolean
}): Promise<OrderPaymentRow.OrderPaymentRow> {
  const order = await createOrder({
    user: params.user,
    sellerID: params.sellerID,
    price: params.price,
    status: params.status,
    isPaid: params.isPaid,
  })

  await addOrderItem({
    orderID: order.id,
    productID: params.productID,
    variantID: params.variantID,
    quantity: params.quantity,
  })

  return order
}

export async function insertWalletDeposit(params: {
  userID: UserID
  appTransID: string
  amount: number
  status?: "PENDING" | "SUCCESS" | "FAILED"
  creditedAt?: Date | null
}): Promise<void> {
  const now = toDate(createNow())

  await db
    .insertInto("wallet_deposit")
    .values({
      id: createUUID().unwrap(),
      appTransID: params.appTransID,
      userId: params.userID.unwrap(),
      amount: params.amount,
      status: params.status ?? "PENDING",
      creditedAt: params.creditedAt ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .execute()
}
