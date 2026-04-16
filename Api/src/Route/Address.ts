import { Express } from "express"
import { publicApi } from "../Api/PublicApi"
import * as GetProvince from "../Api/Public/Address/GetProvince"
import * as GetDistrict from "../Api/Public/Address/GetDistrict"
import * as GetWard from "../Api/Public/Address/GetWard"

export function addressRoutes(app: Express): void {
  publicApi(app, GetProvince)
  publicApi(app, GetDistrict)
  publicApi(app, GetWard)
}
