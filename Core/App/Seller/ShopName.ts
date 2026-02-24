import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"
import { createText100, text100Decoder } from "../../Data/Text"

const key: unique symbol = Symbol()
export type ShopName = Opaque<string, typeof key>
export type ErrorShopName = "INVALID_SHOP_NAME"

export function createShopName(s: string): Maybe<ShopName> {
  return toMaybe(createShopNameE(s))
}

export function createShopNameE(s: string): Result<ErrorShopName, ShopName> {
  const text100 = createText100(s)
  if (text100 == null) return err("INVALID_SHOP_NAME")

  return ok(jsonValueCreate<string, typeof key>(key)(text100.unwrap()))
}

export const shopNameDecoder: JD.Decoder<ShopName> = text100Decoder.transform(
  (text100) => {
    return jsonValueCreate<string, typeof key>(key)(text100.unwrap())
  },
)
