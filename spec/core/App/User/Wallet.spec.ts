import { createWallet, createWalletE } from "../../../../Core/App/User/Wallet"
import { _fromErr } from "../../../Fixture/Result"

describe("App/User/Wallet", () => {
  it("valid wallet", () => {
    ;[0, 1, 100, 999999].forEach((n) => {
      const result = createWallet(n)
      if (result == null) throw new Error(`${n} should be valid`)
      assert.strictEqual(result.unwrap(), n)
    })
  })

  it("invalid wallet", () => {
    ;[-1, 1.5, -100].forEach((n) => {
      assert.strictEqual(createWallet(n), null)
    })
  })

  it("createWalletE returns error for negative", () => {
    assert.strictEqual(_fromErr(createWalletE(-1)), "INVALID_Wallet")
  })
})
