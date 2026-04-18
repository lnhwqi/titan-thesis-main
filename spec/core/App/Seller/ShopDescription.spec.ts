import {
  createDescription,
  createDescriptionE,
} from "../../../../Core/App/Seller/ShopDescription"
import { _fromErr } from "../../../Fixture/Result"

describe("App/Seller/ShopDescription", () => {
  it("valid description", () => {
    ;["A short description", "A", "a".repeat(1024)].forEach((d) => {
      const result = createDescription(d)
      if (result == null) throw new Error(`should be valid`)
      assert.strictEqual(result.unwrap(), d)
    })
  })

  it("invalid description", () => {
    ;["", "a".repeat(1025)].forEach((d) => {
      assert.strictEqual(createDescription(d), null)
    })
  })

  it("createDescriptionE returns error for empty", () => {
    assert.strictEqual(_fromErr(createDescriptionE("")), "INVALID_DESCRIPTION")
  })
})
