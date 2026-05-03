import * as RD from "../../../Core/Data/RemoteData"
import type { State } from "../State"
import { ApiError } from "../Api"
import { Poster } from "../../../Core/App/Poster"
import * as ListPosterApi from "../Api/Auth/Admin/ListPoster"
import * as CreatePosterApi from "../Api/Auth/Admin/CreatePoster"
import * as UpdatePosterApi from "../Api/Auth/Admin/UpdatePoster"
import * as DeletePosterApi from "../Api/Auth/Admin/DeletePoster"

export type AdminPosterState = {
  isUploadingImage: boolean
  name: string
  description: string
  eventContent: string
  imageUrl: string
  imageScalePercent: string
  imageOffsetXPercent: string
  imageOffsetYPercent: string
  startDate: string
  endDate: string
  isPermanent: boolean
  posters: Poster[]
  listResponse: RD.RemoteData<
    ApiError<ListPosterApi.ErrorCode>,
    ListPosterApi.Payload
  >
  createResponse: RD.RemoteData<
    ApiError<CreatePosterApi.ErrorCode>,
    CreatePosterApi.Payload
  >
  updateResponse: RD.RemoteData<
    ApiError<UpdatePosterApi.ErrorCode>,
    UpdatePosterApi.Payload
  >
  deleteResponse: RD.RemoteData<
    ApiError<DeletePosterApi.ErrorCode>,
    DeletePosterApi.Payload
  >
  editPosterID: string | null
  pendingDeletePosterID: string | null
  flashMessage: string | null
}

export function initAdminPosterState(): AdminPosterState {
  return {
    isUploadingImage: false,
    name: "",
    description: "",
    eventContent: "",
    imageUrl: "",
    imageScalePercent: "100",
    imageOffsetXPercent: "0",
    imageOffsetYPercent: "0",
    startDate: "",
    endDate: "",
    isPermanent: false,
    posters: [],
    listResponse: RD.notAsked(),
    createResponse: RD.notAsked(),
    updateResponse: RD.notAsked(),
    deleteResponse: RD.notAsked(),
    editPosterID: null,
    pendingDeletePosterID: null,
    flashMessage: null,
  }
}

export function _AdminPosterState(
  state: State,
  adminPoster: Partial<AdminPosterState>,
): State {
  return {
    ...state,
    adminPoster: { ...state.adminPoster, ...adminPoster },
  }
}
