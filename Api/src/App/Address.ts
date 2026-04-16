import { Address, addressDecoder } from "../../../Core/App/Address"

export function toAddressStorage(address: Address): string {
  return JSON.stringify({
    provinceCode: address.provinceCode.unwrap(),
    provinceName: address.provinceName.unwrap(),
    districtCode: address.districtCode.unwrap(),
    districtName: address.districtName.unwrap(),
    wardCode: address.wardCode.unwrap(),
    wardName: address.wardName.unwrap(),
    detail: address.detail.unwrap(),
  })
}

export function fromAddressStorage(raw: string): Address {
  try {
    return addressDecoder.verify(JSON.parse(raw))
  } catch {
    return addressDecoder.verify({
      provinceCode: "0",
      provinceName: raw || "Unknown",
      districtCode: "0",
      districtName: "Unknown",
      wardCode: "0",
      wardName: "Unknown",
      detail: raw || "Unknown",
    })
  }
}
