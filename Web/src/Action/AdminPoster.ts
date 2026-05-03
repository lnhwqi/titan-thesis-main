import * as RD from "../../../Core/Data/RemoteData"
import { Action, cmd } from "../Action"
import { _AdminPosterState } from "../State/AdminPoster"
import * as CreatePosterApi from "../Api/Auth/Admin/CreatePoster"
import * as UpdatePosterApi from "../Api/Auth/Admin/UpdatePoster"
import * as DeletePosterApi from "../Api/Auth/Admin/DeletePoster"
import * as ListPosterApi from "../Api/Auth/Admin/ListPoster"
import * as UploadPosterImageApi from "../Api/Auth/Admin/UploadPosterImage"
import * as SDate from "../../../Core/Data/Time/SDate"

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024

export function onEnterRoute(): Action {
  return (state) => [
    _AdminPosterState(state, {
      listResponse: RD.loading(),
      createResponse: RD.notAsked(),
      updateResponse: RD.notAsked(),
      deleteResponse: RD.notAsked(),
      flashMessage: null,
    }),
    cmd(ListPosterApi.call().then(onListResponse)),
  ]
}

export function reloadPosterList(): Action {
  return (state) => [
    _AdminPosterState(state, { listResponse: RD.loading() }),
    cmd(ListPosterApi.call().then(onListResponse)),
  ]
}

export function onChangeName(value: string): Action {
  return (state) => [_AdminPosterState(state, { name: value }), cmd()]
}

export function onChangeDescription(value: string): Action {
  return (state) => [_AdminPosterState(state, { description: value }), cmd()]
}

export function onChangeEventContent(value: string): Action {
  return (state) => [_AdminPosterState(state, { eventContent: value }), cmd()]
}

export function onChangeImageUrl(value: string): Action {
  return (state) => [_AdminPosterState(state, { imageUrl: value }), cmd()]
}

export function uploadPosterImage(file: File): Action {
  return (state) => {
    if (file.type.startsWith("image/") === false) {
      return [
        _AdminPosterState(state, {
          flashMessage: "Only image files are allowed.",
        }),
        cmd(),
      ]
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return [
        _AdminPosterState(state, {
          flashMessage: "Image must be smaller than 2 MB.",
        }),
        cmd(),
      ]
    }

    return [
      _AdminPosterState(state, {
        isUploadingImage: true,
        flashMessage: null,
      }),
      cmd(
        readFileAsDataUrl(file)
          .then((payload) => UploadPosterImageApi.call({ file: payload }))
          .then(onUploadPosterImageResponse)
          .catch(() => onUploadPosterImageReadFailed()),
      ),
    ]
  }
}

export function onChangeImageScalePercent(value: string): Action {
  return (state) => [
    _AdminPosterState(state, { imageScalePercent: value }),
    cmd(),
  ]
}

export function onChangeImageOffsetXPercent(value: string): Action {
  return (state) => [
    _AdminPosterState(state, { imageOffsetXPercent: value }),
    cmd(),
  ]
}

export function onChangeImageOffsetYPercent(value: string): Action {
  return (state) => [
    _AdminPosterState(state, { imageOffsetYPercent: value }),
    cmd(),
  ]
}

export function onChangeStartDate(value: string): Action {
  return (state) => [_AdminPosterState(state, { startDate: value }), cmd()]
}

export function onChangeEndDate(value: string): Action {
  return (state) => [_AdminPosterState(state, { endDate: value }), cmd()]
}

export function onChangePermanent(value: boolean): Action {
  return (state) => [
    _AdminPosterState(state, {
      isPermanent: value,
      endDate: value ? "" : state.adminPoster.endDate,
    }),
    cmd(),
  ]
}

export function clearFlashMessage(): Action {
  return (state) => [_AdminPosterState(state, { flashMessage: null }), cmd()]
}

export function startEditPoster(id: string): Action {
  return (state) => {
    const poster = state.adminPoster.posters.find(
      (item) => item.id.unwrap() === id,
    )
    if (poster == null) {
      return [
        _AdminPosterState(state, {
          flashMessage: "Poster not found.",
        }),
        cmd(),
      ]
    }

    return [
      _AdminPosterState(state, {
        editPosterID: id,
        name: poster.name.unwrap(),
        description: poster.description.unwrap(),
        eventContent: poster.eventContent,
        imageUrl: poster.imageUrl.unwrap(),
        imageScalePercent: String(poster.imageScalePercent),
        imageOffsetXPercent: String(poster.imageOffsetXPercent),
        imageOffsetYPercent: String(poster.imageOffsetYPercent),
        startDate: SDate.toString(poster.startDate),
        endDate: poster.endDate == null ? "" : SDate.toString(poster.endDate),
        isPermanent: poster.isPermanent,
        flashMessage: null,
      }),
      cmd(),
    ]
  }
}

export function cancelEditPoster(): Action {
  return (state) => [
    _AdminPosterState(state, {
      isUploadingImage: false,
      editPosterID: null,
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
      updateResponse: RD.notAsked(),
    }),
    cmd(),
  ]
}

export function submitCreatePoster(): Action {
  return (state) => {
    const decode = CreatePosterApi.paramsDecoder.decode(
      buildBodyInput(state.adminPoster),
    )
    if (decode.ok === false) {
      return [
        _AdminPosterState(state, {
          flashMessage: "Invalid poster input. Please check required fields.",
        }),
        cmd(),
      ]
    }

    return [
      _AdminPosterState(state, {
        createResponse: RD.loading(),
        flashMessage: null,
      }),
      cmd(CreatePosterApi.call(decode.value).then(onCreateResponse)),
    ]
  }
}

export function submitUpdatePoster(): Action {
  return (state) => {
    const id = state.adminPoster.editPosterID
    if (id == null) {
      return [state, cmd()]
    }

    const decodedURL = UpdatePosterApi.urlParamsDecoder.decode({ id })
    const decodedBody = UpdatePosterApi.bodyParamsDecoder.decode(
      buildBodyInput(state.adminPoster),
    )

    if (decodedURL.ok === false || decodedBody.ok === false) {
      return [
        _AdminPosterState(state, {
          flashMessage: "Invalid update input. Please check required fields.",
        }),
        cmd(),
      ]
    }

    return [
      _AdminPosterState(state, {
        updateResponse: RD.loading(),
        flashMessage: null,
      }),
      cmd(
        UpdatePosterApi.call(decodedURL.value, decodedBody.value).then(
          onUpdateResponse,
        ),
      ),
    ]
  }
}

export function requestDeletePoster(id: string): Action {
  return (state) => [
    _AdminPosterState(state, {
      pendingDeletePosterID: id,
      deleteResponse: RD.notAsked(),
    }),
    cmd(),
  ]
}

export function cancelDeletePoster(): Action {
  return (state) => [
    _AdminPosterState(state, {
      pendingDeletePosterID: null,
      deleteResponse: RD.notAsked(),
    }),
    cmd(),
  ]
}

export function confirmDeletePoster(): Action {
  return (state) => {
    const id = state.adminPoster.pendingDeletePosterID
    if (id == null) {
      return [state, cmd()]
    }

    const decode = DeletePosterApi.paramsDecoder.decode({ id })

    if (decode.ok === false) {
      return [
        _AdminPosterState(state, {
          pendingDeletePosterID: null,
          flashMessage: "Invalid poster id.",
        }),
        cmd(),
      ]
    }

    return [
      _AdminPosterState(state, {
        deleteResponse: RD.loading(),
      }),
      cmd(DeletePosterApi.call(decode.value).then(onDeleteResponse)),
    ]
  }
}

function onListResponse(response: ListPosterApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _AdminPosterState(state, {
          listResponse: RD.failure(response.error),
          flashMessage: ListPosterApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    return [
      _AdminPosterState(state, {
        posters: response.value.posters,
        listResponse: RD.success(response.value),
      }),
      cmd(),
    ]
  }
}

function onCreateResponse(response: CreatePosterApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _AdminPosterState(state, {
          createResponse: RD.failure(response.error),
          flashMessage: CreatePosterApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    return [
      _AdminPosterState(state, {
        createResponse: RD.success(response.value),
        isUploadingImage: false,
        flashMessage: "Poster created successfully.",
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
      }),
      cmd(ListPosterApi.call().then(onListResponse)),
    ]
  }
}

function onUpdateResponse(response: UpdatePosterApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _AdminPosterState(state, {
          updateResponse: RD.failure(response.error),
          flashMessage: UpdatePosterApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    return [
      _AdminPosterState(state, {
        updateResponse: RD.success(response.value),
        isUploadingImage: false,
        flashMessage: "Poster updated successfully.",
        editPosterID: null,
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
      }),
      cmd(ListPosterApi.call().then(onListResponse)),
    ]
  }
}

function onDeleteResponse(response: DeletePosterApi.Response): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _AdminPosterState(state, {
          deleteResponse: RD.failure(response.error),
          flashMessage: DeletePosterApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    return [
      _AdminPosterState(state, {
        pendingDeletePosterID: null,
        deleteResponse: RD.success(response.value),
        flashMessage: "Poster deleted successfully.",
      }),
      cmd(ListPosterApi.call().then(onListResponse)),
    ]
  }
}

function readFileAsDataUrl(
  file: File,
): Promise<UploadPosterImageApi.UploadImageFile> {
  return new Promise<UploadPosterImageApi.UploadImageFile>(
    (resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result !== "string") {
          reject(new Error("Invalid file result"))
          return
        }

        resolve({
          name: file.name,
          type: file.type,
          dataUrl: reader.result,
        })
      }
      reader.onerror = () =>
        reject(reader.error ?? new Error("Failed to read file"))
      reader.readAsDataURL(file)
    },
  )
}

function onUploadPosterImageResponse(
  response: UploadPosterImageApi.Response,
): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _AdminPosterState(state, {
          isUploadingImage: false,
          flashMessage: UploadPosterImageApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    return [
      _AdminPosterState(state, {
        isUploadingImage: false,
        imageUrl: response.value.url.unwrap(),
      }),
      cmd(),
    ]
  }
}

function onUploadPosterImageReadFailed(): Action {
  return (state) => [
    _AdminPosterState(state, {
      isUploadingImage: false,
      flashMessage: "Unable to read selected file.",
    }),
    cmd(),
  ]
}

function buildBodyInput(adminPoster: {
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
}): {
  name: string
  description: string
  eventContent: string
  imageUrl: string
  imageScalePercent: number
  imageOffsetXPercent: number
  imageOffsetYPercent: number
  startDate: string
  endDate: string | null
  isPermanent: boolean
} {
  return {
    name: adminPoster.name.trim(),
    description: adminPoster.description.trim(),
    eventContent: adminPoster.eventContent.trim(),
    imageUrl: adminPoster.imageUrl.trim(),
    imageScalePercent: Number(adminPoster.imageScalePercent),
    imageOffsetXPercent: Number(adminPoster.imageOffsetXPercent),
    imageOffsetYPercent: Number(adminPoster.imageOffsetYPercent),
    startDate: adminPoster.startDate,
    endDate: adminPoster.isPermanent ? null : adminPoster.endDate,
    isPermanent: adminPoster.isPermanent,
  }
}
