import {
  createWithdrawn,
  createWithdrawnE,
} from "../../../../Core/App/Seller/Withdrawn"
import { _fromErr } from "../../../Fixture/Result"

describe("App/Seller/Withdrawn", () => {
  it("valid withdrawn", () => {
    ;[0, 1, 1000].forEach((n) => {
      const result = createWithdrawn(n)
      if (result == null) throw new Error(`${n} should be valid`)
      assert.strictEqual(result.unwrap(), n)
    })
  })

  it("invalid withdrawn", () => {
    ;[-1, 1.5].forEach((n) => {
      assert.strictEqual(createWithdrawn(n), null)
    })
  })

  it("createWithdrawnE returns error for negative", () => {
    assert.strictEqual(_fromErr(createWithdrawnE(-1)), "INVALID_WITHDRAWN")
  })
})
