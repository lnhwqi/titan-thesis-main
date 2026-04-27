import {
  canActorReadVectorDocument,
  filterIngestionRow,
  getTablesEnabledForVectorIngestion,
  getVectorIngestionPolicy,
  isColumnAllowedForVectorIngestion,
  isTableEnabledForVectorIngestion,
  VectorDocumentMeta,
} from "../../../Api/src/AI/SecurityPolicy"

describe("Api/AI/SecurityPolicy", () => {
  test("public table policy is enabled", () => {
    expect(isTableEnabledForVectorIngestion("product")).toBe(true)
    expect(isTableEnabledForVectorIngestion("user")).toBe(false)
  })

  test("allowed and denied columns are enforced", () => {
    expect(isColumnAllowedForVectorIngestion("seller", "shopName")).toBe(true)
    expect(isColumnAllowedForVectorIngestion("seller", "email")).toBe(false)
    expect(isColumnAllowedForVectorIngestion("seller", "password")).toBe(false)
    expect(isColumnAllowedForVectorIngestion("order_payment", "trackingCode")).toBe(
      false,
    )
  })

  test("row filtering keeps only allowed columns", () => {
    const row = {
      id: "order-id",
      userId: "user-id",
      sellerId: "seller-id",
      goodsSummary: "Some goods",
      address: "Very private address",
      trackingCode: "VN123456",
      isPaid: true,
    }

    const filtered = filterIngestionRow("order_payment", row)

    expect(filtered.id).toBe("order-id")
    expect(filtered.userId).toBe("user-id")
    expect(filtered.sellerId).toBe("seller-id")
    expect(filtered.goodsSummary).toBe("Some goods")
    expect(filtered.address).toBeUndefined()
    expect(filtered.trackingCode).toBeUndefined()
  })

  test("participant private scope allows only participants", () => {
    const metadata: VectorDocumentMeta = {
      scope: "PARTICIPANT_PRIVATE",
      participantUserIds: ["u-1"],
      participantSellerIds: ["s-2"],
    }

    expect(canActorReadVectorDocument({ role: "USER", userId: "u-1" }, metadata)).toBe(
      true,
    )
    expect(canActorReadVectorDocument({ role: "USER", userId: "u-2" }, metadata)).toBe(
      false,
    )
    expect(
      canActorReadVectorDocument({ role: "SELLER", sellerId: "s-2" }, metadata),
    ).toBe(true)
    expect(canActorReadVectorDocument({ role: "GUEST" }, metadata)).toBe(false)
  })

  test("admin internal scope allows only admin", () => {
    const metadata: VectorDocumentMeta = {
      scope: "ADMIN_INTERNAL",
      participantUserIds: [],
      participantSellerIds: [],
    }

    expect(
      canActorReadVectorDocument({ role: "ADMIN", adminId: "admin-1" }, metadata),
    ).toBe(true)
    expect(canActorReadVectorDocument({ role: "USER", userId: "u-1" }, metadata)).toBe(
      false,
    )
  })

  test("enabled table list contains protected participant tables", () => {
    const tables = getTablesEnabledForVectorIngestion()
    expect(tables.includes("conversation_message")).toBe(true)
    expect(tables.includes("order_payment")).toBe(true)
  })

  test("policy lookup returns null for disabled table", () => {
    expect(getVectorIngestionPolicy("user")).toBeNull()
    const productPolicy = getVectorIngestionPolicy("product")
    expect(productPolicy).not.toBeNull()
    expect(productPolicy?.scope).toBe("PUBLIC")
  })
})
