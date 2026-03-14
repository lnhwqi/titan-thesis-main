import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"

// Lấy type chuẩn từ thư viện
type JSONValue = JD.JSONValue
type JSONObject = JD.JSONObject

const key: unique symbol = Symbol()

export type ProductAttributes = Opaque<JSONObject, typeof key>
export type ErrorProductAttributes = "INVALID_PRODUCT_ATTRIBUTES"

export function createProductAttributes(
  obj: JSONObject,
): Maybe<ProductAttributes> {
  return toMaybe(createProductAttributesE(obj))
}

export function createProductAttributesE(
  obj: JSONObject,
): Result<ErrorProductAttributes, ProductAttributes> {
  return ok(jsonValueCreate<JSONObject, typeof key>(key)(obj))
}

const jsonValueDecoder: JD.Decoder<JSONValue> = JD.lazy(() =>
  JD.either(
    JD.string,
    JD.number,
    JD.boolean,
    JD.null_,
    JD.array(JD.lazy(() => jsonValueDecoder)),
    JD.record(JD.lazy(() => jsonValueDecoder)),
  ),
)

const rawAttributesDecoder = JD.optional(JD.record(jsonValueDecoder)).transform(
  (val) => val ?? {},
)

export const productAttributesDecoder: JD.Decoder<ProductAttributes> =
  rawAttributesDecoder.transform((rawObj) => {
    return jsonValueCreate<JSONObject, typeof key>(key)(rawObj)
  })
