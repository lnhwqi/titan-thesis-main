import { handler } from "../../../../../../Api/src/Api/Auth/User/Report/ListMine"
import * as ReportRow from "../../../../../../Api/src/Database/ReportRow"
import { _createUser, _fromOk } from "../../../../../Fixture"
import { createReportID } from "../../../../../../Core/App/Report"
import { reportCategoryDecoder } from "../../../../../../Core/App/Report/ReportCategory"
import { reportTitleDecoder } from "../../../../../../Core/App/Report/ReportTitle"
import { userDescriptionDecoder } from "../../../../../../Core/App/Report/UserDescription"
import { userUrlImgsDecoder } from "../../../../../../Core/App/Report/UserUrlImgs"
import {
  createOrder,
  createProductWithVariant,
  createSeller,
} from "../TestHelper"

describe("Api/Auth/User/Report/ListMine", () => {
  test("lists only reports created by current user", async () => {
    const userA = await _createUser("report-list-a@example.com")
    const userB = await _createUser("report-list-b@example.com")
    const seller = await createSeller()

    const { productID, variantID } = await createProductWithVariant({
      sellerID: seller.id,
    })

    const orderA = await createOrder({
      user: userA,
      sellerID: seller.id,
      status: "DELIVERED",
    })

    const orderB = await createOrder({
      user: userB,
      sellerID: seller.id,
      status: "DELIVERED",
    })

    await ReportRow.create({
      id: createReportID(),
      sellerId: seller.id,
      userId: userA.id,
      orderId: orderA.id,
      category: reportCategoryDecoder.verify("DEFECTIVE"),
      title: reportTitleDecoder.verify("Defective Product"),
      userDescription: userDescriptionDecoder.verify("Display has dead pixels"),
      userUrlImgs: userUrlImgsDecoder.verify([]),
      status: "OPEN",
    })

    await ReportRow.create({
      id: createReportID(),
      sellerId: seller.id,
      userId: userB.id,
      orderId: orderB.id,
      category: reportCategoryDecoder.verify("WRONG_ITEM"),
      title: reportTitleDecoder.verify("Wrong Product"),
      userDescription: userDescriptionDecoder.verify("Received wrong color"),
      userUrlImgs: userUrlImgsDecoder.verify([]),
      status: "OPEN",
    })

    const payload = await handler(userA, {}).then(_fromOk)

    expect(productID.unwrap()).toBeDefined()
    expect(variantID.unwrap()).toBeDefined()
    expect(payload.reports).toHaveLength(1)
    expect(payload.reports[0].userID.unwrap()).toBe(userA.id.unwrap())
  })
})
