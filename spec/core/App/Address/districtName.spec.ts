import {
  createDistrictName,
  createDistrictNameE,
} from "../../../../Core/App/Address/districtName"
import { _fromErr } from "../../../Fixture/Result"

describe("App/Address/DistrictName", () => {
  it("valid district name", () => {
    const result = createDistrictName("District 1")
    if (result == null) throw new Error("Should be valid")
    assert.strictEqual(result.unwrap(), "District 1")
  })

  it("invalid district name - empty", () => {
    assert.strictEqual(createDistrictName(""), null)
  })

  it("invalid district name - too long", () => {
    assert.strictEqual(createDistrictName("a".repeat(101)), null)
  })
})
