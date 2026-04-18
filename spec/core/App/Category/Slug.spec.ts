import {
  createSlug,
  createSlugE,
  slugify,
} from "../../../../Core/App/Category/Slug"
import { _fromOk, _fromErr } from "../../../Fixture/Result"

describe("App/Category/Slug", () => {
  it("valid slugs", () => {
    ;["electronics", "my-category", "abc123", "a-b-c"].forEach((s) => {
      const result = createSlug(s)
      if (result == null) throw new Error(`${s} should be valid`)
      assert.strictEqual(result.unwrap(), s)
    })
  })

  it("invalid slugs", () => {
    ;[
      "",
      "UPPER",
      "has space",
      "has_underscore",
      "-leading",
      "trailing-",
      "--double",
    ].forEach((s) => {
      assert.strictEqual(createSlug(s), null)
    })
  })

  it("createSlugE returns error for invalid", () => {
    assert.strictEqual(_fromErr(createSlugE("")), "INVALID_SLUG")
  })

  it("slugify creates valid slug from text", () => {
    const result = slugify("Hello World")
    if (result == null) throw new Error("Should create slug")
    assert.strictEqual(result.unwrap(), "hello-world")
  })

  it("slugify returns null for empty text", () => {
    assert.strictEqual(slugify(""), null)
  })
})
