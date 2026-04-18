import {
  createDistrictCode,
  createDistrictCodeE,
} from "../../../../Core/App/Address/districtCode"
import { _fromErr } from "../../../Fixture/Result"

describe("App/Address/DistrictCode", () => {
  it("valid district codes", () => {
    ;["01", "123", "550"].forEach((c) => {
      const result = createDistrictCode(c)
      if (result == null) throw new Error(`${c} should be valid`)
      assert.strictEqual(result.unwrap(), c)
    })
  })

  it("invalid district codes - non-digit", () => {
    assert.strictEqual(createDistrictCode("abc"), null)
    assert.strictEqual(createDistrictCode("12a"), null)
  })

  it("empty district code", () => {
    assert.strictEqual(createDistrictCode(""), null)
  })

  it("createDistrictCodeE returns correct errors", () => {
    assert.strictEqual(_fromErr(createDistrictCodeE("")), "EMPTY_DISTRICT_CODE")
    assert.strictEqual(
      _fromErr(createDistrictCodeE("abc")),
      "INVALID_DISTRICT_CODE",
    )
  })
})
