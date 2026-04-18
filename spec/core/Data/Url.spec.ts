import {
  createWebLink,
  createWebLinkE,
  webLinkDecoder,
} from "../../../Core/Data/Url"
import { _fromOk, _fromErr } from "../../Fixture/Result"

describe("Data/Url", () => {
  it("createWebLink returns value for valid URL", () => {
    ;[
      "https://example.com",
      "http://localhost:3000",
      "ftp://files.example.com",
    ].forEach((url) => {
      const result = createWebLink(url)
      if (result == null) throw new Error(`${url} should be valid`)
      assert.strictEqual(result.unwrap(), url)
    })
  })

  it("createWebLink returns null for invalid URL", () => {
    ;["", "not-a-url", "://missing-scheme"].forEach((url) => {
      assert.strictEqual(createWebLink(url), null)
    })
  })

  it("createWebLinkE returns Ok for valid URL", () => {
    const result = _fromOk(createWebLinkE("https://example.com"))
    assert.strictEqual(result.unwrap(), "https://example.com")
  })

  it("createWebLinkE returns Err for invalid URL", () => {
    const result = _fromErr(createWebLinkE("not-a-url"))
    assert.strictEqual(result, "INVALID_URL")
  })

  it("webLinkDecoder decodes valid URL", () => {
    const decoded = webLinkDecoder.verify("https://example.com")
    assert.strictEqual(decoded.unwrap(), "https://example.com")
  })

  it("webLinkDecoder rejects invalid URL", () => {
    const result = webLinkDecoder.decode("not-a-url")
    assert.strictEqual(result.ok, false)
  })
})
