import * as API from "../../../../Core/Api/Public/RefreshTokenAdmin"
import { Result, err, ok } from "../../../../Core/Data/Result"
import * as RefreshTokenRow from "../../Database/RefreshTokenRow"
import * as AccessToken from "../../App/AccessTokenAdmin"
import * as AdminRow from "../../Database/AdminRow"
import { toAdmin } from "../../App/Admin"
import { AdminID } from "../../../../Core/App/Admin/AdminID"
import { RefreshToken } from "../../../../Core/Data/Security/RefreshToken"

export const contract = API.contract
const actor_type: RefreshTokenRow.ActorType = "SELLER"

/** It is VERY IMPORTANT to ensure that admin has received the new RefreshToken
 * or provide a way for admin to recover
 * We have chosen to allow admin to reuse previous token
 * to get the new refreshToken
 * */
export async function handler(
  params: API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const { adminID, refreshToken } = params
  const token = await RefreshTokenRow.get(adminID, actor_type, refreshToken)
  if (token == null) {
    // Admin may have missed out the new refresh token
    // Let's try if we can find their previous refresh token
    return handleByPreviousRefreshToken(params)
  }

  if (RefreshTokenRow.isExpired(token)) {
    return err("INVALID")
  }

  const newRefreshToken = await RefreshTokenRow.replace(token)
  return issueJWTandRefreshToken(adminID, newRefreshToken.id)
}

/** When a admin failed to receive the new refresh token previously
 * due to maybe network error or app crashes
 * the admin will refresh again with an old token
 * When this happens, we will simply return the already issued refreshToken.
 *
 * WARN This creates a weaker security
 * as we allow previous refresh token to be used again
 * Pros: No need admin to acknowledge the new refresh token
 * Cons: Previous token can be reused to get issued refresh token
 *       though only the last token can be reused
 *
 * NOTE We chose to return the same refreshToken instead of generating a new one
 */
async function handleByPreviousRefreshToken(
  params: API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const { adminID, refreshToken } = params
  const token = await RefreshTokenRow.getByPrevious(
    adminID,
    actor_type,
    refreshToken,
  )
  if (token == null || RefreshTokenRow.isExpiredPrevious(token)) {
    return err("INVALID")
  }

  return issueJWTandRefreshToken(adminID, token.id)
}

async function issueJWTandRefreshToken(
  adminID: AdminID,
  refreshToken: RefreshToken,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const adminRow = await AdminRow.getByID(adminID)
  if (adminRow == null) {
    return err("INVALID")
  }

  const accessToken = await AccessToken.issue(adminRow.id)

  return ok({
    admin: toAdmin(adminRow),
    accessToken,
    refreshToken,
  })
}
