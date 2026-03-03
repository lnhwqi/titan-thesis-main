import * as API from "../../../../../Core/Api/Public/RegisterUser"
import { Result, ok, err } from "../../../../../Core/Data/Result"
import * as UserRow from "../../../Database/UserRow"
import * as RefreshTokenRow from "../../../Database/RefreshTokenRow"
import * as Hash from "../../../Data/Hash"
import * as AccessToken from "../../../App/AccessToken"
import { toUser } from "../../../App/User"

export const contract = API.contract

export async function handler({
  bodyParams,
}: {
  bodyParams: API.BodyParams
  urlParams: API.NoUrlParams
}): Promise<Result<API.ErrorCode, API.Payload>> {
  const { email, password, name } = bodyParams

  const existingUser = await UserRow.getByEmail(email)
  if (existingUser != null) {
    return err("EMAIL_ALREADY_EXISTS")
  }

  const hashedPassword = await Hash.issue(password.unwrap())
  if (hashedPassword == null) {
    throw new Error("FAILED_TO_HASH_PASSWORD")
  }

  const userRow = await UserRow.create({
    email,
    name,
    hashedPassword,
  })

  return ok(await loginPayload(userRow))
}

export async function loginPayload(
  userRow: UserRow.UserRow,
): Promise<API.Payload> {
  const user = toUser(userRow)

  const [accessToken, refreshToken] = await Promise.all([
    AccessToken.issue(userRow.id),
    RefreshTokenRow.create(userRow.id),
  ])

  return {
    user,
    accessToken,
    refreshToken,
  }
}
