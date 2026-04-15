import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"
import { createText1024, text1024Decoder } from "../../Data/Text"

const key: unique symbol = Symbol()
export type SummaryGoods = Opaque<string, typeof key>
export type ErrorSummaryGoods = "INVALID_SUMMARY_GOODS"

export function createSummaryGoods(s: string): Maybe<SummaryGoods> {
  return toMaybe(createSummaryGoodsE(s))
}

export function createSummaryGoodsE(
  s: string,
): Result<ErrorSummaryGoods, SummaryGoods> {
  const text100 = createText1024(s)
  if (text100 == null) return err("INVALID_SUMMARY_GOODS")

  return ok(jsonValueCreate<string, typeof key>(key)(text100.unwrap()))
}

export const summaryGoodsDecoder: JD.Decoder<SummaryGoods> =
  text1024Decoder.transform((text1024) => {
    return jsonValueCreate<string, typeof key>(key)(text1024.unwrap())
  })
