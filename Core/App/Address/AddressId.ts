import * as JD from "decoders"
import { jsonValueCreate, Opaque } from "../../Data/Opaque"
import { createUUID, UUID, uuidDecoder } from "../../Data/UUID"

const key: unique symbol = Symbol()
export type AddressID = Opaque<string, typeof key>
export type ErrorAddressID = "INVALID_ADDRESS_ID"

export function createAddressID(): AddressID {
  return _create(createUUID())
}

export const addressIDDecoder: JD.Decoder<AddressID> = uuidDecoder
  .describe("INVALID_ADDRESS_ID")
  .transform(_create)

// Purposely receive UUID to express AddressID is UUID
function _create(uuid: UUID): AddressID {
  return jsonValueCreate<string, typeof key>(key)(uuid.unwrap())
}
