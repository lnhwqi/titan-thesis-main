import { createImageID } from "../../../../Core/App/Product/ProductImageID"

describe("App/Product/ProductImageID", () => {
  it("createImageID generates a valid ID", () => {
    const id = createImageID()
    assert.ok(id.unwrap().length > 0)
  })

  it("createImageID generates unique IDs", () => {
    const id1 = createImageID()
    const id2 = createImageID()
    assert.notStrictEqual(id1.unwrap(), id2.unwrap())
  })
})
