import {
  createRefreshToken,
  unsafeToRefreshToken,
  refreshTokenDecoder,
} from "../../../../Core/Data/Security/RefreshToken"

describe("Data/Security/RefreshToken", () => {
  it("createRefreshToken generates a token", () => {
    const token = createRefreshToken()
    assert.ok(token.unwrap().length > 0)
  })

  it("createRefreshToken generates unique tokens", () => {
    const t1 = createRefreshToken()
    const t2 = createRefreshToken()
    assert.notStrictEqual(t1.unwrap(), t2.unwrap())
  })

  it("unsafeToRefreshToken wraps string", () => {
    const token = unsafeToRefreshToken("test-token")
    assert.strictEqual(token.unwrap(), "test-token")
  })

  it("refreshTokenDecoder decodes string", () => {
    const decoded = refreshTokenDecoder.verify("some-token")
    assert.strictEqual(decoded.unwrap(), "some-token")
  })
})
