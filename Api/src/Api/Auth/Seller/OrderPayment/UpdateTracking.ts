import * as API from "../../../../../../Core/Api/Auth/Seller/OrderPayment/UpdateTracking"
import { err, ok, Result } from "../../../../../../Core/Data/Result"
import { AuthSeller } from "../../../AuthApi"
import * as OrderPaymentRow from "../../../../Database/OrderPaymentRow"
import { toOrderPayment } from "../../../../App/OrderPayment"

export const contract = API.contract

export async function handler(
  seller: AuthSeller,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const { id, status, trackingCode } = params

  const row = await OrderPaymentRow.updateTracking(id, seller.id, {
    status,
    trackingCode,
  })

  if (row == null) {
    return err("ORDER_PAYMENT_NOT_FOUND")
  }

  return ok({
    orderPayment: toOrderPayment(row),
  })
}
