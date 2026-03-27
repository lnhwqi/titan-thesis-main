import { Pool } from "pg"
import { Kysely, PostgresDialect } from "kysely"
import ENV from "./Env"

export type Schema = {
  user: UserTable
  seller: SellerTable
  admin: AdminTable
  user_refresh_token: UserRefreshTokenTable
  seller_refresh_token: SellerRefreshTokenTable
  admin_refresh_token: AdminRefreshTokenTable
  product: ProductTable
  productImage: ProductImageTable
  productCategory: ProductCategoryTable
  category: CategoryTable
  voucher: VoucherTable
  user_voucher: UserVoucherTable
  user_wishlist_product: UserWishlistProductTable
  user_cart_item: UserCartItemTable
  product_variant: ProductVariantTable
  order_payment: OrderPaymentTable
  order_payment_item: OrderPaymentItemTable
  wallet_deposit: WalletDepositTable
  poster: PosterTable
}

type UserTable = {
  id: string
  email: string
  name: string
  password: string
  wallet: number
  active: boolean
  points: number
  tier: string
  isDeleted: boolean
  updatedAt: Date
  createdAt: Date
}

type SellerTable = {
  id: string
  email: string
  name: string
  password: string
  wallet: number
  active: boolean
  shopName: string
  shopDescription: string
  verified: boolean
  vacationMode: boolean
  revenue: number
  withdrawn: number
  profit: number
  isDeleted: boolean
  updatedAt: Date
  createdAt: Date
}

type AdminTable = {
  id: string
  email: string
  name: string
  password: string
  wallet: number
  active: boolean
  isDeleted: boolean
  updatedAt: Date
  createdAt: Date
}

type ProductTable = {
  id: string
  sellerId: string
  categoryId: string
  name: string
  price: number
  description: string
  attributes: Record<string, unknown>
  isDeleted: boolean
  updatedAt: Date
  createdAt: Date
}

type CategoryTable = {
  id: string
  name: string
  slug: string
  parentId: string | null
  isDeleted: boolean
  updatedAt: Date
  createdAt: Date
}

export type VoucherTable = {
  id: string
  sellerId: string
  code: string
  name: string
  discount: number
  limit: number
  usedCount: number
  minOrderValue: number
  active: boolean
  expiredDate: Date | string | number
  isDeleted: boolean
  updatedAt: Date
  createdAt: Date
}

export type UserVoucherTable = {
  id: string
  userId: string
  voucherId: string
  isUsed: boolean
  usedAt: Date | null
  createdAt: Date
}

export type UserWishlistProductTable = {
  userId: string
  productId: string
  createdAt: Date
  updatedAt: Date
}

export type UserCartItemTable = {
  userId: string
  productId: string
  variantId: string
  quantity: number
  createdAt: Date
  updatedAt: Date
}

export type OrderPaymentTable = {
  id: string
  userId: string
  sellerId: string
  username: string
  address: string
  goodsSummary: string
  paymentMethod: "ZALOPAY" | "WALLET"
  isPaid: boolean
  status:
    | "PAID"
    | "PACKED"
    | "IN_TRANSIT"
    | "DELIVERED"
    | "RECEIVED"
    | "DELIVERY_ISSUE"
    | "CANCELLED"
  price: number
  trackingCode: string | null
  isDeleted: boolean
  updatedAt: Date
  createdAt: Date
}

export type OrderPaymentItemTable = {
  id: string
  orderPaymentId: string
  productId: string
  variantId: string
  productName: string
  variantName: string
  quantity: number
  createdAt: Date
  updatedAt: Date
}

export type WalletDepositTable = {
  id: string
  appTransID: string
  userId: string
  amount: number
  status: "PENDING" | "SUCCESS" | "FAILED"
  creditedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type PosterTable = {
  id: string
  name: string
  description: string
  imageUrl: string
  imageScalePercent: number
  imageOffsetXPercent: number
  imageOffsetYPercent: number
  startDate: Date
  endDate: Date | null
  isPermanent: boolean
  isDeleted: boolean
  updatedAt: Date
  createdAt: Date
}

type UserRefreshTokenTable = {
  id: string
  userId: string
  previousId: string
  previousCreatedAt: Date
  createdAt: Date
}

type SellerRefreshTokenTable = {
  id: string
  sellerId: string
  previousId: string
  previousCreatedAt: Date
  createdAt: Date
}

type AdminRefreshTokenTable = {
  id: string
  adminId: string
  previousId: string
  previousCreatedAt: Date
  createdAt: Date
}

type ProductImageTable = {
  id: string
  productID: string
  url: string
  isDeleted: boolean
  updatedAt: Date
  createdAt: Date
}

type ProductCategoryTable = {
  productID: string
  categoryID: string
  isDeleted: boolean
  updatedAt: Date
  createdAt: Date
}
export type ProductVariantTable = {
  id: string
  productId: string
  name: string
  sku: string
  price: number | null
  stock: number
  isDeleted: boolean
  updatedAt: Date
  createdAt: Date
}

// Hacking for multiple test databases for parallel testing in Vitest
const databaseName =
  Number(process.env.TOTAL_TEST_DB) > 0
    ? ENV.DB_DATABASE +
      ((Number(process.env.VITEST_WORKER_ID) %
        Number(process.env.TOTAL_TEST_DB)) +
        1)
    : ENV.DB_DATABASE

const pool = new Pool({
  host: ENV.DB_HOST,
  user: ENV.DB_USER,
  password: ENV.DB_PASSWORD,
  database: databaseName,
  port: ENV.DB_PORT,
  max: ENV.DB_MAX_POOL,
  ssl:
    ENV.NODE_ENV === "production"
      ? {
          // RDS issues a self-signed cert but we don't really want to verify
          // since it is all in a private subnet
          rejectUnauthorized: false,
        }
      : false,
})

const db = new Kysely<Schema>({
  dialect: new PostgresDialect({
    pool,
  }),
})

export default db

// HELPER FUNCTIONS

/**
 * For Postgres only, unique constraint violation is code 23505
 */
export function isUniqueConstraintViolation(e: Error): boolean {
  return "code" in e && e.code === "23505"
}
