import { Express } from "express"
import { userRoutes } from "./Route/User"
import { sellerRoutes } from "./Route/Seller"
import { adminRoutes } from "./Route/Admin"
import { productRoutes } from "./Route/Product"
import { categoryRoutes } from "./Route/Category"
import { voucherRoute } from "./Route/Voucher"
import { zaloPayRoutes } from "./Route/ZaloPay"
import { posterRoutes } from "./Route/Poster"
import * as HealthCheck from "./Api/Public/HealthCheck"

/**
 * WARN We don't have a way to ensure that all route URLs are unique
 * or doesn't overwrite each other
 * Generally, the route URLs are name-spaced with Restful and/or Type-1
 * it should be fine
 */
export function routes(app: Express): void {
  // For status pinging
  app.get("/uptime", async (_req, res) => {
    res.status(200)
    res.send("ok")
    res.end()
  })

  // For internal use to check API server
  app.get("/healthcheck", async (_req, res) => {
    return HealthCheck.handler(res)
  })

  userRoutes(app)
  sellerRoutes(app)
  adminRoutes(app)
  productRoutes(app)
  categoryRoutes(app)
  posterRoutes(app)
  voucherRoute(app)
  zaloPayRoutes(app)
}
