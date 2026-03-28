import { Express } from "express"
import { publicApi } from "../Api/PublicApi"
import * as ListActive from "../Api/Public/Poster/ListActive"

export function posterRoutes(app: Express): void {
  publicApi(app, ListActive)
}
