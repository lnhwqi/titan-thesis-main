import { handler } from "../../../../../../Api/src/Api/Auth/User/OrderPayment/ConfirmDelivery"
import { _createUser, _fromErr, _fromOk } from "../../../../../Fixture"
import {
  createOrder,
  createOrderWithItem,
  createProductWithVariant,
  createSeller,
} from "../TestHelper"

describe("Api/Auth/User/OrderPayment/ConfirmDelivery", () => {
  test("returns INVALID_STATUS_TRANSITION when order is not DELIVERED", async () => {
    const user = await _createUser("order-confirm-invalid@example.com")
    const seller = await createSeller()

    const order = await createOrder({
      user,
      sellerID: seller.id,
      status: "PAID",
    })

    const result = await handler(user, {
      id: order.id,
      decision: "RECEIVED",
    })

    expect(_fromErr(result)).toBe("INVALID_STATUS_TRANSITION")
  })

  test("updates status to RECEIVED for delivered order", async () => {
    const user = await _createUser("order-confirm-received@example.com")
    const seller = await createSeller()
    const { productID, variantID } = await createProductWithVariant({
      sellerID: seller.id,
    })

    const order = await createOrderWithItem({
      user,
      sellerID: seller.id,
      productID,
      variantID,
      status: "DELIVERED",
    })

    const payload = await handler(user, {
      id: order.id,
      decision: "RECEIVED",
    }).then(_fromOk)

    expect(payload.orderPayment.status).toBe("RECEIVED")
  })

  test("updates status to DELIVERY_ISSUE when user reports issue", async () => {
    const user = await _createUser("order-confirm-issue@example.com")
    const seller = await createSeller()
    const { productID, variantID } = await createProductWithVariant({
      sellerID: seller.id,
    })

    const order = await createOrderWithItem({
      user,
      sellerID: seller.id,
      productID,
      variantID,
      status: "DELIVERED",
    })

    const payload = await handler(user, {
      id: order.id,
      decision: "DELIVERY_ISSUE",
    }).then(_fromOk)

    expect(payload.orderPayment.status).toBe("DELIVERY_ISSUE")
  })
})
