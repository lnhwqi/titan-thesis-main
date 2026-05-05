import { buildVectorDocumentDraft } from "../../../Api/src/AI/IngestionContract"

describe("Api/AI/IngestionContract", () => {
  test("returns null when table is not enabled for ingestion", () => {
    const draft = buildVectorDocumentDraft({
      source: {
        table: "user",
        rowId: "user-1",
        updatedAt: new Date("2026-04-27T00:00:00.000Z"),
      },
      row: {
        id: "user-1",
        email: "private@email.com",
      },
    })

    expect(draft).toBeNull()
  })

  test("builds sanitized draft and strips denied fields", () => {
    const draft = buildVectorDocumentDraft({
      source: {
        table: "order_payment",
        rowId: "order-1",
        updatedAt: new Date("2026-04-27T10:00:00.000Z"),
      },
      phase: 3,
      row: {
        id: "order-1",
        userId: "user-1",
        sellerId: "seller-1",
        goodsSummary: "Headphones",
        address: "private address",
        isPaid: true,
        status: "PAID",
      },
    })

    expect(draft).not.toBeNull()
    expect(draft?.access.scope).toBe("USER_PRIVATE")
    expect(draft?.access.ownerId).toBe("user-1")
    expect(draft?.access.shopId).toBeNull()
    expect(draft?.content.includes("goodsSummary: Headphones")).toBe(true)
    expect(draft?.content.includes("address")).toBe(false)
    expect(draft?.contentHash.length).toBe(64)
  })
})
