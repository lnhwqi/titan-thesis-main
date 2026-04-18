import {
  createPosterOffsetPercent,
  createPosterOffsetPercentE,
} from "../../../../Core/App/Poster/PosterOffsetPercent"
import { _fromErr } from "../../../Fixture/Result"

describe("App/Poster/PosterOffsetPercent", () => {
  it("valid offset percent", () => {
    ;[-100, -50, 0, 50, 100].forEach((n) => {
      const result = createPosterOffsetPercent(n)
      if (result == null) throw new Error(`${n} should be valid`)
      assert.strictEqual(result.unwrap(), n)
    })
  })

  it("invalid offset percent - out of range", () => {
    ;[-101, 101, -200, 200].forEach((n) => {
      assert.strictEqual(createPosterOffsetPercent(n), null)
    })
  })

  it("invalid offset percent - non-integer", () => {
    assert.strictEqual(createPosterOffsetPercent(10.5), null)
  })

  it("createPosterOffsetPercentE returns error", () => {
    assert.strictEqual(
      _fromErr(createPosterOffsetPercentE(200)),
      "INVALID_POSTER_OFFSET_PERCENT",
    )
  })
})
