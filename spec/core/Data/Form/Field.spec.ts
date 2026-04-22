import * as Field from "../../../../Core/Data/Form/Field"
import { ok, err } from "../../../../Core/Data/Result"

describe("Data/Form/Field", () => {
  const parser: Field.ParseDontValidateFn<"EMPTY", string, string> = (s) =>
    s.length > 0 ? ok(s.toUpperCase()) : err("EMPTY")

  const initField = (value: string): Field.Field<"EMPTY", string, string> =>
    Field.init<"EMPTY", string, string>(value, parser)

  it("init creates field with value", () => {
    const field = initField("hello")
    assert.strictEqual(field.unwrap(), "hello")
  })

  it("parse sets memo from parser", () => {
    const field = Field.parse(initField("hello"))
    assert.strictEqual(Field.value(field), "HELLO")
    assert.strictEqual(Field.error(field), null)
  })

  it("parse sets error for invalid input", () => {
    const field = Field.parse(initField(""))
    assert.strictEqual(Field.error(field), "EMPTY")
    assert.strictEqual(Field.value(field), null)
  })

  it("change updates value", () => {
    const field = Field.change("world", initField("hello"))
    assert.strictEqual(field.unwrap(), "world")
  })

  it("changeAndParse updates value and parses", () => {
    const field = Field.changeAndParse("world", initField("hello"))
    assert.strictEqual(Field.value(field), "WORLD")
  })

  it("clearError removes memo", () => {
    const parsed = Field.parse(initField(""))
    assert.strictEqual(Field.error(parsed), "EMPTY")

    const cleared = Field.clearError(parsed)
    assert.strictEqual(Field.error(cleared), null)
  })

  it("value returns null when not parsed", () => {
    const field = initField("hello")
    assert.strictEqual(Field.value(field), null)
  })

  it("error returns null when not parsed", () => {
    const field = initField("hello")
    assert.strictEqual(Field.error(field), null)
  })
})
