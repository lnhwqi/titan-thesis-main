import { createPosterDescription } from "../../../../Core/App/Poster/PosterDescription"

describe("App/Poster/PosterDescription", () => {
  it("valid description", () => {
    ;["Big sale this week", "A", "a".repeat(1024)].forEach((d) => {
      const result = createPosterDescription(d)
      if (result == null) throw new Error(`should be valid`)
    })
  })

  it("invalid description", () => {
    ;["", "a".repeat(1025)].forEach((d) => {
      assert.strictEqual(createPosterDescription(d), null)
    })
  })
})
