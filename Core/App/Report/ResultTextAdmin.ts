import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"
import { createText1024, text1024Decoder } from "../../Data/Text"

const key: unique symbol = Symbol()
export type ResultTextAdmin = Opaque<string, typeof key>
export type ErrorResultTextAdmin = "INVALID_RESULT_TEXT_ADMIN"

export function createResultTextAdmin(s: string): Maybe<ResultTextAdmin> {
  return toMaybe(createResultTextAdminE(s))
}

export function createResultTextAdminE(
  s: string,
): Result<ErrorResultTextAdmin, ResultTextAdmin> {
  const text = createText1024(s)
  if (text == null) return err("INVALID_RESULT_TEXT_ADMIN")

  return ok(jsonValueCreate<string, typeof key>(key)(text.unwrap()))
}

export const resultTextAdminDecoder: JD.Decoder<ResultTextAdmin> =
  text1024Decoder.transform((text) => {
    return jsonValueCreate<string, typeof key>(key)(text.unwrap())
  })
