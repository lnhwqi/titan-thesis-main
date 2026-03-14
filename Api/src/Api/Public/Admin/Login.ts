import * as API from "../../../../../Core/Api/Public/LoginAdmin"
import { Result, err, ok } from "../../../../../Core/Data/Result"
import * as AdminRow from "../../../Database/AdminRow"
import * as RefreshTokenRow from "../../../Database/RefreshTokenRow"
import * as Hash from "../../../Data/Hash"
import * as AccessToken from "../../../App/AccessTokenAdmin"
import { toAdmin } from "../../../App/Admin"

export const contract = API.contract
const actor_type: RefreshTokenRow.ActorType = "ADMIN"
export async function handler(
  params: API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const { email, password } = params

  const adminRow = await AdminRow.getByEmail(email)
  if (adminRow == null) {
    return err("ADMIN_NOT_FOUND")
  }

  const isValidPassword = await Hash.verify(
    password.unwrap(),
    adminRow.password,
  )
  if (isValidPassword === false) return err("INVALID_PASSWORD")

  return ok(await loginPayload(adminRow))
}

/**
 * Exported for other handlers to use such as register
 */
export async function loginPayload(
  adminRow: AdminRow.AdminRow,
): Promise<API.Payload> {
  const admin = toAdmin(adminRow)
  const [accessToken, refreshToken] = await Promise.all([
    AccessToken.issue(adminRow.id),
    RefreshTokenRow.create(adminRow.id, actor_type),
  ])

  return { admin, accessToken, refreshToken }
}
