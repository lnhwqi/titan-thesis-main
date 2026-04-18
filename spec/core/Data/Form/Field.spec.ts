import * as Field from "../../../../Core/Data/Form/Field"
import { ok, err } from "../../../../Core/Data/Result"

describe("Data/Form/Field", () => {
  const parser = (s: string) =>
    s.length > 0 ? ok(s.toUpperCase()) : err("EMPTY" as const)

  it("init creates field with value", () => {
    const field = Field.init("hello", parser)
    assert.strictEqual(field.unwrap(), "hello")
  })

  it("parse sets memo from parser", () => {
    const field = Field.parse(Field.init("hello", parser))
    assert.strictEqual(Field.value(field), "HELLO")
    assert.strictEqual(Field.error(field), null)
  })

  it("parse sets error for invalid input", () => {
    const field = Field.parse(Field.init("", parser))
    assert.strictEqual(Field.error(field), "EMPTY")
    assert.strictEqual(Field.value(field), null)
  })

  it("change updates value", () => {
    const field = Field.change("world", Field.init("hello", parser))
    assert.strictEqual(field.unwrap(), "world")
  })

  it("changeAndParse updates value and parses", () => {
    const field = Field.changeAndParse("world", Field.init("hello", parser))
    assert.strictEqual(Field.value(field), "WORLD")
  })

  it("clearError removes memo", () => {
    const parsed = Field.parse(Field.init("", parser))
    assert.strictEqual(Field.error(parsed), "EMPTY")

    const cleared = Field.clearError(parsed)
    assert.strictEqual(Field.error(cleared), null)
  })

  it("value returns null when not parsed", () => {
    const field = Field.init("hello", parser)
    assert.strictEqual(Field.value(field), null)
  })

  it("error returns null when not parsed", () => {
    const field = Field.init("hello", parser)
    assert.strictEqual(Field.error(field), null)
  })
})
