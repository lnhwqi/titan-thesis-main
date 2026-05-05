import * as API from "../../../../../../Core/Api/Auth/User/OrderPayment/ListMine"
import { ok, Result } from "../../../../../../Core/Data/Result"
import { AuthUser } from "../../../AuthApi"
import * as OrderPaymentRow from "../../../../Database/OrderPaymentRow"
import * as OrderPaymentItemRow from "../../../../Database/OrderPaymentItemRow"
import * as SellerRow from "../../../../Database/SellerRow"
import {
  toOrderPayment,
  toOrderPaymentItem,
} from "../../../../App/OrderPayment"

export const contract = API.contract

export async function handler(
  user: AuthUser,
  params: API.UrlParams & API.NoBodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  await OrderPaymentRow.autoSettleDueOrders()

  const page = Math.max(1, Math.floor(params.page))
  const limit = Math.max(1, Math.min(100, Math.floor(params.limit)))
  const offset = (page - 1) * limit

  const [{ rows, totalCount }, { totalMoneyPaid, totalProducts }] =
    await Promise.all([
      OrderPaymentRow.getByUserIDPaginated(user.id, limit, offset),
      OrderPaymentRow.getUserTotals(user.id),
    ])

  const uniqueSellerIDs = [...new Set(rows.map((row) => row.sellerId))]
  const sellerRows = await SellerRow.getByIDs(uniqueSellerIDs)
  const taxBySellerID = new Map(
    sellerRows.map((s) => [s.id.unwrap(), s.tax.unwrap()]),
  )

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
        taxBySellerID.get(row.sellerId.unwrap()) ?? 0,
      ),
    ),
    totalCount,
    totalMoneyPaid,
    totalProducts,
    page,
    limit,
  })
}
