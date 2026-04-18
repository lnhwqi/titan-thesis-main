import { createPoints, createPointsE } from "../../../../Core/App/Seller/Point"
import { _fromErr } from "../../../Fixture/Result"

describe("App/Seller/Points", () => {
  it("valid points", () => {
    ;[0, 1, 100].forEach((n) => {
      const result = createPoints(n)
      if (result == null) throw new Error(`${n} should be valid`)
      assert.strictEqual(result.unwrap(), n)
    })
  })

  it("invalid points", () => {
    ;[-1, 1.5].forEach((n) => {
      assert.strictEqual(createPoints(n), null)
    })
  })

  it("createPointsE returns error for negative", () => {
    assert.strictEqual(_fromErr(createPointsE(-1)), "INVALID_POINTS")
  })
})
