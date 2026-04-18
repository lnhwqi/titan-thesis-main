import {
  booleanStringDecoder,
  decodeBase64,
  decodeBase64E,
} from "../../../Core/Data/Decoder"

describe("Data/Decoder", () => {
  it("booleanStringDecoder decodes 'true'", () => {
    assert.strictEqual(booleanStringDecoder.verify("true"), true)
  })

  it("booleanStringDecoder decodes 'false'", () => {
    assert.strictEqual(booleanStringDecoder.verify("false"), false)
  })

  it("booleanStringDecoder rejects invalid string", () => {
    const result = booleanStringDecoder.decode("yes")
    assert.strictEqual(result.ok, false)
  })

  it("decodeBase64 decodes valid base64", () => {
    const encoded = Buffer.from("hello world").toString("base64")
    assert.strictEqual(decodeBase64(encoded), "hello world")
  })

  it("decodeBase64 returns null for invalid base64", () => {
    assert.strictEqual(decodeBase64("!"), null)
  })

  it("decodeBase64E returns Ok for valid base64", () => {
    const encoded = Buffer.from("test").toString("base64")
    const result = decodeBase64E(encoded)
    assert.strictEqual(result._t, "Ok")
    if (result._t === "Ok") {
      assert.strictEqual(result.value, "test")
    }
  })

  it("decodeBase64E returns Err for invalid base64", () => {
    const result = decodeBase64E("!")
    assert.strictEqual(result._t, "Err")
  })
})
