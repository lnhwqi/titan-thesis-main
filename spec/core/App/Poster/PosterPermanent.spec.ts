import { createPosterPermanent } from "../../../../Core/App/Poster/PosterPermanent"

describe("App/Poster/PosterPermanent", () => {
  it("valid permanent true", () => {
    const result = createPosterPermanent(true)
    if (result == null) throw new Error("Should not be null")
    assert.strictEqual(result.unwrap(), true)
  })

  it("valid permanent false", () => {
    const result = createPosterPermanent(false)
    if (result == null) throw new Error("Should not be null")
    assert.strictEqual(result.unwrap(), false)
  })
})
