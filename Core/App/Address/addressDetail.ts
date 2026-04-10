import * as JD from "decoders"
import { jsonValueCreate, Opaque } from "../../Data/Opaque"
import { createText100, text100Decoder } from "../../Data/Text"
import { Result, toMaybe, err, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"

const key: unique symbol = Symbol()
export type AddressDetailID = Opaque<string, typeof key>
export type ErrorAddressDetailID = "INVALID_ADDRESS_ID"

export function createAddressDetail(s: string): Maybe<AddressDetailID> {
  return toMaybe(createAddressDetailE(s))
}

export function createAddressDetailE(
  s: string,
): Result<ErrorAddressDetailID, AddressDetailID> {
  const text100 = createText100(s)
  if (text100 == null) return err("INVALID_ADDRESS_ID")

  return ok(jsonValueCreate<string, typeof key>(key)(text100.unwrap()))
}

export const addressDetailIDDecoder: JD.Decoder<AddressDetailID> =
  text100Decoder.transform((text100) => {
    return jsonValueCreate<string, typeof key>(key)(text100.unwrap())
  })
