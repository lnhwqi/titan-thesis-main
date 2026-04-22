import { createUserUrlImg } from "../../../../Core/App/Report/UserUrlImgs"
import { _fromErr } from "../../../Fixture/Result"

describe("App/Report/UserUrlImgs", () => {
  it("valid image URL", () => {
    ;["https://example.com/img.jpg", "/uploads/img.png"].forEach((url) => {
      const result = createUserUrlImg(url)
      if (result == null) throw new Error(`${url} should be valid`)
      assert.strictEqual(result.unwrap(), url)
    })
  })

  it("invalid image URL - empty", () => {
    assert.strictEqual(createUserUrlImg(""), null)
  })
})
