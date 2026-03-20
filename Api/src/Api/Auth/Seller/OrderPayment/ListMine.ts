import * as API from "../../../../../../Core/Api/Auth/Seller/OrderPayment/ListMine"
import { ok, Result } from "../../../../../../Core/Data/Result"
import { AuthSeller } from "../../../AuthApi"
import * as OrderPaymentRow from "../../../../Database/OrderPaymentRow"
import { toOrderPayment } from "../../../../App/OrderPayment"

export const contract = API.contract

export async function handler(
  seller: AuthSeller,
  _params: API.NoUrlParams & API.NoBodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const rows = await OrderPaymentRow.getBySellerID(seller.id)
  return ok({ orders: rows.map(toOrderPayment) })
}
