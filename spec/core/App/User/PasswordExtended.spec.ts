import {
  createPassword,
  createPasswordE,
  passwordErrors,
  passwordErrorString,
} from "../../../../Core/App/User/Password"
import { _fromErr } from "../../../Fixture/Result"

describe("App/User/Password (extended)", () => {
  it("createPasswordE returns error for short password", () => {
    assert.strictEqual(_fromErr(createPasswordE("a@3")), "INVALID_LENGTH")
  })

  it("createPasswordE returns error for missing number", () => {
    assert.strictEqual(_fromErr(createPasswordE("abcdefg@")), "MISSING_NUMBER")
  })

  it("createPasswordE returns error for missing symbol", () => {
    assert.strictEqual(_fromErr(createPasswordE("abcdefg1")), "MISSING_SYMBOL")
  })

  it("createPasswordE returns error for spaces", () => {
    assert.strictEqual(_fromErr(createPasswordE("a@3 5678")), "CONTAINS_SPACE")
  })

  it("passwordErrors returns all errors", () => {
    const errors = passwordErrors("")
    assert.ok(errors.includes("INVALID_LENGTH"))
    assert.ok(errors.includes("MISSING_NUMBER"))
    assert.ok(errors.includes("MISSING_SYMBOL"))
  })

  it("passwordErrors returns empty for valid", () => {
    assert.deepStrictEqual(passwordErrors("a@345678"), [])
  })

  it("passwordErrorString maps errors to strings", () => {
    assert.strictEqual(
      passwordErrorString("INVALID_LENGTH"),
      "Minimum 8 characters",
    )
    assert.strictEqual(
      passwordErrorString("MISSING_NUMBER"),
      "At least 1 number",
    )
    assert.strictEqual(
      passwordErrorString("MISSING_SYMBOL"),
      "At least 1 symbol",
    )
    assert.strictEqual(
      passwordErrorString("CONTAINS_SPACE"),
      "Not contains space",
    )
  })
})
