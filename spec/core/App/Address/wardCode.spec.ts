import {
  createWardCode,
  createWardCodeE,
} from "../../../../Core/App/Address/wardCode"
import { _fromErr } from "../../../Fixture/Result"

describe("App/Address/WardCode", () => {
  it("valid ward codes", () => {
    ;["01", "123", "ward1"].forEach((c) => {
      const result = createWardCode(c)
      if (result == null) throw new Error(`${c} should be valid`)
      assert.strictEqual(result.unwrap(), c.trim())
    })
  })

  it("empty ward code", () => {
    assert.strictEqual(createWardCode(""), null)
    assert.strictEqual(createWardCode("  "), null)
  })

  it("createWardCodeE returns error for empty", () => {
    assert.strictEqual(_fromErr(createWardCodeE("")), "EMPTY_WARD_CODE")
  })
})
