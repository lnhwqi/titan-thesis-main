import * as API from "../../../../../../Core/Api/Auth/User/CoinRain/ListMine"
import { ok, Result } from "../../../../../../Core/Data/Result"
import { AuthUser } from "../../../AuthApi"
import db from "../../../../Database"

export const contract = API.contract

export async function handler(
  user: AuthUser,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const rows = await db
    .selectFrom("coin_rain_coin")
    .select(["id", "value", "claimedAt"])
    .where("claimedByUserId", "=", user.id.unwrap())
    .where("claimedAt", "is not", null)
    .orderBy("claimedAt", "desc")
    .execute()

  const claimedRows = rows.filter((row) => row.claimedAt != null)

  const payload = API.payloadDecoder.verify({
    transactions: claimedRows.map((row) => ({
      coinId: row.id,
      value: row.value,
      claimedAt:
        row.claimedAt instanceof Date
          ? row.claimedAt.toISOString()
          : String(row.claimedAt),
    })),
    totalCoins: claimedRows.reduce((sum, row) => sum + (row.value ?? 0), 0),
  })

  return ok(payload)
}
