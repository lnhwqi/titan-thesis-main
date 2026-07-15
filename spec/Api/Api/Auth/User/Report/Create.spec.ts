import { handler } from "../../../../../../Api/src/Api/Auth/User/Report/Create"
import db from "../../../../../../Api/src/Database"
import { _createUser, _fromErr, _fromOk } from "../../../../../Fixture"
import { createOrderPaymentID } from "../../../../../../Core/App/OrderPayment/OrderPaymentID"
import { createSellerID } from "../../../../../../Core/App/Seller/SellerID"
import { reportCategoryDecoder } from "../../../../../../Core/App/Report/ReportCategory"
import { reportTitleDecoder } from "../../../../../../Core/App/Report/ReportTitle"
import { userDescriptionDecoder } from "../../../../../../Core/App/Report/UserDescription"
import { userUrlImgsDecoder } from "../../../../../../Core/App/Report/UserUrlImgs"
import {
  createOrder,
  createProductWithVariant,
  createSeller,
} from "../TestHelper"

describe("Api/Auth/User/Report/Create", () => {
  function callHandler(user: unknown, params: unknown) {
    return Reflect.apply(handler, null, [user, params])
  }

  test("returns SELLER_NOT_FOUND for invalid seller", async () => {
    const user = await _createUser("report-no-seller@example.com")

    const result = await callHandler(user, {
      sellerID: createSellerID(),
      orderID: createOrderPaymentID(),
      category: reportCategoryDecoder.verify("DEFECTIVE"),
      title: reportTitleDecoder.verify("Defective Product"),
      userDescription: userDescriptionDecoder.verify("Broken item"),
      userUrlImgs: userUrlImgsDecoder.verify([]),
    })

    expect(_fromErr(result)).toBe("SELLER_NOT_FOUND")
  })

  test("returns ORDER_NOT_OWNED_BY_USER when order belongs to another user", async () => {
    const owner = await _createUser("report-owner@example.com")
    const requester = await _createUser("report-requester@example.com")
    const seller = await createSeller()
    const { productID, variantID } = await createProductWithVariant({
      sellerID: seller.id,
    })

    const order = await createOrder({
      user: owner,
      sellerID: seller.id,
      status: "DELIVERED",
    })

    const result = await callHandler(requester, {
      sellerID: seller.id,
      orderID: order.id,
      category: reportCategoryDecoder.verify("DEFECTIVE"),
      title: reportTitleDecoder.verify("Defective Product"),
      userDescription: userDescriptionDecoder.verify("The item is damaged"),
      userUrlImgs: userUrlImgsDecoder.verify([]),
    })

    expect(productID.unwrap()).toBeDefined()
    expect(variantID.unwrap()).toBeDefined()
    expect(_fromErr(result)).toBe("ORDER_NOT_OWNED_BY_USER")
  })

  test("returns ORDER_NOT_REPORTABLE for non-reportable order status", async () => {
    const user = await _createUser("report-not-reportable@example.com")
    const seller = await createSeller()

    const order = await createOrder({
      user,
      sellerID: seller.id,
      status: "PAID",
    })

    const result = await callHandler(user, {
      sellerID: seller.id,
      orderID: order.id,
      category: reportCategoryDecoder.verify("WRONG_ITEM"),
      title: reportTitleDecoder.verify("Wrong Product"),
      userDescription: userDescriptionDecoder.verify("Wrong item shipped"),
      userUrlImgs: userUrlImgsDecoder.verify([]),
    })

    expect(_fromErr(result)).toBe("ORDER_NOT_REPORTABLE")
  })

  test("creates report and updates order status to REPORTED", async () => {
    const user = await _createUser("report-create-success@example.com")
    const seller = await createSeller()

    const order = await createOrder({
      user,
      sellerID: seller.id,
      status: "DELIVERED",
    })

    const payload = await callHandler(user, {
      sellerID: seller.id,
      orderID: order.id,
      category: reportCategoryDecoder.verify("DEFECTIVE"),
      title: reportTitleDecoder.verify("Defective Product"),
      userDescription: userDescriptionDecoder.verify("Battery not working"),
      userUrlImgs: userUrlImgsDecoder.verify(["https://img.example.com/evidence"]),
    }).then(_fromOk)

    const updatedOrder = await db
      .selectFrom("order_payment")
      .select(["status"])
      .where("id", "=", order.id.unwrap())
      .executeTakeFirstOrThrow()

    expect(payload.report.orderID.unwrap()).toBe(order.id.unwrap())
    expect(payload.report.status).toBe("OPEN")
    expect(updatedOrder.status).toBe("REPORTED")
  })
})
