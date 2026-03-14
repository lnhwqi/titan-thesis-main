import * as API from "../../../../../Core/Api/Public/LoginSeller"
import { Result, err, ok } from "../../../../../Core/Data/Result"
import * as SellerRow from "../../../Database/SellerRow"
import * as RefreshTokenRow from "../../../Database/RefreshTokenRow"
import * as Hash from "../../../Data/Hash"
import * as AccessToken from "../../../App/AccessTokenSeller"
import { toSeller } from "../../../App/Seller"

export const contract = API.contract
const actor_type: RefreshTokenRow.ActorType = "SELLER"
export async function handler(
  params: API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const { email, password } = params

  const sellerRow = await SellerRow.getByEmail(email)
  if (sellerRow == null) {
    return err("SELLER_NOT_FOUND")
  }

  const isValidPassword = await Hash.verify(
    password.unwrap(),
    sellerRow.password,
  )
  if (isValidPassword === false) return err("INVALID_PASSWORD")

  if (sellerRow.verified.unwrap() === false) {
    return err("ACCOUNT_BANNED")
  }

  return ok(await loginPayload(sellerRow))
}

/**
 * Exported for other handlers to use such as register
 */
export async function loginPayload(
  sellerRow: SellerRow.SellerRow,
): Promise<API.Payload> {
  const seller = toSeller(sellerRow)
  const [accessToken, refreshToken] = await Promise.all([
    AccessToken.issue(sellerRow.id),
    RefreshTokenRow.create(sellerRow.id, actor_type),
  ])

  return { seller, accessToken, refreshToken }
}
