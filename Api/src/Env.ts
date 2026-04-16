import * as JD from "decoders"
import { fromDecodeResult } from "../../Core/Data/Decoder"
import { numberStringDecoder } from "../../Core/Data/Number"

export type Env = {
  NODE_ENV: "test" | "development" | "production"
  APP_ENV: "test" | "development" | "staging" | "production"
  APP_PORT: number
  DB_HOST: string
  DB_PORT: number
  DB_USER: string
  DB_PASSWORD: string
  DB_DATABASE: string
  DB_MAX_POOL: number
  JWT_SECRET: string
  ZALO_APP_ID: string
  ZALO_KEY1: string
  ZALO_KEY2: string
  ZALO_CREATE_URL: string
  ZALO_QUERY_URL: string
  GHN_TOKEN: string
  GHN_URL: string
}

const decoder: JD.Decoder<Env> = JD.object({
  NODE_ENV: JD.oneOf(["test", "development", "production"]),
  APP_ENV: JD.oneOf(["test", "development", "staging", "production"]),
  APP_PORT: numberStringDecoder,
  DB_HOST: JD.string,
  DB_PORT: numberStringDecoder,
  DB_USER: JD.string,
  DB_PASSWORD: JD.string,
  DB_DATABASE: JD.string,
  DB_MAX_POOL: numberStringDecoder,
  JWT_SECRET: JD.string,
  ZALO_APP_ID: JD.string,
  ZALO_KEY1: JD.string,
  ZALO_KEY2: JD.string,
  ZALO_CREATE_URL: JD.string,
  ZALO_QUERY_URL: JD.string,
  GHN_TOKEN: JD.string,
  GHN_URL: JD.string,
})

// Private

// Loads the ENV
// Throws to kill server if it fails
function load(): Env | never {
  const env = {
    NODE_ENV: process.env.NODE_ENV,
    APP_ENV: process.env.APP_ENV,
    APP_PORT: process.env.APP_PORT,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_DATABASE: process.env.DB_DATABASE,
    DB_MAX_POOL: process.env.DB_MAX_POOL,
    JWT_SECRET: process.env.JWT_SECRET,
    ZALO_APP_ID: process.env.ZALO_APP_ID,
    ZALO_KEY1: process.env.ZALO_KEY1,
    ZALO_KEY2: process.env.ZALO_KEY2,
    ZALO_CREATE_URL: process.env.ZALO_CREATE_URL,
    ZALO_QUERY_URL: process.env.ZALO_QUERY_URL,
    GHN_TOKEN: process.env.GHN_TOKEN,
    GHN_URL: process.env.GHN_URL,
  }

  const result = fromDecodeResult(decoder.decode(env))
  if (result._t === "Ok") {
    return result.value
  } else {
    // Cannot use Logger because of cycle dependencies
    console.error("Env is malformed.")
    throw new Error(JD.formatInline(result.error))
  }
}

export default load()
