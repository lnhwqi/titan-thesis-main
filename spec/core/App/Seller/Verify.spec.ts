import { createVerify, createVerifyE } from "../../../../Core/App/Seller/Verify"

describe("App/Seller/Verify", () => {
  it("valid verify true", () => {
    const result = createVerify(true)
    if (result == null) throw new Error("Should not be null")
    assert.strictEqual(result.unwrap(), true)
  })

  it("valid verify false", () => {
    const result = createVerify(false)
    if (result == null) throw new Error("Should not be null")
    assert.strictEqual(result.unwrap(), false)
  })
})
