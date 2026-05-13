import express from "express"
import { json, static as serveStatic, type Express, urlencoded } from "express"
import cors from "cors"
import { createServer } from "http"
import { routes } from "./Route"
import ENV from "./Env"
import { HttpLogger } from "./Logger"
import { ensureUploadsDir, uploadsRoot } from "./Uploads"
import { initializeSocketIO } from "./Socket"
import { startSupportMetricsPersistence } from "./AI/SupportMetricsPersistence"
import { initCoinRainScheduler } from "./CoinRainScheduler"

const app: Express = express()
const { APP_PORT, NODE_ENV } = ENV

function resolveCorsOrigins(): string | string[] {
  const raw = (process.env.CORS_ORIGIN ?? process.env.FRONTEND_URL ?? "").trim()
  if (raw === "") {
    return "*"
  }

  if (raw === "*") {
    return "*"
  }

  const origins = raw
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)

  return origins.length <= 1 ? (origins[0] ?? "*") : origins
}

const corsOrigins = resolveCorsOrigins()

if (
  NODE_ENV === "development" ||
  process.env.CORS_ORIGIN != null ||
  process.env.FRONTEND_URL != null
) {
  // In staging/production this can be configured via CORS_ORIGIN/FRONTEND_URL.
  app.use(
    cors({
      origin: corsOrigins,
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      preflightContinue: false,
      optionsSuccessStatus: 204,
    }),
  )
}

// Logger agent
app.use(HttpLogger)

ensureUploadsDir()
app.use("/uploads", serveStatic(uploadsRoot))

// Set use json for all requests but request must have content-type application/json
// Recommended by ExpressJS
app.use(json({ limit: "25mb" }))
app.use(urlencoded({ extended: false }))

// All API routes are defined in this function
routes(app)

// Create HTTP server and initialize Socket.IO
const server = createServer(app)
const io = initializeSocketIO(server)
startSupportMetricsPersistence()
initCoinRainScheduler(io).catch(console.error)

server.listen(APP_PORT, () => {
  console.info(`⚡️[server]: Server is running at http://localhost:${APP_PORT}`)
})
