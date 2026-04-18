import {
  createPosterScalePercent,
  createPosterScalePercentE,
} from "../../../../Core/App/Poster/PosterScalePercent"
import { _fromErr } from "../../../Fixture/Result"

describe("App/Poster/PosterScalePercent", () => {
  it("valid scale percent", () => {
    ;[10, 50, 100, 200, 300].forEach((n) => {
      const result = createPosterScalePercent(n)
      if (result == null) throw new Error(`${n} should be valid`)
      assert.strictEqual(result.unwrap(), n)
    })
  })

  it("invalid scale percent - out of range", () => {
    ;[9, 301, -1, 0].forEach((n) => {
      assert.strictEqual(createPosterScalePercent(n), null)
    })
  })

  it("invalid scale percent - non-integer", () => {
    assert.strictEqual(createPosterScalePercent(10.5), null)
  })

  it("createPosterScalePercentE returns error", () => {
    assert.strictEqual(
      _fromErr(createPosterScalePercentE(5)),
      "INVALID_POSTER_SCALE_PERCENT",
    )
  })
})
