import {
  createFixedDigit6,
  createFixedDigit6E,
} from "../../../../Core/Data/Number/Digit"
import { _fromOk, _fromErr } from "../../../Fixture/Result"

describe("Data/Number/Digit", () => {
  it("createFixedDigit6 returns value for 6-digit string", () => {
    const result = createFixedDigit6("123456")
    if (result == null) throw new Error("Should not be null")
    assert.strictEqual(result.unwrap(), "123456")
  })

  it("createFixedDigit6 returns null for wrong length", () => {
    assert.strictEqual(createFixedDigit6("12345"), null)
    assert.strictEqual(createFixedDigit6("1234567"), null)
  })

  it("createFixedDigit6 returns null for non-digit", () => {
    assert.strictEqual(createFixedDigit6("12345a"), null)
    assert.strictEqual(createFixedDigit6("abcdef"), null)
  })

  it("createFixedDigit6 returns null for empty", () => {
    assert.strictEqual(createFixedDigit6(""), null)
  })

  it("createFixedDigit6E returns error for invalid", () => {
    assert.strictEqual(
      _fromErr(createFixedDigit6E("abc")),
      "INVALID_FIXED_DIGIT",
    )
  })
})
