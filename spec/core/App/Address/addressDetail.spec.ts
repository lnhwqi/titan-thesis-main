import {
  createAddressDetail,
  createAddressDetailE,
} from "../../../../Core/App/Address/addressDetail"
import { _fromErr } from "../../../Fixture/Result"

describe("App/Address/AddressDetail", () => {
  it("valid address detail", () => {
    ;["123 Main Street", "A", "a".repeat(100)].forEach((d) => {
      const result = createAddressDetail(d)
      if (result == null) throw new Error(`should be valid`)
      assert.strictEqual(result.unwrap(), d)
    })
  })

  it("invalid address detail", () => {
    ;["", "a".repeat(101)].forEach((d) => {
      assert.strictEqual(createAddressDetail(d), null)
    })
  })

  it("createAddressDetailE returns error for empty", () => {
    assert.strictEqual(
      _fromErr(createAddressDetailE("")),
      "INVALID_ADDRESS_DETAIL",
    )
  })
})
