import { handler } from "../../../../../../Api/src/Api/Auth/User/Wishlist/Remove"
import { handler as saveHandler } from "../../../../../../Api/src/Api/Auth/User/Wishlist/Save"
import { handler as listHandler } from "../../../../../../Api/src/Api/Auth/User/Wishlist/List"
import { _createUser, _fromOk } from "../../../../../Fixture"
import { createProductID } from "../../../../../../Core/App/Product/ProductID"
import { createProductWithVariant, createSeller } from "../TestHelper"

describe("Api/Auth/User/Wishlist/Remove", () => {
  function callHandler(user: unknown, params: unknown) {
    return Reflect.apply(handler, null, [user, params])
  }

  function callSaveHandler(user: unknown, params: unknown) {
    return Reflect.apply(saveHandler, null, [user, params])
  }

  test("removes existing wishlist item", async () => {
    const user = await _createUser("wishlist-remove-success@example.com")
    const seller = await createSeller()
    const { productID } = await createProductWithVariant({ sellerID: seller.id })

    await callSaveHandler(user, { productID }).then(_fromOk)

    const payload = await callHandler(user, { productID }).then(_fromOk)
    const listPayload = await listHandler(user, {}).then(_fromOk)

    expect(payload.productID.unwrap()).toBe(productID.unwrap())
    expect(listPayload.productIDs).toHaveLength(0)
  })

  test("is safe when product is not in wishlist", async () => {
    const user = await _createUser("wishlist-remove-absent@example.com")
    const productID = createProductID()

    const payload = await callHandler(user, { productID }).then(_fromOk)

    expect(payload.productID.unwrap()).toBe(productID.unwrap())
  })
})
