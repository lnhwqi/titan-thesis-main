import { handler } from "../../../../../../Api/src/Api/Auth/User/OrderPayment/Create"
import { _createUser, _fromErr, _fromOk } from "../../../../../Fixture"
import { activeDecoder } from "../../../../../../Core/App/User/Active"
import { createSellerID } from "../../../../../../Core/App/Seller/SellerID"
import { createProductID } from "../../../../../../Core/App/Product/ProductID"
import { createProductVariantID } from "../../../../../../Core/App/ProductVariant/ProductVariantID"
import {
  createProductWithVariant,
  createSampleAddress,
  createSeller,
  mustPrice,
} from "../TestHelper"

describe("Api/Auth/User/OrderPayment/Create", () => {
  function callHandler(user: unknown, params: unknown) {
    return Reflect.apply(handler, null, [user, params])
  }

  test("returns ACCOUNT_SUSPENDED for suspended user", async () => {
    const user = await _createUser("order-create-suspended@example.com", {
      active: activeDecoder.verify(false),
    })

    const result = await callHandler(user, {
      address: createSampleAddress(),
      panels: [],
      isPaid: false,
      paymentMethod: "ZALOPAY",
    })

    expect(_fromErr(result)).toBe("ACCOUNT_SUSPENDED")
  })

  test("returns INSUFFICIENT_WALLET when payment flags are inconsistent", async () => {
    const user = await _createUser("order-create-wallet-mismatch@example.com")

    const result = await callHandler(user, {
      address: createSampleAddress(),
      panels: [],
      isPaid: true,
      paymentMethod: "ZALOPAY",
    })

    expect(_fromErr(result)).toBe("INSUFFICIENT_WALLET")
  })

  test("returns SELLER_NOT_FOUND before order creation", async () => {
    const user = await _createUser("order-create-no-seller@example.com")

    const result = await callHandler(user, {
      address: createSampleAddress(),
      panels: [
        {
          sellerID: createSellerID(),
          price: mustPrice(10000),
          voucherID: null,
          items: [
            {
              productID: createProductID(),
              variantID: createProductVariantID(),
              quantity: 1,
            },
          ],
        },
      ],
      isPaid: false,
      paymentMethod: "ZALOPAY",
    })

    expect(_fromErr(result)).toBe("SELLER_NOT_FOUND")
  })

  test("creates unpaid order successfully with ZALOPAY method", async () => {
    const user = await _createUser("order-create-success@example.com")
    const seller = await createSeller()
    const { productID, variantID } = await createProductWithVariant({
      sellerID: seller.id,
      variantPrice: 10000,
      stock: 20,
    })

    const payload = await callHandler(user, {
      address: createSampleAddress(),
      panels: [
        {
          sellerID: seller.id,
          price: mustPrice(20000),
          voucherID: null,
          items: [
            {
              productID,
              variantID,
              quantity: 2,
            },
          ],
        },
      ],
      isPaid: false,
      paymentMethod: "ZALOPAY",
    }).then(_fromOk)

    expect(payload.orderPayments).toHaveLength(1)
    expect(payload.orderPayments[0].sellerID.unwrap()).toBe(seller.id.unwrap())
    expect(payload.orderPayments[0].isPaid).toBe(false)
    expect(payload.orderPayments[0].items).toHaveLength(1)
  })
})
