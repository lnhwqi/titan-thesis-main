import { Express } from "express"
import { publicApi } from "../Api/PublicApi"
import * as GetList from "../Api/Public/Product/ListAll"
import * as GetByID from "../Api/Public/Product/GetOne"
import * as Search from "../Api/Public/Product/Search"

export function productRoutes(app: Express): void {
  publicApi(app, GetList)
  publicApi(app, GetByID)
  publicApi(app, Search)
}
