import { createUserID } from "../../../../Core/App/User/UserID"

describe("App/User/UserID", () => {
  it("createUserID generates a valid ID", () => {
    const id = createUserID()
    assert.ok(id.unwrap().length > 0)
  })

  it("createUserID generates unique IDs", () => {
    const id1 = createUserID()
    const id2 = createUserID()
    assert.notStrictEqual(id1.unwrap(), id2.unwrap())
  })
})
