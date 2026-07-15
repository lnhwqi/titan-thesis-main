import { handler } from "../../../../../../Api/src/Api/Auth/User/Cart/Add"
import { _createUser, _fromErr, _fromOk } from "../../../../../Fixture"
import { createProductID } from "../../../../../../Core/App/Product/ProductID"
import { createProductVariantID } from "../../../../../../Core/App/ProductVariant/ProductVariantID"
import { createProductWithVariant, createSeller } from "../TestHelper"

describe("Api/Auth/User/Cart/Add", () => {
  function callHandler(user: unknown, params: unknown) {
    return Reflect.apply(handler, null, [user, params])
  }

  test("returns PRODUCT_NOT_FOUND when product does not exist", async () => {
    const user = await _createUser("cart-add-not-found@example.com")

    const result = await callHandler(user, {
      productID: createProductID(),
      variantID: createProductVariantID(),
    })

    expect(_fromErr(result)).toBe("PRODUCT_NOT_FOUND")
  })

  test("returns VARIANT_NOT_FOUND when variant does not exist", async () => {
    const user = await _createUser("cart-add-no-variant@example.com")
    const seller = await createSeller()
    const { productID } = await createProductWithVariant({
      sellerID: seller.id,
    })

    const result = await callHandler(user, {
      productID,
      variantID: createProductVariantID(),
    })

    expect(_fromErr(result)).toBe("VARIANT_NOT_FOUND")
  })

  test("returns VARIANT_NOT_IN_PRODUCT for mismatched variant", async () => {
    const user = await _createUser("cart-add-mismatch@example.com")
    const seller = await createSeller()

    const { productID: productAID, variantID: variantAID } =
      await createProductWithVariant({
        sellerID: seller.id,
      })

    const { productID: productBID } = await createProductWithVariant({
      sellerID: seller.id,
    })

    expect(productAID.unwrap()).not.toBe(productBID.unwrap())

    const result = await callHandler(user, {
      productID: productBID,
      variantID: variantAID,
    })

    expect(_fromErr(result)).toBe("VARIANT_NOT_IN_PRODUCT")
  })

  test("adds item and increments quantity on repeated add", async () => {
    const user = await _createUser("cart-add-success@example.com")
    const seller = await createSeller()
    const { productID, variantID } = await createProductWithVariant({
      sellerID: seller.id,
      stock: 10,
    })

    const first = await callHandler(user, { productID, variantID }).then(_fromOk)
    const second = await callHandler(user, { productID, variantID }).then(_fromOk)

    expect(first.quantity).toBe(1)
    expect(second.quantity).toBe(2)
  })
})
