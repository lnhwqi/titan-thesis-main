import * as API from "../../../../../../Core/Api/Auth/User/OrderPayment/Create"
import { err, ok, Result } from "../../../../../../Core/Data/Result"
import { AuthUser } from "../../../AuthApi"
import * as SellerRow from "../../../../Database/SellerRow"
import * as OrderPaymentRow from "../../../../Database/OrderPaymentRow"
import * as VoucherRow from "../../../../Database/VoucherRow"
import { toOrderPayment } from "../../../../App/OrderPayment"
import { createPrice } from "../../../../../../Core/App/Product/Price"

export const contract = API.contract

export async function handler(
  user: AuthUser,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const { address, panels } = params

  if (panels.length === 0) {
    return ok({ orderPayments: [] })
  }

  const createdRows: OrderPaymentRow.OrderPaymentRow[] = []

  for (const panel of panels) {
    const seller = await SellerRow.getByID(panel.sellerID)
    if (seller == null) {
      return err("SELLER_NOT_FOUND")
    }

    let payableValue = panel.price.unwrap()

    if (panel.voucherID != null) {
      const validation = await VoucherRow.validateForApplying(
        user.id,
        panel.voucherID,
        payableValue,
      )

      switch (validation.type) {
        case "NOT_FOUND":
          return err("VOUCHER_NOT_FOUND")
        case "EXPIRED":
          return err("VOUCHER_EXPIRED")
        case "ALREADY_USED":
          return err("VOUCHER_ALREADY_USED")
        case "MIN_VALUE_NOT_MET":
          return err("VOUCHER_MIN_VALUE_NOT_MET")
        case "SUCCESS":
          if (
            validation.voucher.sellerId.unwrap() !== panel.sellerID.unwrap()
          ) {
            return err("VOUCHER_NOT_FOR_SELLER")
          }

          payableValue = Math.max(
            0,
            payableValue - validation.voucher.discount.unwrap(),
          )
          break
      }
    }

    const payablePrice = createPrice(payableValue)
    if (payablePrice == null) {
      return err("VOUCHER_MIN_VALUE_NOT_MET")
    }

    const row = await OrderPaymentRow.create({
      userId: user.id,
      sellerId: panel.sellerID,
      username: user.name,
      address,
      price: payablePrice,
    })

    if (panel.voucherID != null) {
      await VoucherRow.markAsUsed(user.id, panel.voucherID)
    }

    createdRows.push(row)
  }

  return ok({
    orderPayments: createdRows.map(toOrderPayment),
  })
}
