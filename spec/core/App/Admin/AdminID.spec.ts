import { createAdminID } from "../../../../Core/App/Admin/AdminID"

describe("App/Admin/AdminID", () => {
  it("createAdminID generates a valid ID", () => {
    const id = createAdminID()
    assert.ok(id.unwrap().length > 0)
  })

  it("createAdminID generates unique IDs", () => {
    const id1 = createAdminID()
    const id2 = createAdminID()
    assert.notStrictEqual(id1.unwrap(), id2.unwrap())
  })
})
