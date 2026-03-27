import * as JD from "decoders"
import { jsonValueCreate, Opaque } from "../../Data/Opaque"
import { createUUID, UUID, uuidDecoder } from "../../Data/UUID"

const key: unique symbol = Symbol()
export type PosterID = Opaque<string, typeof key>
export type ErrorPosterID = "INVALID_POSTER_ID"

export function createPosterID(): PosterID {
  return _create(createUUID())
}

export const posterIDDecoder: JD.Decoder<PosterID> = uuidDecoder
  .describe("INVALID_POSTER_ID")
  .transform(_create)

function _create(uuid: UUID): PosterID {
  return jsonValueCreate<string, typeof key>(key)(uuid.unwrap())
}
