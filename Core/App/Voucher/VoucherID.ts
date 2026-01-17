import * as JD from "decoders"
import { jsonValueCreate, Opaque } from "../../Data/Opaque"
import { createUUID, UUID, uuidDecoder } from "../../Data/UUID"

const key: unique symbol = Symbol()
export type VoucherID = Opaque<string, typeof key>
export type ErrorUserID = "INVALID_USER_ID"

export function createVoucherID(): VoucherID {
  return _create(createUUID())
}

export const voucherIDDecoder: JD.Decoder<VoucherID> = uuidDecoder
  .describe("INVALID_VOUCHER_ID")
  .transform(_create)

// Purposely receive UUID to express UserID is UUID
function _create(uuid: UUID): VoucherID {
  return jsonValueCreate<string, typeof key>(key)(uuid.unwrap())
}
