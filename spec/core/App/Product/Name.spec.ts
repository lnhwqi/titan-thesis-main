import { createName, createNameE } from "../../../../Core/App/Product/Name"
import { _fromErr } from "../../../Fixture/Result"

describe("App/Product/Name", () => {
  it("valid name", () => {
    ;["Product A", "X", "a".repeat(100)].forEach((n) => {
      const result = createName(n)
      if (result == null) throw new Error(`${n} should be valid`)
      assert.strictEqual(result.unwrap(), n)
    })
  })

  it("invalid name", () => {
    ;["", "a".repeat(101)].forEach((n) => {
      assert.strictEqual(createName(n), null)
    })
  })

  it("createNameE returns error for empty", () => {
    assert.strictEqual(_fromErr(createNameE("")), "INVALID_NAME")
  })
})
