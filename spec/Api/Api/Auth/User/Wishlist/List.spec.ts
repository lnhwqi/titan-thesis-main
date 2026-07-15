import { handler } from "../../../../../../Api/src/Api/Auth/User/Wishlist/List"
import { handler as saveHandler } from "../../../../../../Api/src/Api/Auth/User/Wishlist/Save"
import { _createUser, _fromOk } from "../../../../../Fixture"
import { createProductWithVariant, createSeller } from "../TestHelper"

describe("Api/Auth/User/Wishlist/List", () => {
  function callSaveHandler(user: unknown, params: unknown) {
    return Reflect.apply(saveHandler, null, [user, params])
  }

  test("returns empty list for new user", async () => {
    const user = await _createUser("wishlist-list-empty@example.com")

    const payload = await handler(user, {}).then(_fromOk)

    expect(payload.productIDs).toHaveLength(0)
  })

  test("returns only current user wishlist items", async () => {
    const userA = await _createUser("wishlist-list-a@example.com")
    const userB = await _createUser("wishlist-list-b@example.com")
    const seller = await createSeller()

    const { productID: productA } = await createProductWithVariant({
      sellerID: seller.id,
    })
    const { productID: productB } = await createProductWithVariant({
      sellerID: seller.id,
    })

    await callSaveHandler(userA, { productID: productA }).then(_fromOk)
    await callSaveHandler(userB, { productID: productB }).then(_fromOk)

    const payloadA = await handler(userA, {}).then(_fromOk)

    expect(payloadA.productIDs.map((x) => x.unwrap())).toEqual([
      productA.unwrap(),
    ])
  })
})
