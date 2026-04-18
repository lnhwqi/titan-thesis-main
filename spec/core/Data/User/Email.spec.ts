import {
  createEmail,
  createEmailE,
  emailDecoder,
} from "../../../../Core/Data/User/Email"
import { _fromOk, _fromErr } from "../../../Fixture/Result"

describe("Data/User/Email", () => {
  it("valid emails", () => {
    ;[
      "user@example.com",
      "test.name@domain.co",
      "a@b.cc",
      "user+tag@example.com",
    ].forEach((e) => {
      const result = createEmail(e)
      if (result == null) throw new Error(`${e} should be valid`)
      assert.strictEqual(result.unwrap(), e.trim().toLowerCase())
    })
  })

  it("invalid emails", () => {
    ;["", "notanemail", "@domain.com", "user@", "user @example.com"].forEach(
      (e) => {
        assert.strictEqual(createEmail(e), null)
      },
    )
  })

  it("createEmailE returns error for invalid", () => {
    assert.strictEqual(_fromErr(createEmailE("")), "INVALID_EMAIL")
  })

  it("emailDecoder decodes valid email", () => {
    const decoded = emailDecoder.verify("test@example.com")
    assert.strictEqual(decoded.unwrap(), "test@example.com")
  })

  it("emailDecoder rejects invalid email", () => {
    const result = emailDecoder.decode("invalid")
    assert.strictEqual(result.ok, false)
  })

  it("trims and lowercases email", () => {
    const result = createEmail("  User@Example.COM  ")
    if (result == null) throw new Error("Should be valid")
    assert.strictEqual(result.unwrap(), "user@example.com")
  })
})
