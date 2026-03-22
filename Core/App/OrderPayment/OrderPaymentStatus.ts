import * as JD from "decoders"

export type OrderPaymentStatus =
  | "PAID"
  | "PACKED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "RECEIVED"
  | "DELIVERY_ISSUE"
  | "CANCELLED"

export const orderPaymentStatusDecoder: JD.Decoder<OrderPaymentStatus> =
  JD.oneOf([
    "PAID",
    "PACKED",
    "IN_TRANSIT",
    "DELIVERED",
    "RECEIVED",
    "DELIVERY_ISSUE",
    "CANCELLED",
  ])
