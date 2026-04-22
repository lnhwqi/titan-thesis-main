import { createWardName } from "../../../../Core/App/Address/wardName"
import { _fromErr } from "../../../Fixture/Result"

describe("App/Address/WardName", () => {
  it("valid ward name", () => {
    const result = createWardName("Ward 5")
    if (result == null) throw new Error("Should be valid")
    assert.strictEqual(result.unwrap(), "Ward 5")
  })

  it("invalid ward name - empty", () => {
    assert.strictEqual(createWardName(""), null)
  })

  it("invalid ward name - too long", () => {
    assert.strictEqual(createWardName("a".repeat(101)), null)
  })
})
