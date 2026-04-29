import type { Schema } from "../Database"

export type ActorContext =
  | { role: "GUEST" }
  | { role: "USER"; userId: string }
  | { role: "SELLER"; sellerId: string }
  | { role: "ADMIN"; adminId: string }

export type AIRagPhase = 1 | 2 | 3

export type VectorScope =
  | "PUBLIC"
  | "USER_PRIVATE"
  | "SELLER_PRIVATE"
  | "ADMIN_PRIVATE"

export type VectorDocumentMeta = {
  scope: VectorScope
  ownerId: string | null
  shopId: string | null
}

export type TableIngestionPolicy = {
  scope: VectorScope
  allowedColumns: string[]
  deniedColumns: string[]
  minimumPhase: AIRagPhase
}

type TableIngestionPolicyEntry = {
  table: keyof Schema
  policy: TableIngestionPolicy
}

type TableIngestionPolicyMap = Partial<
  Record<keyof Schema, TableIngestionPolicy>
>

const GLOBAL_DENY_EXACT: string[] = [
  "password",
  "passwordhash",
  "email",
  "phone",
  "phonenumber",
  "address",
  "wallet",
  "walletbalance",
  "bank",
  "bankname",
  "banknumber",
  "bankaccount",
  "tax",
  "taxid",
  "taxcode",
  "taxsecret",
  "jwt",
  "refreshtoken",
  "userrefreshtoken",
  "sellerrefreshtoken",
  "adminrefreshtoken",
  "internalmoderationnote",
  "resulttextadmin",
  "trackingcode",
  "apptransid",
  "previousid",
  "previouscreatedat",
]

const GLOBAL_DENY_PARTIAL: string[] = [
  "token",
  "refresh",
  "jwt",
  "password",
  "secret",
  "email",
  "phone",
  "address",
  "wallet",
  "bank",
  "tax",
  "moderation",
]

const POLICY_ENTRIES: TableIngestionPolicyEntry[] = [
  {
    table: "category",
    policy: {
      scope: "PUBLIC",
      minimumPhase: 1,
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
      minimumPhase: 1,
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
      minimumPhase: 1,
      allowedColumns: ["id", "productID", "url", "updatedAt", "createdAt"],
      deniedColumns: [],
    },
  },
  {
    table: "product_variant",
    policy: {
      scope: "PUBLIC",
      minimumPhase: 1,
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
      minimumPhase: 1,
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
      deniedColumns: [
        "email",
        "password",
        "wallet",
        "revenue",
        "withdrawn",
        "profit",
        "tax",
      ],
    },
  },
  {
    table: "poster",
    policy: {
      scope: "PUBLIC",
      minimumPhase: 1,
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
    table: "voucher",
    policy: {
      scope: "PUBLIC",
      minimumPhase: 1,
      allowedColumns: [
        "id",
        "code",
        "name",
        "discount",
        "limit",
        "usedCount",
        "minOrderValue",
        "active",
        "expiredDate",
        "updatedAt",
        "createdAt",
      ],
      deniedColumns: [],
    },
  },
  {
    table: "market_config",
    policy: {
      scope: "PUBLIC",
      minimumPhase: 1,
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
    table: "order_payment",
    policy: {
      scope: "USER_PRIVATE",
      minimumPhase: 3,
      allowedColumns: [
        "id",
        "userId",
        "sellerId",
        "goodsSummary",
        "paymentMethod",
        "isPaid",
        "status",
        "isSellerSettled",
        "settledAt",
        "createdAt",
        "updatedAt",
      ],
      deniedColumns: ["username", "address", "trackingCode", "price"],
    },
  },
  {
    table: "report",
    policy: {
      scope: "USER_PRIVATE",
      minimumPhase: 3,
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
]

const POLICY_BY_TABLE: TableIngestionPolicyMap = _toPolicyMap(POLICY_ENTRIES)

export function getCurrentRagPhase(): AIRagPhase {
  const raw = process.env.AI_RAG_PHASE ?? "1"
  const parsed = Number(raw)

  if (!Number.isFinite(parsed)) {
    return 1
  }

  if (parsed <= 1) {
    return 1
  }

  if (parsed >= 3) {
    return 3
  }

  return 2
}

export function getTablesEnabledForVectorIngestion(
  phase: AIRagPhase = getCurrentRagPhase(),
): Array<keyof Schema> {
  return POLICY_ENTRIES.filter(
    (entry) => entry.policy.minimumPhase <= phase,
  ).map((entry) => entry.table)
}

export function isTableEnabledForVectorIngestion(
  table: keyof Schema,
  phase: AIRagPhase = getCurrentRagPhase(),
): boolean {
  return getVectorIngestionPolicy(table, phase) !== null
}

export function getVectorIngestionPolicy(
  table: keyof Schema,
  phase: AIRagPhase = getCurrentRagPhase(),
): TableIngestionPolicy | null {
  const policy = POLICY_BY_TABLE[table]
  if (policy === undefined) {
    return null
  }

  return policy.minimumPhase <= phase ? policy : null
}

export function isColumnAllowedForVectorIngestion(
  table: keyof Schema,
  columnName: string,
  phase: AIRagPhase = getCurrentRagPhase(),
): boolean {
  const policy = getVectorIngestionPolicy(table, phase)
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
  phase: AIRagPhase = getCurrentRagPhase(),
): Record<string, unknown> {
  const filtered: Record<string, unknown> = {}

  Object.keys(row).forEach((columnName) => {
    if (isColumnAllowedForVectorIngestion(table, columnName, phase)) {
      filtered[columnName] = row[columnName]
    }
  })

  return filtered
}

export function canActorReadVectorDocument(
  actor: ActorContext,
  metadata: VectorDocumentMeta,
): boolean {
  const normalizedScope = normalizeVectorScope(metadata.scope)

  if (normalizedScope === "PUBLIC") {
    return true
  }

  if (normalizedScope === "USER_PRIVATE") {
    return actor.role === "USER" && metadata.ownerId === actor.userId
  }

  if (normalizedScope === "SELLER_PRIVATE") {
    return actor.role === "SELLER" && metadata.shopId === actor.sellerId
  }

  if (normalizedScope === "ADMIN_PRIVATE") {
    return actor.role === "ADMIN"
  }

  return false
}

export function getReadableScopesForActor(
  actor: ActorContext,
  phase: AIRagPhase = getCurrentRagPhase(),
): VectorScope[] {
  if (phase === 1) {
    return ["PUBLIC"]
  }

  if (phase === 2) {
    if (actor.role === "USER") {
      return ["PUBLIC", "USER_PRIVATE"]
    }

    if (actor.role === "SELLER") {
      return ["PUBLIC", "SELLER_PRIVATE"]
    }

    return ["PUBLIC"]
  }

  if (actor.role === "USER") {
    return ["PUBLIC", "USER_PRIVATE"]
  }

  if (actor.role === "SELLER") {
    return ["PUBLIC", "SELLER_PRIVATE"]
  }

  if (actor.role === "ADMIN") {
    return ["PUBLIC", "ADMIN_PRIVATE"]
  }

  return ["PUBLIC"]
}

export function normalizeVectorScope(value: string): VectorScope {
  switch (_normalizeName(value)) {
    case "public":
      return "PUBLIC"
    case "user_private":
      return "USER_PRIVATE"
    case "seller_private":
      return "SELLER_PRIVATE"
    case "admin_private":
      return "ADMIN_PRIVATE"
    case "admin_internal":
      return "ADMIN_PRIVATE"
    case "participant_private":
      return "ADMIN_PRIVATE"
    default:
      return "ADMIN_PRIVATE"
  }
}

function _toPolicyMap(
  entries: TableIngestionPolicyEntry[],
): TableIngestionPolicyMap {
  const map: TableIngestionPolicyMap = {}

  entries.forEach((entry) => {
    map[entry.table] = entry.policy
  })

  return map
}

function _isDeniedColumn(
  columnName: string,
  tableDenyColumns: string[],
): boolean {
  if (
    GLOBAL_DENY_EXACT.some((denied) => _normalizeName(denied) === columnName)
  ) {
    return true
  }

  if (
    GLOBAL_DENY_PARTIAL.some((deniedPart) => {
      return columnName.includes(_normalizeName(deniedPart))
    })
  ) {
    return true
  }

  return tableDenyColumns.some(
    (denied) => _normalizeName(denied) === columnName,
  )
}

function _normalizeName(input: string): string {
  return input.trim().toLowerCase()
}
