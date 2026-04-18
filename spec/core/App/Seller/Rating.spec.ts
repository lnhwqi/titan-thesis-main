import { createRating, createRatingE } from "../../../../Core/App/Seller/Rating"

describe("App/Seller/Rating", () => {
  it("valid rating", () => {
    ;[1, 2, 3, 4, 5].forEach((n) => {
      const result = createRating(n)
      if (result == null) throw new Error(`${n} should be valid`)
      assert.strictEqual(result.unwrap(), n)
    })
  })

  it("clamps values within 1-5 range", () => {
    const low = createRating(0)
    if (low == null) throw new Error("Should clamp to 1")
    assert.strictEqual(low.unwrap(), 1)

    const high = createRating(10)
    if (high == null) throw new Error("Should clamp to 5")
    assert.strictEqual(high.unwrap(), 5)
  })

  it("invalid rating for NaN", () => {
    assert.strictEqual(createRating(NaN), null)
  })
})
