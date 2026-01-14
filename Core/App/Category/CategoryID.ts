import * as JD from "decoders"
import { jsonValueCreate, Opaque } from "../../Data/Opaque"
import { createUUID, UUID, uuidDecoder } from "../../Data/UUID"

const key: unique symbol = Symbol()
export type CategoryID = Opaque<string, typeof key>
export type ErrorCategoryID = "INVALID_CATEGORY_ID"

export function createProductID(): CategoryID {
  return _create(createUUID())
}

export const categoryIDDecoder: JD.Decoder<CategoryID> = uuidDecoder
  .describe("INVALID_PRODUCT_ID")
  .transform(_create)

// Purposely receive UUID to express UserID is UUID
function _create(uuid: UUID): CategoryID {
  return jsonValueCreate<string, typeof key>(key)(uuid.unwrap())
}
