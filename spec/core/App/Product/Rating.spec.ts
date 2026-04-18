import {
  createRating,
  createRatingE,
} from "../../../../Core/App/Product/Rating"
import { _fromErr } from "../../../Fixture/Result"

describe("App/Product/Rating", () => {
  it("valid rating", () => {
    ;[0, 1, 2, 3, 4, 5].forEach((n) => {
      const result = createRating(n)
      if (result == null) throw new Error(`${n} should be valid`)
      assert.strictEqual(result.unwrap(), n)
    })
  })

  it("invalid rating - out of range", () => {
    ;[-1, 6, 100].forEach((n) => {
      assert.strictEqual(createRating(n), null)
    })
  })

  it("invalid rating - non-integer", () => {
    assert.strictEqual(createRating(2.5), null)
    assert.strictEqual(createRating(NaN), null)
  })

  it("createRatingE returns error", () => {
    assert.strictEqual(_fromErr(createRatingE(-1)), "INVALID_PRODUCT_RATING")
  })
})
