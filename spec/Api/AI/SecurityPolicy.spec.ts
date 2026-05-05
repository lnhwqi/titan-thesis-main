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
  })

  test("row filtering keeps only allowed columns", () => {
    const row = {
      id: "order-id",
      userId: "user-id",
      sellerId: "seller-id",
      goodsSummary: "Some goods",
      address: "Very private address",
      isPaid: true,
    }

    const filtered = filterIngestionRow("order_payment", row, 3)

    expect(filtered.id).toBe("order-id")
    expect(filtered.userId).toBe("user-id")
    expect(filtered.sellerId).toBe("seller-id")
    expect(filtered.goodsSummary).toBe("Some goods")
    expect(filtered.address).toBeUndefined()
  })

  test("user private scope allows only matching owner", () => {
    const metadata: VectorDocumentMeta = {
      scope: "USER_PRIVATE",
      ownerId: "u-1",
      shopId: null,
    }

    expect(
      canActorReadVectorDocument({ role: "USER", userId: "u-1" }, metadata),
    ).toBe(true)
    expect(
      canActorReadVectorDocument({ role: "USER", userId: "u-2" }, metadata),
    ).toBe(false)
    expect(canActorReadVectorDocument({ role: "GUEST" }, metadata)).toBe(false)
  })

  test("seller private scope allows only matching shop", () => {
    const metadata: VectorDocumentMeta = {
      scope: "SELLER_PRIVATE",
      ownerId: null,
      shopId: "s-9",
    }

    expect(
      canActorReadVectorDocument({ role: "SELLER", sellerId: "s-9" }, metadata),
    ).toBe(true)
    expect(
      canActorReadVectorDocument({ role: "SELLER", sellerId: "s-2" }, metadata),
    ).toBe(false)
  })

  test("admin private scope allows only admin", () => {
    const metadata: VectorDocumentMeta = {
      scope: "ADMIN_PRIVATE",
      ownerId: null,
      shopId: null,
    }

    expect(
      canActorReadVectorDocument(
        { role: "ADMIN", adminId: "admin-1" },
        metadata,
      ),
    ).toBe(true)
    expect(
      canActorReadVectorDocument({ role: "USER", userId: "u-1" }, metadata),
    ).toBe(false)
  })

  test("phase 1 table list keeps ingestion public only", () => {
    const phaseOneTables = getTablesEnabledForVectorIngestion(1)
    expect(phaseOneTables.includes("product")).toBe(true)
    expect(phaseOneTables.includes("order_payment")).toBe(false)

    const phaseThreeTables = getTablesEnabledForVectorIngestion(3)
    expect(phaseThreeTables.includes("order_payment")).toBe(true)
  })

  test("policy lookup returns null for disabled table", () => {
    expect(getVectorIngestionPolicy("user")).toBeNull()
    const productPolicy = getVectorIngestionPolicy("product")
    expect(productPolicy).not.toBeNull()
    expect(productPolicy?.scope).toBe("PUBLIC")
  })
})
