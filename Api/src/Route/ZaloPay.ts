import { Express } from "express"
import * as ZaloPayCallback from "../Api/Public/User/ZaloPayCallback"

export function zaloPayRoutes(app: Express): void {
  app.post("/zalopay/callback", ZaloPayCallback.handler)
}
