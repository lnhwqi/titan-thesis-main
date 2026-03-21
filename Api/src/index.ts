import express from "express"
import { json, static as serveStatic, type Express, urlencoded } from "express"
import cors from "cors"
import { routes } from "./Route"
import ENV from "./Env"
import { HttpLogger } from "./Logger"
import { ensureUploadsDir, uploadsRoot } from "./Uploads"

const app: Express = express()
const { APP_PORT, NODE_ENV } = ENV

if (NODE_ENV === "development") {
  // We enable CORS for all requests in NodeJS in development
  // as CORS will be handled externally (eg. by Nginx/API Gateway) in staging/production
  app.use(
    cors({
      origin: "*",
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

app.listen(APP_PORT, () => {
  console.info(`⚡️[server]: Server is running at http://localhost:${APP_PORT}`)
})
