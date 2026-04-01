import * as JD from "decoders"
import { jsonValueCreate, Opaque } from "../../Data/Opaque"
import { createUUID, UUID, uuidDecoder } from "../../Data/UUID"

const key: unique symbol = Symbol()
export type ReportID = Opaque<string, typeof key>
export type ErrorReportID = "INVALID_REPORT_ID"

export function createReportID(): ReportID {
  return _create(createUUID())
}

export const reportIDDecoder: JD.Decoder<ReportID> = uuidDecoder
  .describe("INVALID_REPORT_ID")
  .transform(_create)

function _create(uuid: UUID): ReportID {
  return jsonValueCreate<string, typeof key>(key)(uuid.unwrap())
}

export function parseReportID(str: string): ReportID {
  return reportIDDecoder.verify(str)
}
