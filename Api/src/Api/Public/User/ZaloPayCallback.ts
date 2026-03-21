import * as crypto from "crypto"
import { Request, Response } from "express"
import ENV from "../../../Env"
import * as Logger from "../../../Logger"

type CallbackResponse = {
  return_code: number
  return_message: string
}

export function handler(req: Request, res: Response<CallbackResponse>): void {
  const data = req.body?.data
  const mac = req.body?.mac

  if (typeof data !== "string" || typeof mac !== "string") {
    returnReply(res, -1, "invalid payload")
    return
  }

  const expectedMac = crypto
    .createHmac("sha256", ENV.ZALO_KEY2)
    .update(data)
    .digest("hex")

  if (expectedMac !== mac) {
    Logger.warn("ZaloPay callback mac mismatch")
    returnReply(res, -1, "invalid mac")
    return
  }

  const parsed: unknown = parseJSON(data)
  if (typeof parsed !== "object" || parsed == null) {
    returnReply(res, -1, "invalid callback data")
    return
  }

  const appTransID = Reflect.get(parsed, "app_trans_id")
  const returnCode = Reflect.get(parsed, "status")

  Logger.log(
    `ZaloPay callback accepted appTransID=${String(appTransID)} status=${String(returnCode)}`,
  )

  returnReply(res, 1, "success")
}

function returnReply(
  res: Response<CallbackResponse>,
  returnCode: number,
  returnMessage: string,
): void {
  res.status(200)
  res.json({
    return_code: returnCode,
    return_message: returnMessage,
  })
}

function parseJSON(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch (_e) {
    return null
  }
}
