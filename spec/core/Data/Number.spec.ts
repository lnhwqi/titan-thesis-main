import { clamp, numberStringDecoder } from "../../../Core/Data/Number"

describe("Data/Number", () => {
  it("clamp returns value within range", () => {
    assert.strictEqual(clamp(0, 100, 50), 50)
  })

  it("clamp returns min when value is below", () => {
    assert.strictEqual(clamp(0, 100, -10), 0)
  })

  it("clamp returns max when value is above", () => {
    assert.strictEqual(clamp(0, 100, 200), 100)
  })

  it("clamp returns min when value equals min", () => {
    assert.strictEqual(clamp(0, 100, 0), 0)
  })

  it("clamp returns max when value equals max", () => {
    assert.strictEqual(clamp(0, 100, 100), 100)
  })

  it("numberStringDecoder decodes valid number string", () => {
    assert.strictEqual(numberStringDecoder.verify("42"), 42)
  })

  it("numberStringDecoder rejects non-number string", () => {
    const result = numberStringDecoder.decode("abc")
    assert.strictEqual(result.ok, false)
  })
})
