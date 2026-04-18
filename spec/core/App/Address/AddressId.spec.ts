import { createAddressID } from "../../../../Core/App/Address/AddressId"

describe("App/Address/AddressId", () => {
  it("createAddressID generates a valid ID", () => {
    const id = createAddressID()
    assert.ok(id.unwrap().length > 0)
  })

  it("createAddressID generates unique IDs", () => {
    const id1 = createAddressID()
    const id2 = createAddressID()
    assert.notStrictEqual(id1.unwrap(), id2.unwrap())
  })
})
