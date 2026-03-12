import * as JD from "decoders"
import { Opaque, jsonValueCreate } from "../../Data/Opaque"
import { Result, toMaybe, err, ok } from "../../Data/Result"
import { Maybe } from "../../Data/Maybe"
import { createNat, natDecoder } from "../../Data/Number/Nat"

const key: unique symbol = Symbol()
export type Wallet = Opaque<number, typeof key>
export type ErrorName = "INVALID_Wallet"

export function createWallet(s: number): Maybe<Wallet> {
  return toMaybe(createWalletE(s))
}

export function createWalletE(s: number): Result<ErrorName, Wallet> {
  const positiveInt = createNat(s)
  if (positiveInt == null) return err("INVALID_Wallet")

  return ok(jsonValueCreate<number, typeof key>(key)(positiveInt.unwrap()))
}

export const walletDecoder: JD.Decoder<Wallet> = natDecoder.transform(
  (natValue) => {
    return jsonValueCreate<number, typeof key>(key)(natValue.unwrap())
  },
)
