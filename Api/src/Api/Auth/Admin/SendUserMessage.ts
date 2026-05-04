import * as API from "../../../../../Core/Api/Auth/Admin/SendUserMessage"
import { Result, err, ok } from "../../../../../Core/Data/Result"
import * as UserRow from "../../../Database/UserRow"
import * as ConversationRow from "../../../Database/ConversationRow"
import * as ConversationMessageRow from "../../../Database/ConversationMessageRow"
import { AuthAdmin } from "../../AuthApi"

const SUPPORT_PARTICIPANT_ID = "00000000-0000-6000-8000-000000000001"

export const contract = API.contract

export async function handler(
  _admin: AuthAdmin,
  params: API.UrlParams & API.BodyParams,
): Promise<Result<API.ErrorCode, API.Payload>> {
  const userID = params.userID.unwrap()

  const user = await UserRow.getByID(params.userID)
  if (user === null) return err("USER_NOT_FOUND")

  try {
    let conversation = await ConversationRow.findBetween(
      userID,
      SUPPORT_PARTICIPANT_ID,
    )
    if (conversation === null) {
      conversation = await ConversationRow.create(
        userID,
        "USER",
        SUPPORT_PARTICIPANT_ID,
        "SELLER",
      )
    }

    await ConversationMessageRow.create({
      conversationId: conversation.id,
      senderId: SUPPORT_PARTICIPANT_ID,
      senderType: "SELLER",
      senderName: "Support",
      text: params.message,
    })

    await ConversationRow.touch(conversation.id)

    return ok({ success: true })
  } catch (_e: unknown) {
    return err("SEND_FAILED")
  }
}
