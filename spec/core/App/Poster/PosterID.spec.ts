import { createPosterID } from "../../../../Core/App/Poster/PosterID"

describe("App/Poster/PosterID", () => {
  it("createPosterID generates a valid ID", () => {
    const id = createPosterID()
    assert.ok(id.unwrap().length > 0)
  })

  it("createPosterID generates unique IDs", () => {
    const id1 = createPosterID()
    const id2 = createPosterID()
    assert.notStrictEqual(id1.unwrap(), id2.unwrap())
  })
})
