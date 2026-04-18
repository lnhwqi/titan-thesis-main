import {
  createSellerDescription,
  createSellerDescriptionE,
} from "../../../../Core/App/Report/SellerDescription"

describe("App/Report/SellerDescription", () => {
  it("valid description", () => {
    ;["Seller response text", "A", "a".repeat(1024)].forEach((d) => {
      const result = createSellerDescription(d)
      if (result == null) throw new Error(`should be valid`)
    })
  })

  it("invalid description - empty", () => {
    assert.strictEqual(createSellerDescription(""), null)
  })

  it("invalid description - too long", () => {
    assert.strictEqual(createSellerDescription("a".repeat(1025)), null)
  })
})
