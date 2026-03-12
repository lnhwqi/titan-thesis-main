import * as JD from "decoders"
import { jsonValueCreate, Opaque } from "../../Data/Opaque"
import { createUUID, UUID, uuidDecoder } from "../../Data/UUID"

const key: unique symbol = Symbol()
export type SellerID = Opaque<string, typeof key>
export type ErrorSellerID = "INVALID_SELLER_ID"

export function createSellerID(): SellerID {
  return _create(createUUID())
}

export const sellerIDDecoder: JD.Decoder<SellerID> = uuidDecoder
  .describe("INVALID_SELLER_ID")
  .transform(_create)

// Purposely receive UUID to express SellerID is UUID
function _create(uuid: UUID): SellerID {
  return jsonValueCreate<string, typeof key>(key)(uuid.unwrap())
}
