import { handler } from "../../../../../../Api/src/Api/Auth/User/Cart/UpdateQuantity"
import { _createUser, _fromErr, _fromOk } from "../../../../../Fixture"
import { createProductID } from "../../../../../../Core/App/Product/ProductID"
import { createProductVariantID } from "../../../../../../Core/App/ProductVariant/ProductVariantID"
import { noUrlParamsDecoder } from "../../../../../../Core/Data/Api"
import {
  createProductWithVariant,
  createSeller,
  insertCartItem,
} from "../TestHelper"

describe("Api/Auth/User/Cart/UpdateQuantity", () => {
  function withNoUrl<T extends Record<string, unknown>>(body: T) {
    return Object.assign({}, noUrlParamsDecoder.verify(null), body)
  }

  test("returns INVALID_QUANTITY for non-positive quantity", async () => {
    const user = await _createUser("cart-update-invalid@example.com")

    const result = await handler(user, withNoUrl({
      productID: createProductID(),
      variantID: createProductVariantID(),
      quantity: 0,
    }))

    expect(_fromErr(result)).toBe("INVALID_QUANTITY")
  })

  test("returns CART_ITEM_NOT_FOUND when item does not exist in cart", async () => {
    const user = await _createUser("cart-update-missing@example.com")
    const seller = await createSeller()
    const { productID, variantID } = await createProductWithVariant({
      sellerID: seller.id,
      stock: 10,
    })

    const result = await handler(user, withNoUrl({
      productID,
      variantID,
      quantity: 2,
    }))

    expect(_fromErr(result)).toBe("CART_ITEM_NOT_FOUND")
  })

  test("returns OUT_OF_STOCK when requested quantity exceeds stock", async () => {
    const user = await _createUser("cart-update-stock@example.com")
    const seller = await createSeller()
    const { productID, variantID } = await createProductWithVariant({
      sellerID: seller.id,
      stock: 3,
    })

    await insertCartItem({
      userID: user.id,
      productID,
      variantID,
      quantity: 1,
    })

    const result = await handler(user, withNoUrl({
      productID,
      variantID,
      quantity: 5,
    }))

    expect(_fromErr(result)).toBe("OUT_OF_STOCK")
  })

  test("updates quantity for existing cart item", async () => {
    const user = await _createUser("cart-update-success@example.com")
    const seller = await createSeller()
    const { productID, variantID } = await createProductWithVariant({
      sellerID: seller.id,
      stock: 10,
    })

    await insertCartItem({
      userID: user.id,
      productID,
      variantID,
      quantity: 1,
    })

    const payload = await handler(user, withNoUrl({
      productID,
      variantID,
      quantity: 4,
    })).then(_fromOk)

    expect(payload.quantity).toBe(4)
  })
})
