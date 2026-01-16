import * as JD from "decoders"
import { jsonValueCreate, Opaque } from "../../Data/Opaque"
import { createUUID, UUID, uuidDecoder } from "../../Data/UUID"

const key: unique symbol = Symbol()
export type ProductID = Opaque<string, typeof key>
export type ErrorProductID = "INVALID_PRODUCT_ID"

export function createProductID(): ProductID {
  return _create(createUUID())
}

export const productIDDecoder: JD.Decoder<ProductID> = uuidDecoder
  .describe("INVALID_PRODUCT_ID")
  .transform(_create)

function _create(uuid: UUID): ProductID {
  return jsonValueCreate<string, typeof key>(key)(uuid.unwrap())
}

export function parseProductID(str: string): ProductID {
  return productIDDecoder.verify(str)
}
