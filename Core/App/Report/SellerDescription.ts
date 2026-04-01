import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"
import { createText1024, text1024Decoder } from "../../Data/Text"

const key: unique symbol = Symbol()
export type SellerDescription = Opaque<string, typeof key>
export type ErrorSellerDescription = "INVALID_SELLER_DESCRIPTION"

export function createSellerDescription(s: string): Maybe<SellerDescription> {
  return toMaybe(createSellerDescriptionE(s))
}

export function createSellerDescriptionE(
  s: string,
): Result<ErrorSellerDescription, SellerDescription> {
  const text = createText1024(s)
  if (text == null) return err("INVALID_SELLER_DESCRIPTION")

  return ok(jsonValueCreate<string, typeof key>(key)(text.unwrap()))
}

export const sellerDescriptionDecoder: JD.Decoder<SellerDescription> =
  text1024Decoder.transform((text) => {
    return jsonValueCreate<string, typeof key>(key)(text.unwrap())
  })
