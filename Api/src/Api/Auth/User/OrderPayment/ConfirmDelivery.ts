import * as API from "../../../../../../Core/Api/Auth/User/OrderPayment/ConfirmDelivery"
import { err, ok, Result } from "../../../../../../Core/Data/Result"
import { AuthUser } from "../../../AuthApi"
import * as OrderPaymentRow from "../../../../Database/OrderPaymentRow"
import * as OrderPaymentItemRow from "../../../../Database/OrderPaymentItemRow"
import {
  toOrderPayment,
  toOrderPaymentItem,
} from "../../../../App/OrderPayment"

export const contract = API.contract

export async function handler(
  user: AuthUser,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const nextStatus =
    params.decision === "RECEIVED" ? "RECEIVED" : "DELIVERY_ISSUE"

  const row = await OrderPaymentRow.updateStatusByUser(
    params.id,
    user.id,
    nextStatus,
  )

  if (row == null) {
    return err("INVALID_STATUS_TRANSITION")
  }

  const itemRows = await OrderPaymentItemRow.getByOrderPaymentID(row.id)

  return ok({
    orderPayment: toOrderPayment(row, itemRows.map(toOrderPaymentItem), 0),
  })
}
