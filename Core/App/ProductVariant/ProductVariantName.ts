import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, ok } from "../../Data/Result"
import { Maybe, throwIfNull } from "../../Data/Maybe"
import { createText100 } from "../../Data/Text"

const key: unique symbol = Symbol()
export type ProductVariantName = Opaque<string, typeof key>
export type ErrorProductVariantName = "INVALID_PRODUCT_VARIANT_NAME"

export function createProductVariantName(s: string): Maybe<ProductVariantName> {
  return toMaybe(createProductVariantNameE(s))
}

export function createProductVariantNameE(
  s: string,
): Result<ErrorProductVariantName, ProductVariantName> {
  const text100 = createText100(s)
  if (text100 == null) return err("INVALID_PRODUCT_VARIANT_NAME")

  return ok(jsonValueCreate<string, typeof key>(key)(text100.unwrap()))
}

export const productVariantNameDecoder: JD.Decoder<ProductVariantName> =
  JD.string.transform((s) => {
    return throwIfNull(
      createProductVariantName(s),
      `Invalid product variant name: ${s}`,
    )
  })
