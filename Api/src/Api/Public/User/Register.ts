import * as API from "../../../../../Core/Api/Public/RegisterUser"
import { Result, ok, err } from "../../../../../Core/Data/Result"
import * as UserRow from "../../../Database/UserRow"
import * as RefreshTokenRow from "../../../Database/RefreshTokenRow"
import * as Hash from "../../../Data/Hash"
import * as AccessToken from "../../../App/AccessTokenUser"
import { toUser } from "../../../App/User"
import * as ConversationRow from "../../../Database/ConversationRow"

const SUPPORT_PARTICIPANT_ID = "00000000-0000-6000-8000-000000000001"

export const contract = API.contract
const actor_type: RefreshTokenRow.ActorType = "USER"

export async function handler(
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const { email, password, name } = params

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

  // Eagerly create support conversation so it appears immediately in the chat list
  try {
    await ConversationRow.create(userRow.id.unwrap(), "USER", SUPPORT_PARTICIPANT_ID, "SELLER")
  } catch {
    // Ignore race or duplicate errors
  }

  return ok(await loginPayload(userRow))
}

export async function loginPayload(
  userRow: UserRow.UserRow,
): Promise<API.Payload> {
  const user = toUser(userRow)

  const [accessToken, refreshToken] = await Promise.all([
    AccessToken.issue(userRow.id),
    RefreshTokenRow.create(userRow.id, actor_type),
  ])

  return {
    user,
    accessToken,
    refreshToken,
  }
}
