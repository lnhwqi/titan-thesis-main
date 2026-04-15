// import * as JD from "decoders"
// import {Opaque, jsonValueCreate} from "../../Data/Opaque"
// import {Result, toMaybe, err, ok} from "../../Data/Result"
// import {Maybe} from "../../Data/Maybe"

// const key: unique symbol = Symbol()
// export type PaymentMethod = Opaque<string, typeof key>
// export type ErrorPaymentMethod = "INVALID_PAYMENT_METHOD"

// export type PaymentMethod = "ZALOPAY"

// export function createPaymentMethod(s: string): Maybe<PaymentMethod> {
//     return toMaybe(createPaymentMethodE(s))
// }

// export function createPaymentMethodE(
//     s: string,
// ): Result<ErrorPaymentMethod, PaymentMethod> {
//     if (s !== Payment) return err("INVALID_PAYMENT_METHOD")

//     return ok(jsonValueCreate<string, typeof key>(key)(s))
// }

// export const paymentMethodDecoder: JD.Decoder<PaymentMethod> = JD.oneOf(["ZALOPAY"]).transform((s) => {
//     return jsonValueCreate<string, typeof key>(key)(s)
// })

// const Payment = "ZALOPAY"
