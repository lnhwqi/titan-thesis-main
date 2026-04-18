import {
  createProvinceCode,
  createProvinceCodeE,
} from "../../../../Core/App/Address/provinceCode"
import { _fromErr } from "../../../Fixture/Result"

describe("App/Address/ProvinceCode", () => {
  it("valid province codes", () => {
    ;["01", "123", "79"].forEach((c) => {
      const result = createProvinceCode(c)
      if (result == null) throw new Error(`${c} should be valid`)
      assert.strictEqual(result.unwrap(), c)
    })
  })

  it("invalid province codes - non-digit", () => {
    assert.strictEqual(createProvinceCode("abc"), null)
    assert.strictEqual(createProvinceCode("12a"), null)
  })

  it("empty province code", () => {
    assert.strictEqual(createProvinceCode(""), null)
    assert.strictEqual(createProvinceCode("  "), null)
  })

  it("createProvinceCodeE returns correct errors", () => {
    assert.strictEqual(_fromErr(createProvinceCodeE("")), "EMPTY_PROVINCE_CODE")
    assert.strictEqual(
      _fromErr(createProvinceCodeE("abc")),
      "INVALID_PROVINCE_CODE",
    )
  })
})
