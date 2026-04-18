import {
  createImageUrl,
  createImageUrlE,
} from "../../../../Core/App/Product/ProductImageUrl"
import { _fromErr } from "../../../Fixture/Result"

describe("App/Product/ProductImageUrl", () => {
  it("valid image URL", () => {
    ;[
      "https://example.com/img.jpg",
      "/uploads/image.png",
      "image.avif",
    ].forEach((url) => {
      const result = createImageUrl(url)
      if (result == null) throw new Error(`${url} should be valid`)
      assert.strictEqual(result.unwrap(), url)
    })
  })

  it("invalid image URL - empty", () => {
    assert.strictEqual(createImageUrl(""), null)
  })

  it("createImageUrlE returns error for empty", () => {
    assert.strictEqual(_fromErr(createImageUrlE("")), "INVALID_URL")
  })
})
