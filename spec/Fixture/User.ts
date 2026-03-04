import * as UserRow from "../../Api/src/Database/UserRow"
import * as Hash from "../../Api/src/Data/Hash"
import { _notNull } from "./Maybe"
import { emailDecoder } from "../../Core/Data/User/Email"
import { nameDecoder } from "../../Core/App/BaseProfile/Name"
import { createNow } from "../../Core/Data/Time/Timestamp"
import { createUserID } from "../../Core/App/BaseProfile/UserID"
import { passwordDecoder } from "../../Core/App/BaseProfile/Password"
import { pointsDecoder } from "../../Core/App/User/Points"
import { tierDecoder } from "../../Core/App/User/Tier"
import { walletDecoder } from "../../Core/App/BaseProfile/Wallet"
import { activeDecoder } from "../../Core/App/BaseProfile/Active"

export const _defaultPassword = passwordDecoder.verify("Valid4Good.Password")

/**
 * Helper để tạo nhanh một User trong Database phục vụ Unit Test.
 * Sử dụng unsafeCreate để có thể ghi đè (override) bất kỳ field nào.
 */
export async function _createUser(
  emailS: string,
  userData?: Partial<UserRow.UserRow>,
): Promise<UserRow.UserRow> {
  const hashedPassword = await _hashPassword(_defaultPassword.unwrap())
  const now = createNow()

  return UserRow.unsafeCreate({
    id: createUserID(),
    email: emailDecoder.verify(emailS),
    name: nameDecoder.verify("Alice"),
    password: hashedPassword.unwrap(),
    wallet: walletDecoder.verify(0),
    active: activeDecoder.verify(true),
    points: pointsDecoder.verify(0),
    tier: tierDecoder.verify("bronze"),
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
    ...userData, // Cho phép ghi đè các giá trị trên nếu truyền vào userData
  })
}

export async function _hashPassword(s: string): Promise<Hash.Hash> {
  return Hash.issue(s).then(_notNull)
}
