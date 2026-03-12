import * as JD from "decoders"
import { jsonValueCreate, Opaque } from "../../Data/Opaque"
import { createUUID, UUID, uuidDecoder } from "../../Data/UUID"

const key: unique symbol = Symbol()
export type AdminID = Opaque<string, typeof key>
export type ErrorAdminID = "INVALID_ADMIN_ID"

export function createAdminID(): AdminID {
  return _create(createUUID())
}

export const adminIDDecoder: JD.Decoder<AdminID> = uuidDecoder
  .describe("INVALID_ADMIN_ID")
  .transform(_create)

// Purposely receive UUID to express AdminID is UUID
function _create(uuid: UUID): AdminID {
  return jsonValueCreate<string, typeof key>(key)(uuid.unwrap())
}
