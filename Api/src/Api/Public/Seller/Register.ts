import * as API from "../../../../../Core/Api/Public/RegisterSeller"
import { Result, ok, err } from "../../../../../Core/Data/Result"
import * as SellerRow from "../../../Database/SellerRow"
import * as AccessToken from "../../../App/AccessTokenSeller"
import { toSeller } from "../../../App/Seller"
import * as Hash from "../../../Data/Hash"
import * as RefreshTokenRow from "../../../Database/RefreshTokenRow"
import * as ConversationRow from "../../../Database/ConversationRow"

const SUPPORT_PARTICIPANT_ID = "00000000-0000-6000-8000-000000000001"

export const contract = API.contract
const actor_type: RefreshTokenRow.ActorType = "SELLER"

export async function handler(
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const { email, shopName, password, name } = params

  const existingEmail = await SellerRow.getByEmail(email)
  if (existingEmail != null) return err("EMAIL_ALREADY_EXISTS")

  const existingShop = await SellerRow.getByShopName(shopName)
  if (existingShop != null) return err("SHOP_NAME_TAKEN")

  const hashedPassword = await Hash.issue(password.unwrap())
  if (hashedPassword == null) {
    throw new Error("FAILED_TO_HASH_PASSWORD")
  }

  const sellerRow = await SellerRow.create({
    email,
    name,
    shopName,
    hashedPassword,
  })

  // Eagerly create support conversation so it appears immediately in the chat list
  try {
    await ConversationRow.create(sellerRow.id.unwrap(), "SELLER", SUPPORT_PARTICIPANT_ID, "SELLER")
  } catch {
    // Ignore race or duplicate errors
  }

  return ok(await loginPayload(sellerRow))
}

export async function loginPayload(
  sellerRow: SellerRow.SellerRow,
): Promise<API.Payload> {
  const seller = toSeller(sellerRow)

  const [accessToken, refreshToken] = await Promise.all([
    AccessToken.issue(sellerRow.id),
    RefreshTokenRow.create(sellerRow.id, actor_type),
  ])

  return {
    seller,
    accessToken,
    refreshToken,
  }
}
