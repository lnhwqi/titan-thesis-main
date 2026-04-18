import {
  createPassword,
  createPasswordE,
  passwordErrors,
} from "../../../../Core/App/Admin/Password"
import { _fromErr } from "../../../Fixture/Result"

describe("App/Admin/Password", () => {
  it("valid password", () => {
    ;["a@345678", "Easy2Type&Safe", "//00123123"].forEach((p) => {
      const result = createPassword(p)
      if (result == null) throw new Error(`${p} should be valid`)
      assert.strictEqual(result.unwrap(), p)
    })
  })

  it("invalid password", () => {
    ;["", "1234567", "12345678", "a2345678", "@@##$%%**"].forEach((p) => {
      assert.strictEqual(createPassword(p), null)
    })
  })

  it("createPasswordE returns error for short", () => {
    assert.strictEqual(_fromErr(createPasswordE("a@3")), "INVALID_LENGTH")
  })

  it("passwordErrors returns errors for empty", () => {
    const errors = passwordErrors("")
    assert.ok(errors.includes("INVALID_LENGTH"))
    assert.ok(errors.includes("MISSING_NUMBER"))
    assert.ok(errors.includes("MISSING_SYMBOL"))
  })
})
