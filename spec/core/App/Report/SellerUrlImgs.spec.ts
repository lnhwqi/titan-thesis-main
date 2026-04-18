import {
  createSellerUrlImg,
  createSellerUrlImgE,
} from "../../../../Core/App/Report/SellerUrlImgs"
import { _fromErr } from "../../../Fixture/Result"

describe("App/Report/SellerUrlImgs", () => {
  it("valid image URL", () => {
    ;["https://example.com/img.jpg", "/uploads/img.png"].forEach((url) => {
      const result = createSellerUrlImg(url)
      if (result == null) throw new Error(`${url} should be valid`)
      assert.strictEqual(result.unwrap(), url)
    })
  })

  it("invalid image URL - empty", () => {
    assert.strictEqual(createSellerUrlImg(""), null)
  })
})
