import { AdminRow } from "../Database/AdminRow"
import { Admin } from "../../../Core/App/Admin"

export function toAdmin(row: AdminRow): Admin {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    wallet: row.wallet,
    active: row.active,
  }
}
