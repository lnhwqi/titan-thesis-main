import * as JD from "decoders"
import { AddressDetail, addressDetailDecoder } from "./Address/addressDetail"
import { DistrictCode, districtCodeDecoder } from "./Address/districtCode"
import { ProvinceCode, provinceCodeDecoder } from "./Address/provinceCode"
import { WardCode, wardCodeDecoder } from "./Address/wardCode"
import { WardName, wardNameDecoder } from "./Address/wardName"
import { DistrictName, districtNameDecoder } from "./Address/districtName"
import { ProvinceName, provinceNameDecoder } from "./Address/provinceName"

export type Address = {
  provinceCode: ProvinceCode
  provinceName: ProvinceName
  districtCode: DistrictCode
  districtName: DistrictName
  wardCode: WardCode
  wardName: WardName
  detail: AddressDetail
}

export const addressDecoder: JD.Decoder<Address> = JD.object({
  provinceCode: provinceCodeDecoder,
  provinceName: provinceNameDecoder,
  districtCode: districtCodeDecoder,
  districtName: districtNameDecoder,
  wardCode: wardCodeDecoder,
  wardName: wardNameDecoder,
  detail: addressDetailDecoder,
})

export type OrderPaymentAddress = Address
export const orderPaymentAddressDecoder = addressDecoder

export function formatAddress(address: Address): string {
  return `${address.detail.unwrap()}, ${address.wardName.unwrap()}, ${address.districtName.unwrap()}, ${address.provinceName.unwrap()}`
}
