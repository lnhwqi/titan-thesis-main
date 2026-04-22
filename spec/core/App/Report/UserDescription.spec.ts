import { createUserDescription } from "../../../../Core/App/Report/UserDescription"
import { _fromErr } from "../../../Fixture/Result"

describe("App/Report/UserDescription", () => {
  it("valid description", () => {
    ;["Item was broken", "A", "a".repeat(1024)].forEach((d) => {
      const result = createUserDescription(d)
      if (result == null) throw new Error(`should be valid`)
    })
  })

  it("invalid description - empty", () => {
    assert.strictEqual(createUserDescription(""), null)
  })

  it("invalid description - too long", () => {
    assert.strictEqual(createUserDescription("a".repeat(1025)), null)
  })
})
