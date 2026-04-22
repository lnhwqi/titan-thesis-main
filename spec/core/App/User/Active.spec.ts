import { createActive } from "../../../../Core/App/User/Active"

describe("App/User/Active", () => {
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
