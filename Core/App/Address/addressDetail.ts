import * as JD from "decoders"
import { jsonValueCreate, Opaque } from "../../Data/Opaque"
import { createText100, text100Decoder } from "../../Data/Text"
import { Result, toMaybe, err, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"

const key: unique symbol = Symbol()
export type AddressDetail = Opaque<string, typeof key>
export type ErrorAddressDetail = "INVALID_ADDRESS_DETAIL"

export function createAddressDetail(s: string): Maybe<AddressDetail> {
  return toMaybe(createAddressDetailE(s))
}

export function createAddressDetailE(
  s: string,
): Result<ErrorAddressDetail, AddressDetail> {
  const text100 = createText100(s)
  if (text100 == null) return err("INVALID_ADDRESS_DETAIL")

  return ok(jsonValueCreate<string, typeof key>(key)(text100.unwrap()))
}

export const addressDetailDecoder: JD.Decoder<AddressDetail> =
  text100Decoder.transform((text100) => {
    return jsonValueCreate<string, typeof key>(key)(text100.unwrap())
  })
