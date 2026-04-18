import { createCategoryID } from "../../../../Core/App/Category/CategoryID"

describe("App/Category/CategoryID", () => {
  it("createCategoryID generates a valid ID", () => {
    const id = createCategoryID()
    assert.ok(id.unwrap().length > 0)
  })

  it("createCategoryID generates unique IDs", () => {
    const id1 = createCategoryID()
    const id2 = createCategoryID()
    assert.notStrictEqual(id1.unwrap(), id2.unwrap())
  })
})
