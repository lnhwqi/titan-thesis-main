import { createActive } from "../../../../Core/App/Seller/Active"

describe("App/Seller/Active", () => {
  it("valid active true", () => {
    const result = createActive(true)
    if (result == null) throw new Error("Should not be null")
    assert.strictEqual(result.unwrap(), true)
  })

  it("valid active false", () => {
    const result = createActive(false)
    if (result == null) throw new Error("Should not be null")
    assert.strictEqual(result.unwrap(), false)
  })
})
