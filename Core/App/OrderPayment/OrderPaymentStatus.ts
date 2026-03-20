import * as JD from "decoders"

export type OrderPaymentStatus =
  | "PAID"
  | "PACKED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED"

export const orderPaymentStatusDecoder: JD.Decoder<OrderPaymentStatus> =
  JD.oneOf(["PAID", "PACKED", "IN_TRANSIT", "DELIVERED", "CANCELLED"])
