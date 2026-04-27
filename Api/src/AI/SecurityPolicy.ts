import { Schema } from "../Database"

export type ActorContext =
  | { role: "GUEST" }
  | { role: "USER"; userId: string }
  | { role: "SELLER"; sellerId: string }
  | { role: "ADMIN"; adminId: string }

export type VectorScope = "PUBLIC" | "PARTICIPANT_PRIVATE" | "ADMIN_INTERNAL"

export type VectorDocumentMeta = {
  scope: VectorScope
  participantUserIds: string[]
  participantSellerIds: string[]
}

export type TableIngestionPolicy = {
  scope: VectorScope
  allowedColumns: string[]
  deniedColumns: string[]
}

type TableIngestionPolicyEntry = {
  table: keyof Schema
  policy: TableIngestionPolicy
}

type TableIngestionPolicyMap = Partial<Record<keyof Schema, TableIngestionPolicy>>

const GLOBAL_DENY_EXACT: string[] = [
  "password",
  "wallet",
  "tax",
  "withdrawn",
  "profit",
  "trackingcode",
  "address",
  "email",
  "apptransid",
  "previousid",
  "previouscreatedat",
]

const GLOBAL_DENY_PARTIAL: string[] = ["token", "refresh", "secret"]

const POLICY_ENTRIES: TableIngestionPolicyEntry[] = [
  {
    table: "category",
    policy: {
      scope: "PUBLIC",
      allowedColumns: [
        "id",
        "name",
        "slug",
        "parentId",
        "updatedAt",
        "createdAt",
      ],
      deniedColumns: [],
    },
  },
  {
    table: "product",
    policy: {
      scope: "PUBLIC",
      allowedColumns: [
        "id",
        "sellerId",
        "categoryId",
        "name",
        "price",
        "description",
        "attributes",
        "updatedAt",
        "createdAt",
      ],
      deniedColumns: [],
    },
  },
  {
    table: "productImage",
    policy: {
      scope: "PUBLIC",
      allowedColumns: ["id", "productID", "url", "updatedAt", "createdAt"],
      deniedColumns: [],
    },
  },
  {
    table: "product_variant",
    policy: {
      scope: "PUBLIC",
      allowedColumns: [
        "id",
        "productId",
        "name",
        "sku",
        "price",
        "stock",
        "updatedAt",
        "createdAt",
      ],
      deniedColumns: [],
    },
  },
  {
    table: "seller",
    policy: {
      scope: "PUBLIC",
      allowedColumns: [
        "id",
        "name",
        "shopName",
        "shopDescription",
        "verified",
        "vacationMode",
        "tier",
        "updatedAt",
        "createdAt",
      ],
      deniedColumns: ["email", "password", "wallet", "revenue", "withdrawn", "profit"],
    },
  },
  {
    table: "poster",
    policy: {
      scope: "PUBLIC",
      allowedColumns: [
        "id",
        "name",
        "description",
        "imageUrl",
        "imageScalePercent",
        "imageOffsetXPercent",
        "imageOffsetYPercent",
        "startDate",
        "endDate",
        "isPermanent",
        "updatedAt",
        "createdAt",
      ],
      deniedColumns: [],
    },
  },
  {
    table: "product_rating",
    policy: {
      scope: "PUBLIC",
      allowedColumns: [
        "orderId",
        "productId",
        "userId",
        "score",
        "feedback",
        "updatedAt",
        "createdAt",
      ],
      deniedColumns: [],
    },
  },
  {
    table: "conversation",
    policy: {
      scope: "PARTICIPANT_PRIVATE",
      allowedColumns: [
        "id",
        "user1Id",
        "user1Type",
        "user2Id",
        "user2Type",
        "createdAt",
        "updatedAt",
      ],
      deniedColumns: [],
    },
  },
  {
    table: "conversation_message",
    policy: {
      scope: "PARTICIPANT_PRIVATE",
      allowedColumns: [
        "id",
        "conversationId",
        "senderId",
        "senderType",
        "senderName",
        "text",
        "readAt",
        "createdAt",
      ],
      deniedColumns: [],
    },
  },
  {
    table: "order_payment",
    policy: {
      scope: "PARTICIPANT_PRIVATE",
      allowedColumns: [
        "id",
        "userId",
        "sellerId",
        "goodsSummary",
        "paymentMethod",
        "isPaid",
        "status",
        "price",
        "isSellerSettled",
        "settledAt",
        "createdAt",
        "updatedAt",
      ],
      deniedColumns: ["username", "address", "trackingCode"],
    },
  },
  {
    table: "order_payment_item",
    policy: {
      scope: "PARTICIPANT_PRIVATE",
      allowedColumns: [
        "id",
        "orderPaymentId",
        "productId",
        "variantId",
        "productName",
        "variantName",
        "quantity",
        "createdAt",
        "updatedAt",
      ],
      deniedColumns: [],
    },
  },
  {
    table: "report",
    policy: {
      scope: "PARTICIPANT_PRIVATE",
      allowedColumns: [
        "id",
        "sellerId",
        "userId",
        "orderId",
        "category",
        "title",
        "status",
        "updatedAt",
        "createdAt",
      ],
      deniedColumns: [
        "userDescription",
        "sellerDescription",
        "resultTextAdmin",
        "userUrlImgs",
        "sellerUrlImgs",
      ],
    },
  },
  {
    table: "seller_tier_policy",
    policy: {
      scope: "ADMIN_INTERNAL",
      allowedColumns: [
        "id",
        "silverProfitThreshold",
        "goldProfitThreshold",
        "bronzeTax",
        "silverTax",
        "goldTax",
        "updatedAt",
        "createdAt",
      ],
      deniedColumns: [],
    },
  },
  {
    table: "market_config",
    policy: {
      scope: "ADMIN_INTERNAL",
      allowedColumns: [
        "id",
        "reportWindowHours",
        "ratingReportMaxPerDay",
        "updatedAt",
        "createdAt",
      ],
      deniedColumns: [],
    },
  },
  {
    table: "product_rating_report",
    policy: {
      scope: "ADMIN_INTERNAL",
      allowedColumns: [
        "id",
        "orderId",
        "productId",
        "reporterSellerId",
        "reason",
        "detail",
        "status",
        "reviewedAt",
        "updatedAt",
        "createdAt",
      ],
      deniedColumns: [],
    },
  },
]

const POLICY_BY_TABLE: TableIngestionPolicyMap = _toPolicyMap(POLICY_ENTRIES)

export function getTablesEnabledForVectorIngestion(): Array<keyof Schema> {
  return POLICY_ENTRIES.map((entry) => entry.table)
}

export function isTableEnabledForVectorIngestion(table: keyof Schema): boolean {
  return getVectorIngestionPolicy(table) !== null
}

export function getVectorIngestionPolicy(
  table: keyof Schema,
): TableIngestionPolicy | null {
  const policy = POLICY_BY_TABLE[table]
  return policy === undefined ? null : policy
}

export function isColumnAllowedForVectorIngestion(
  table: keyof Schema,
  columnName: string,
): boolean {
  const policy = getVectorIngestionPolicy(table)
  if (policy === null) {
    return false
  }

  const normalized = _normalizeName(columnName)
  if (_isDeniedColumn(normalized, policy.deniedColumns)) {
    return false
  }

  return policy.allowedColumns.some((column) => {
    return _normalizeName(column) === normalized
  })
}

export function filterIngestionRow(
  table: keyof Schema,
  row: Record<string, unknown>,
): Record<string, unknown> {
  const filtered: Record<string, unknown> = {}

  Object.keys(row).forEach((columnName) => {
    if (isColumnAllowedForVectorIngestion(table, columnName)) {
      filtered[columnName] = row[columnName]
    }
  })

  return filtered
}

export function canActorReadVectorDocument(
  actor: ActorContext,
  metadata: VectorDocumentMeta,
): boolean {
  if (metadata.scope === "PUBLIC") {
    return true
  }

  if (metadata.scope === "ADMIN_INTERNAL") {
    return actor.role === "ADMIN"
  }

  if (metadata.scope === "PARTICIPANT_PRIVATE") {
    if (actor.role === "USER") {
      return metadata.participantUserIds.includes(actor.userId)
    }

    if (actor.role === "SELLER") {
      return metadata.participantSellerIds.includes(actor.sellerId)
    }

    return false
  }

  return false
}

function _toPolicyMap(entries: TableIngestionPolicyEntry[]): TableIngestionPolicyMap {
  const map: TableIngestionPolicyMap = {}

  entries.forEach((entry) => {
    map[entry.table] = entry.policy
  })

  return map
}

function _isDeniedColumn(columnName: string, tableDenyColumns: string[]): boolean {
  if (GLOBAL_DENY_EXACT.some((denied) => _normalizeName(denied) === columnName)) {
    return true
  }

  if (
    GLOBAL_DENY_PARTIAL.some((deniedPart) => {
      return columnName.includes(_normalizeName(deniedPart))
    })
  ) {
    return true
  }

  return tableDenyColumns.some((denied) => _normalizeName(denied) === columnName)
}

function _normalizeName(input: string): string {
  return input.trim().toLowerCase()
}
