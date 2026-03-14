import * as API from "../../../../../Core/Api/Auth/Product/delete"
import { Result, err, ok } from "../../../../../Core/Data/Result"
import { AuthSeller } from "../../AuthApi"
import * as ProductRow from "../../../Database/ProductRow"
import * as ProductTx from "../../../Transaction/ProductTx"

export const contract = API.contract

export async function handler(
  seller: AuthSeller,
  params: API.UrlParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const { id } = params

  const productRow = await ProductRow.getByID(id)

  if (productRow == null) {
    return err("PRODUCT_NOT_FOUND")
  }

  if (productRow.sellerId.unwrap() !== seller.id.unwrap()) {
    return err("FORBIDDEN_ACTION")
  }
  await ProductTx.deleteFull(id)

  return ok({ id })
}
