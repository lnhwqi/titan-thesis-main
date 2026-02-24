import * as JD from "decoders"
import { jsonValueCreate, Opaque } from "../../Data/Opaque"
import { createUUID, UUID, uuidDecoder } from "../../Data/UUID"

const key: unique symbol = Symbol()
export type ImageID = Opaque<string, typeof key>
export type ErrorImageID = "INVALID_IMAGE_ID"

export function createImageID(): ImageID {
  return _create(createUUID())
}

export const imageIDDecoder: JD.Decoder<ImageID> = uuidDecoder
  .describe("INVALID_IMAGE_ID")
  .transform(_create)

// Purposely receive UUID to express UserID is UUID
function _create(uuid: UUID): ImageID {
  return jsonValueCreate<string, typeof key>(key)(uuid.unwrap())
}
