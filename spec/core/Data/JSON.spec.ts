import { parseJSON, JSONStreamDelimiter } from "../../../Core/Data/JSON"

describe("Data/JSON", () => {
  it("parseJSON parses valid JSON", () => {
    const result = parseJSON('{"key": "value"}')
    assert.strictEqual(result._t, "Ok")
    if (result._t === "Ok") {
      assert.deepStrictEqual(result.value, { key: "value" })
    }
  })

  it("parseJSON returns Err for invalid JSON", () => {
    const result = parseJSON("{invalid}")
    assert.strictEqual(result._t, "Err")
  })

  it("parseJSON handles arrays", () => {
    const result = parseJSON("[1, 2, 3]")
    assert.strictEqual(result._t, "Ok")
    if (result._t === "Ok") {
      assert.deepStrictEqual(result.value, [1, 2, 3])
    }
  })

  it("parseJSON handles primitives", () => {
    assert.deepStrictEqual(parseJSON("42"), { _t: "Ok", value: 42 })
    assert.deepStrictEqual(parseJSON('"hello"'), { _t: "Ok", value: "hello" })
    assert.deepStrictEqual(parseJSON("true"), { _t: "Ok", value: true })
    assert.deepStrictEqual(parseJSON("null"), { _t: "Ok", value: null })
  })

  it("JSONStreamDelimiter is null character", () => {
    assert.strictEqual(JSONStreamDelimiter, "\0")
  })
})
