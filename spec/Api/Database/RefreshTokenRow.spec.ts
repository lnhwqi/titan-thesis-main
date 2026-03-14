import * as RefreshTokenRow from "../../../Api/src/Database/RefreshTokenRow"
import { _createUser, _notNull } from "../../Fixture"

describe("Database/RefreshTokenRow", () => {
  test("success", async () => {
    const user = await _createUser("user@example.com")
    const anotherUser = await _createUser("anotherUser@example.com")

    const [bad, good, other] = await Promise.all([
      RefreshTokenRow._createExpired(user.id, "USER"),
      RefreshTokenRow.create(user.id, "USER"),
      RefreshTokenRow.create(anotherUser.id, "USER"),
    ])

    await RefreshTokenRow.removeAllExpired()

    const [bad_, good_, other_] = await Promise.all([
      RefreshTokenRow.get(user.id, "USER", bad),
      RefreshTokenRow.get(user.id, "USER", good),
      RefreshTokenRow.get(anotherUser.id, "USER", other),
    ])
    expect(bad_).toBeNull()
    expect(_notNull(good_).id.unwrap()).toBe(good.unwrap())

    expect(_notNull(other_).id.unwrap()).toBe(other.unwrap())
  })
})
