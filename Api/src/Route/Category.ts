import { Express } from "express"
import { publicApi } from "../Api/PublicApi"
import * as GetList from "../Api/Public/Category/ListAll"
import * as GetByID from "../Api/Public/Category/GetOne"

export function categoryRoutes(app: Express): void {
  publicApi(app, GetList)
  publicApi(app, GetByID)
}
