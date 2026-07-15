import { handler } from "../../../../../../Api/src/Api/Auth/User/OrderPayment/ListMine"
import { _createUser, _fromOk } from "../../../../../Fixture"
import {
  createOrderWithItem,
  createProductWithVariant,
  createSeller,
} from "../TestHelper"

describe("Api/Auth/User/OrderPayment/ListMine", () => {
  function callHandler(user: unknown, params: unknown) {
    return Reflect.apply(handler, null, [user, params])
  }

  test("lists only current user orders with totals", async () => {
    const userA = await _createUser("order-list-user-a@example.com")
    const userB = await _createUser("order-list-user-b@example.com")
    const seller = await createSeller()

    const { productID, variantID } = await createProductWithVariant({
      sellerID: seller.id,
      variantPrice: 10000,
      stock: 50,
    })

    await createOrderWithItem({
      user: userA,
      sellerID: seller.id,
      productID,
      variantID,
      quantity: 2,
      price: 20000,
    })

    await createOrderWithItem({
      user: userA,
      sellerID: seller.id,
      productID,
      variantID,
      quantity: 1,
      price: 10000,
    })

    await createOrderWithItem({
      user: userB,
      sellerID: seller.id,
      productID,
      variantID,
      quantity: 4,
      price: 40000,
    })

    const payload = await callHandler(userA, { page: 1, limit: 10 }).then(
      _fromOk,
    )

    expect(payload.orders).toHaveLength(2)
    expect(payload.totalCount).toBe(2)
    expect(payload.totalMoneyPaid).toBe(30000)
    expect(payload.totalProducts).toBe(3)
    expect(payload.page).toBe(1)
    expect(payload.limit).toBe(10)
  })

  test("normalizes invalid pagination params", async () => {
    const user = await _createUser("order-list-pagination@example.com")

    const payload = await callHandler(user, { page: 0, limit: 999 }).then(
      _fromOk,
    )

    expect(payload.page).toBe(1)
    expect(payload.limit).toBe(100)
  })
})
