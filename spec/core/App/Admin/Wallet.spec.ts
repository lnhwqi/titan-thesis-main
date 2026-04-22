import { createWallet } from "../../../../Core/App/Admin/Wallet"
import { _fromErr } from "../../../Fixture/Result"

describe("App/Admin/Wallet", () => {
  it("valid wallet", () => {
    ;[0, 1, 100].forEach((n) => {
      const result = createWallet(n)
      if (result == null) throw new Error(`${n} should be valid`)
      assert.strictEqual(result.unwrap(), n)
    })
  })

  it("invalid wallet", () => {
    ;[-1, 1.5].forEach((n) => {
      assert.strictEqual(createWallet(n), null)
    })
  })
})
