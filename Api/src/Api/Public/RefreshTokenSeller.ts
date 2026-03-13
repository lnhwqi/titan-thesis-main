import * as API from "../../../../Core/Api/Public/RefreshTokenSeller"
import { Result, err, ok } from "../../../../Core/Data/Result"
import * as RefreshTokenRow from "../../Database/RefreshTokenRow"
import * as AccessToken from "../../App/AccessTokenSeller"
import * as SellerRow from "../../Database/SellerRow"
import { toSeller } from "../../App/Seller"
import { SellerID } from "../../../../Core/App/Seller/SellerID"
import { RefreshToken } from "../../../../Core/Data/Security/RefreshToken"

export const contract = API.contract
const actor_type: RefreshTokenRow.ActorType = "SELLER"

/** It is VERY IMPORTANT to ensure that seller has received the new RefreshToken
 * or provide a way for seller to recover
 * We have chosen to allow seller to reuse previous token
 * to get the new refreshToken
 * */
export async function handler(
  params: API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const { sellerID, refreshToken } = params
  const token = await RefreshTokenRow.get(sellerID, actor_type, refreshToken)
  if (token == null) {
    // Seller may have missed out the new refresh token
    // Let's try if we can find their previous refresh token
    return handleByPreviousRefreshToken(params)
  }

  if (RefreshTokenRow.isExpired(token)) {
    return err("INVALID")
  }

  const newRefreshToken = await RefreshTokenRow.replace(token)
  return issueJWTandRefreshToken(sellerID, newRefreshToken.id)
}

/** When a seller failed to receive the new refresh token previously
 * due to maybe network error or app crashes
 * the seller will refresh again with an old token
 * When this happens, we will simply return the already issued refreshToken.
 *
 * WARN This creates a weaker security
 * as we allow previous refresh token to be used again
 * Pros: No need seller to acknowledge the new refresh token
 * Cons: Previous token can be reused to get issued refresh token
 *       though only the last token can be reused
 *
 * NOTE We chose to return the same refreshToken instead of generating a new one
 */
async function handleByPreviousRefreshToken(
  params: API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const { sellerID, refreshToken } = params
  const token = await RefreshTokenRow.getByPrevious(
    sellerID,
    actor_type,
    refreshToken,
  )
  if (token == null || RefreshTokenRow.isExpiredPrevious(token)) {
    return err("INVALID")
  }

  return issueJWTandRefreshToken(sellerID, token.id)
}

async function issueJWTandRefreshToken(
  sellerID: SellerID,
  refreshToken: RefreshToken,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const sellerRow = await SellerRow.getByID(sellerID)
  if (sellerRow == null) {
    return err("INVALID")
  }

  const accessToken = await AccessToken.issue(sellerRow.id)

  return ok({
    seller: toSeller(sellerRow),
    accessToken,
    refreshToken,
  })
}
