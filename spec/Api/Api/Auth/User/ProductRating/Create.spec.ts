import { handler } from "../../../../../../Api/src/Api/Auth/User/ProductRating/Create"
import { _createUser, _fromErr, _fromOk } from "../../../../../Fixture"
import { createOrderPaymentID } from "../../../../../../Core/App/OrderPayment/OrderPaymentID"
import { createProductID } from "../../../../../../Core/App/Product/ProductID"
import { ratingDecoder } from "../../../../../../Core/App/Product/Rating"
import { ratingFeedbackDecoder } from "../../../../../../Core/App/ProductRating"
import {
  createOrderWithItem,
  createProductWithVariant,
  createSeller,
} from "../TestHelper"

describe("Api/Auth/User/ProductRating/Create", () => {
  function callHandler(user: unknown, params: unknown) {
    return Reflect.apply(handler, null, [user, params])
  }

  test("returns ORDER_PAYMENT_NOT_FOUND for unknown order", async () => {
    const user = await _createUser("rating-order-not-found@example.com")

    const result = await callHandler(user, {
      orderID: createOrderPaymentID(),
      productID: createProductID(),
      score: ratingDecoder.verify(5),
      feedback: null,
    })

    expect(_fromErr(result)).toBe("ORDER_PAYMENT_NOT_FOUND")
  })

  test("returns ORDER_NOT_OWNED_BY_USER for foreign order", async () => {
    const owner = await _createUser("rating-owner@example.com")
    const requester = await _createUser("rating-requester@example.com")
    const seller = await createSeller()
    const { productID, variantID } = await createProductWithVariant({
      sellerID: seller.id,
    })

    const order = await createOrderWithItem({
      user: owner,
      sellerID: seller.id,
      productID,
      variantID,
    })

    const result = await callHandler(requester, {
      orderID: order.id,
      productID,
      score: ratingDecoder.verify(4),
      feedback: null,
    })

    expect(_fromErr(result)).toBe("ORDER_NOT_OWNED_BY_USER")
  })

  test("returns PRODUCT_NOT_IN_ORDER when product is not part of order", async () => {
    const user = await _createUser("rating-product-not-in-order@example.com")
    const seller = await createSeller()

    const { productID: orderedProductID, variantID: orderedVariantID } =
      await createProductWithVariant({
        sellerID: seller.id,
      })

    const { productID: anotherProductID } = await createProductWithVariant({
      sellerID: seller.id,
    })

    const order = await createOrderWithItem({
      user,
      sellerID: seller.id,
      productID: orderedProductID,
      variantID: orderedVariantID,
    })

    const result = await callHandler(user, {
      orderID: order.id,
      productID: anotherProductID,
      score: ratingDecoder.verify(3),
      feedback: null,
    })

    expect(_fromErr(result)).toBe("PRODUCT_NOT_IN_ORDER")
  })

  test("creates rating successfully", async () => {
    const user = await _createUser("rating-create-success@example.com")
    const seller = await createSeller()
    const { productID, variantID } = await createProductWithVariant({
      sellerID: seller.id,
    })

    const order = await createOrderWithItem({
      user,
      sellerID: seller.id,
      productID,
      variantID,
    })

    const payload = await callHandler(user, {
      orderID: order.id,
      productID,
      score: ratingDecoder.verify(5),
      feedback: ratingFeedbackDecoder.verify("Great quality"),
    }).then(_fromOk)

    expect(payload.rating.orderID.unwrap()).toBe(order.id.unwrap())
    expect(payload.rating.productID.unwrap()).toBe(productID.unwrap())
    expect(payload.rating.score.unwrap()).toBe(5)
    expect(payload.availability.canRate).toBe(true)
  })

  test("returns ALREADY_RATED_PRODUCT when user rates same order-product twice", async () => {
    const user = await _createUser("rating-duplicate@example.com")
    const seller = await createSeller()
    const { productID, variantID } = await createProductWithVariant({
      sellerID: seller.id,
    })

    const order = await createOrderWithItem({
      user,
      sellerID: seller.id,
      productID,
      variantID,
    })

    await callHandler(user, {
      orderID: order.id,
      productID,
      score: ratingDecoder.verify(4),
      feedback: null,
    }).then(_fromOk)

    const second = await callHandler(user, {
      orderID: order.id,
      productID,
      score: ratingDecoder.verify(2),
      feedback: null,
    })

    expect(_fromErr(second)).toBe("ALREADY_RATED_PRODUCT")
  })
})
