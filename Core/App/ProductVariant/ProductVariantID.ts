import * as JD from "decoders"
import { jsonValueCreate, Opaque } from "../../Data/Opaque"
import { createUUID, UUID, uuidDecoder } from "../../Data/UUID"

const key: unique symbol = Symbol()
export type ProductVariantID = Opaque<string, typeof key>
export type ErrorProductVariantID = "INVALID_PRODUCT_VARIANT_ID"

export function createProductVariantID(): ProductVariantID {
  return _create(createUUID())
}

export const productVariantIDDecoder: JD.Decoder<ProductVariantID> = uuidDecoder
  .describe("INVALID_PRODUCT_VARIANT_ID")
  .transform(_create)

function _create(uuid: UUID): ProductVariantID {
  return jsonValueCreate<string, typeof key>(key)(uuid.unwrap())
}

export function parseProductVariantID(str: string): ProductVariantID {
  return productVariantIDDecoder.verify(str)
}
