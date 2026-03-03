import { User } from "../../../Core/App/User"
import { UserRow } from "../Database/UserRow"

export function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    wallet: row.wallet,
    active: row.active,
    points: row.points,
    tier: row.tier,
  }
}
