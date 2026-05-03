import { Express } from "express"
import { publicApi } from "../Api/PublicApi"
import * as ListActive from "../Api/Public/Poster/ListActive"
import * as GetByID from "../Api/Public/Poster/GetByID"

export function posterRoutes(app: Express): void {
  publicApi(app, ListActive)
  publicApi(app, GetByID)
}
