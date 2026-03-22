import * as API from "../../../../../../Core/Api/Auth/User/OrderPayment/ListMine"
import { ok, Result } from "../../../../../../Core/Data/Result"
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
  _params: API.NoUrlParams & API.NoBodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const rows = await OrderPaymentRow.getByUserID(user.id)
  const itemRows = await OrderPaymentItemRow.getByOrderPaymentIDs(
    rows.map((row) => row.id),
  )

  const itemsByOrderID = new Map<
    string,
    OrderPaymentItemRow.OrderPaymentItemRow[]
  >()
  itemRows.forEach((item) => {
    const key = item.orderPaymentId.unwrap()
    const existing = itemsByOrderID.get(key)
    if (existing == null) {
      itemsByOrderID.set(key, [item])
    } else {
      existing.push(item)
    }
  })

  return ok({
    orders: rows.map((row) =>
      toOrderPayment(
        row,
        (itemsByOrderID.get(row.id.unwrap()) ?? []).map(toOrderPaymentItem),
      ),
    ),
  })
}
