import { createPosterImageUrl } from "../../../../Core/App/Poster/PosterImageUrl"

describe("App/Poster/PosterImageUrl", () => {
  it("valid image URL", () => {
    ;["https://example.com/poster.jpg", "/uploads/poster.png"].forEach(
      (url) => {
        const result = createPosterImageUrl(url)
        if (result == null) throw new Error(`${url} should be valid`)
        assert.strictEqual(result.unwrap(), url)
      },
    )
  })

  it("invalid image URL - empty", () => {
    assert.strictEqual(createPosterImageUrl(""), null)
  })
})
