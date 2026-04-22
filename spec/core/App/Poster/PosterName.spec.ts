import { createPosterName } from "../../../../Core/App/Poster/PosterName"

describe("App/Poster/PosterName", () => {
  it("valid poster name", () => {
    ;["Summer Sale", "A", "a".repeat(120)].forEach((n) => {
      const result = createPosterName(n)
      if (result == null) throw new Error(`${n} should be valid`)
      assert.strictEqual(result.unwrap(), n)
    })
  })

  it("invalid poster name", () => {
    ;["", "a".repeat(121)].forEach((n) => {
      assert.strictEqual(createPosterName(n), null)
    })
  })
})
