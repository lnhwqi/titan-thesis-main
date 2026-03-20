import * as API from "../../../../../../Core/Api/Auth/User/OrderPayment/ListMine"
import { ok, Result } from "../../../../../../Core/Data/Result"
import { AuthUser } from "../../../AuthApi"
import * as OrderPaymentRow from "../../../../Database/OrderPaymentRow"
import { toOrderPayment } from "../../../../App/OrderPayment"

export const contract = API.contract

export async function handler(
  user: AuthUser,
  _params: API.NoUrlParams & API.NoBodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const rows = await OrderPaymentRow.getByUserID(user.id)
  return ok({ orders: rows.map(toOrderPayment) })
}
