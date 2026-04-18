import {
  createProvinceName,
  createProvinceNameE,
} from "../../../../Core/App/Address/provinceName"
import { _fromErr } from "../../../Fixture/Result"

describe("App/Address/ProvinceName", () => {
  it("valid province name", () => {
    const result = createProvinceName("Ho Chi Minh")
    if (result == null) throw new Error("Should be valid")
    assert.strictEqual(result.unwrap(), "Ho Chi Minh")
  })

  it("invalid province name - empty", () => {
    assert.strictEqual(createProvinceName(""), null)
  })

  it("invalid province name - too long", () => {
    assert.strictEqual(createProvinceName("a".repeat(101)), null)
  })
})
