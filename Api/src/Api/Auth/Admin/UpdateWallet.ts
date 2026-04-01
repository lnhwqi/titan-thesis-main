import * as API from "../../../../../Core/Api/Auth/Admin/UpdateWallet"
import { Result, err, ok } from "../../../../../Core/Data/Result"
import { AuthAdmin } from "../../AuthApi"
import * as AdminRow from "../../../Database/AdminRow"
import { toAdmin } from "../../../App/Admin"

export const contract = API.contract

export async function handler(
	admin: AuthAdmin,
	params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
	try {
		const updated = await AdminRow.updateWallet(admin.id, params.wallet)

		return ok({
			admin: toAdmin(updated),
		})
	} catch (_error: unknown) {
		return err("WALLET_UPDATE_FAILED")
	}
}
