import * as VoucherRow from "../../../Api/src/Database/VoucherRow"
import * as UserRow from "../../../Api/src/Database/UserRow"
import { nameDecoder } from "../../../Core/App/Voucher/Name"
import { createExpiryDate } from "../../../Core/App/Voucher/ExpiryDate"
import { createDiscountValue } from "../../../Core/App/Voucher/DiscountValue"
import { createMinProductValue } from "../../../Core/App/Voucher/MinProductValue"
import { emailDecoder } from "../../../Core/Data/User/Email"
import * as Logger from "../../src/Logger"
import { throwIfNull } from "../../../Core/Data/Maybe"

export async function seedProd(): Promise<void> {
  return seedVouchers()
}

export async function seedDev(): Promise<void> {
  return seedVouchers()
}

async function seedVouchers(): Promise<void> {
  const aliceEmail = emailDecoder.verify("alice@example.com")
  const alice = await UserRow.getByEmail(aliceEmail)

  if (alice == null) {
    Logger.error("SeedVouchers: Alice not found.")
    return
  }

  const currentVouchers = await VoucherRow.getByUserID(alice.id)
  if (currentVouchers.length > 0) {
    Logger.log("Skipping seeding vouchers: Alice already owns vouchers.")
    return
  }

  try {
    const v1 = await VoucherRow.create({
      name: nameDecoder.verify("Sale Off 15K"),
      expiryDate: throwIfNull(
        createExpiryDate("2026-12-31T23:59:59Z"),
        "Invalid ExpiryDate",
      ),
      discountValue: throwIfNull(
        createDiscountValue(10000),
        "Invalid DiscountValue",
      ),
      minProductValue: throwIfNull(
        createMinProductValue(50000),
        "Invalid MinProductValue",
      ),
    })

    const v2 = await VoucherRow.create({
      name: nameDecoder.verify("Sale Off 5K"),
      expiryDate: throwIfNull(
        createExpiryDate("2026-06-01T17:00:00Z"),
        "Invalid ExpiryDate",
      ),
      discountValue: throwIfNull(
        createDiscountValue(5000),
        "Invalid DiscountValue",
      ),
      minProductValue: throwIfNull(
        createMinProductValue(10000),
        "Invalid MinProductValue",
      ),
    })

    await VoucherRow.claimVoucher(alice.id, v1.id)
    await VoucherRow.claimVoucher(alice.id, v2.id)

    Logger.log(`Successfully seeded vouchers for Alice`)
  } catch (e) {
    Logger.error(`SeedVouchers error: ${e}`)
    throw e
  }
}
