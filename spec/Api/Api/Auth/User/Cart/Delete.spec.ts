import { handler } from "../../../../../../Api/src/Api/Auth/User/Cart/Delete"
import { _createUser, _fromOk } from "../../../../../Fixture"
import { createProductID } from "../../../../../../Core/App/Product/ProductID"
import { createProductVariantID } from "../../../../../../Core/App/ProductVariant/ProductVariantID"
import {
  createProductWithVariant,
  createSeller,
  insertCartItem,
} from "../TestHelper"

describe("Api/Auth/User/Cart/Delete", () => {
  function callHandler(user: unknown, params: unknown) {
    return Reflect.apply(handler, null, [user, params])
  }

  test("returns deleted=true when cart item exists", async () => {
    const user = await _createUser("cart-delete-exists@example.com")
    const seller = await createSeller()
    const { productID, variantID } = await createProductWithVariant({
      sellerID: seller.id,
    })

    await insertCartItem({
      userID: user.id,
      productID,
      variantID,
      quantity: 2,
    })

    const payload = await callHandler(user, { productID, variantID }).then(
      _fromOk,
    )

    expect(payload.deleted).toBe(true)
  })

  test("returns deleted=false when cart item is absent", async () => {
    const user = await _createUser("cart-delete-absent@example.com")

    const payload = await callHandler(user, {
      productID: createProductID(),
      variantID: createProductVariantID(),
    }).then(_fromOk)

    expect(payload.deleted).toBe(false)
  })
})
