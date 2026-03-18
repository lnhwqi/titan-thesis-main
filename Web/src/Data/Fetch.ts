import { err, ok, Result } from "../../../Core/Data/Result"
import * as Logger from "../Logger"

export type FetchError = "NETWORK_ERROR"
export type FetchData = { httpStatus: number; data: unknown }
export type FetchResult = Result<FetchError, FetchData>

export async function fetchE(
  url: string,
  options: RequestInit,
): Promise<FetchResult> {
  return fetch(url, options)
    .then(async (response) => {
      const raw = await response.text()
      const trimmed = raw.trim()
      const data: unknown =
        trimmed === ""
          ? null
          : (() => {
              try {
                return JSON.parse(trimmed)
              } catch {
                return raw
              }
            })()

      return ok({ httpStatus: response.status, data })
    })
    .catch((error) => {
      Logger.error(error)
      return err("NETWORK_ERROR")
    })
}
