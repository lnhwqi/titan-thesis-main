import * as API from "../../../../../Core/Api/Public/Address/GetProvince"
import * as JD from "decoders"
import { Result, ok, err } from "../../../../../Core/Data/Result"
import { NoUrlParams } from "../../../../../Core/Data/Api"
import ENV from "../../../Env"
import * as Logger from "../../../Logger"

export const contract = API.contract

export async function handler(
  _params: NoUrlParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  try {
    const response = await fetch(
      `${ENV.GHN_URL}/shiip/public-api/master-data/province`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Token: ENV.GHN_TOKEN,
        },
      },
    )

    const json: unknown = await response.json()
    const ghn = JD.object({ data: JD.unknown }).verify(json)
    if (ghn.data == null) return err("GHN_ERROR")
    const data = API.payloadDecoder.verify(ghn.data)
    return ok(data)
  } catch (e) {
    Logger.warn(`#address.getProvince GHN error: ${e}`)
    return err("GHN_ERROR")
  }
}
