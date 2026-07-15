import { handler } from "../../../../../../Api/src/Api/Auth/User/Wishlist/Save"
import { handler as listHandler } from "../../../../../../Api/src/Api/Auth/User/Wishlist/List"
import { _createUser, _fromErr, _fromOk } from "../../../../../Fixture"
import { createProductID } from "../../../../../../Core/App/Product/ProductID"
import { createProductWithVariant, createSeller } from "../TestHelper"

describe("Api/Auth/User/Wishlist/Save", () => {
  function callHandler(user: unknown, params: unknown) {
    return Reflect.apply(handler, null, [user, params])
  }

  test("returns PRODUCT_NOT_FOUND when product does not exist", async () => {
    const user = await _createUser("wishlist-save-not-found@example.com")

    const result = await callHandler(user, {
      productID: createProductID(),
    })

    expect(_fromErr(result)).toBe("PRODUCT_NOT_FOUND")
  })

  test("saves product to wishlist", async () => {
    const user = await _createUser("wishlist-save-success@example.com")
    const seller = await createSeller()
    const { productID } = await createProductWithVariant({ sellerID: seller.id })

    const payload = await callHandler(user, { productID }).then(_fromOk)
    const listPayload = await listHandler(user, {}).then(_fromOk)

    expect(payload.productID.unwrap()).toBe(productID.unwrap())
    expect(listPayload.productIDs.map((x) => x.unwrap())).toContain(
      productID.unwrap(),
    )
  })

  test("is idempotent for the same product", async () => {
    const user = await _createUser("wishlist-save-idempotent@example.com")
    const seller = await createSeller()
    const { productID } = await createProductWithVariant({ sellerID: seller.id })

    await callHandler(user, { productID }).then(_fromOk)
    await callHandler(user, { productID }).then(_fromOk)

    const listPayload = await listHandler(user, {}).then(_fromOk)

    expect(listPayload.productIDs).toHaveLength(1)
    expect(listPayload.productIDs[0].unwrap()).toBe(productID.unwrap())
  })
})
