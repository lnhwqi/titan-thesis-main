import { createProductVariantID } from "../../../../Core/App/ProductVariant/ProductVariantID"

describe("App/ProductVariant/ProductVariantID", () => {
  it("createProductVariantID generates a valid ID", () => {
    const id = createProductVariantID()
    assert.ok(id.unwrap().length > 0)
  })

  it("createProductVariantID generates unique IDs", () => {
    const id1 = createProductVariantID()
    const id2 = createProductVariantID()
    assert.notStrictEqual(id1.unwrap(), id2.unwrap())
  })
})
