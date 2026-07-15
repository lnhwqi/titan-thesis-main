import { handler } from "../../../../../../Api/src/Api/Auth/User/ProductRating/ListMine"
import { handler as createHandler } from "../../../../../../Api/src/Api/Auth/User/ProductRating/Create"
import { _createUser, _fromOk } from "../../../../../Fixture"
import { ratingDecoder } from "../../../../../../Core/App/Product/Rating"
import {
  createOrderWithItem,
  createProductWithVariant,
  createSeller,
} from "../TestHelper"

describe("Api/Auth/User/ProductRating/ListMine", () => {
  function callCreateHandler(user: unknown, params: unknown) {
    return Reflect.apply(createHandler, null, [user, params])
  }

  test("lists only ratings created by current user", async () => {
    const userA = await _createUser("rating-list-a@example.com")
    const userB = await _createUser("rating-list-b@example.com")
    const seller = await createSeller()

    const { productID, variantID } = await createProductWithVariant({
      sellerID: seller.id,
    })

    const orderA1 = await createOrderWithItem({
      user: userA,
      sellerID: seller.id,
      productID,
      variantID,
    })

    const orderA2 = await createOrderWithItem({
      user: userA,
      sellerID: seller.id,
      productID,
      variantID,
    })

    const orderB = await createOrderWithItem({
      user: userB,
      sellerID: seller.id,
      productID,
      variantID,
    })

    await callCreateHandler(userA, {
      orderID: orderA1.id,
      productID,
      score: ratingDecoder.verify(5),
      feedback: null,
    }).then(_fromOk)

    await callCreateHandler(userA, {
      orderID: orderA2.id,
      productID,
      score: ratingDecoder.verify(4),
      feedback: null,
    }).then(_fromOk)

    await callCreateHandler(userB, {
      orderID: orderB.id,
      productID,
      score: ratingDecoder.verify(3),
      feedback: null,
    }).then(_fromOk)

    const payload = await handler(userA, {}).then(_fromOk)

    expect(payload.ratings).toHaveLength(2)
    expect(payload.ratings.every((r) => r.userID.unwrap() === userA.id.unwrap())).toBe(
      true,
    )
  })
})
