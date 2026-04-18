import {
  createResultTextAdmin,
  createResultTextAdminE,
} from "../../../../Core/App/Report/ResultTextAdmin"

describe("App/Report/ResultTextAdmin", () => {
  it("valid result text", () => {
    ;["Admin decision text", "A", "a".repeat(1024)].forEach((t) => {
      const result = createResultTextAdmin(t)
      if (result == null) throw new Error(`should be valid`)
    })
  })

  it("invalid result text - empty", () => {
    assert.strictEqual(createResultTextAdmin(""), null)
  })

  it("invalid result text - too long", () => {
    assert.strictEqual(createResultTextAdmin("a".repeat(1025)), null)
  })
})
