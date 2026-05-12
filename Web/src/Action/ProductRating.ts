import { Action, cmd } from "../Action"
import { _ProductRatingState } from "../State/ProductRating"
import * as UserCreateRatingApi from "../Api/Auth/User/ProductRating/Create"
import * as UserListRatingApi from "../Api/Auth/User/ProductRating/ListMine"
import {
  OrderPaymentID,
  orderPaymentIDDecoder,
} from "../../../Core/App/OrderPayment/OrderPaymentID"
import {
  ProductID,
  productIDDecoder,
} from "../../../Core/App/Product/ProductID"
import { ratingDecoder } from "../../../Core/App/Product/Rating"
import { ratingFeedbackDecoder } from "../../../Core/App/ProductRating"
import * as RD from "../../../Core/Data/RemoteData"

export function clearFlashMessage(): Action {
  return (state) => [_ProductRatingState(state, { flashMessage: null }), cmd()]
}

export function loadUserRatings(): Action {
  return (state) => [
    state,
    cmd(UserListRatingApi.call().then(onLoadUserRatingsResponse)),
  ]
}

export function onChangeScore(key: string, value: string): Action {
  return (state) => [
    _ProductRatingState(state, {
      scoreDraftByKey: { ...state.productRating.scoreDraftByKey, [key]: value },
      flashMessage: null,
    }),
    cmd(),
  ]
}

export function onChangeFeedback(key: string, value: string): Action {
  return (state) => [
    _ProductRatingState(state, {
      feedbackDraftByKey: {
        ...state.productRating.feedbackDraftByKey,
        [key]: value,
      },
      flashMessage: null,
    }),
    cmd(),
  ]
}

export function submitRating(orderID: string, productID: string): Action {
  return (state) => {
    const key = `${orderID}:${productID}`

    // Check if user has already rated this product
    if (state.productRating.userRatings[key] != null) {
      return [
        _ProductRatingState(state, {
          flashMessage: "You have already rated this product.",
        }),
        cmd(),
      ]
    }

    const scoreRaw = Number(state.productRating.scoreDraftByKey[key] ?? "0")
    const feedbackRaw =
      state.productRating.feedbackDraftByKey[key]?.trim() || null

    const parsedTarget = parseRatingTarget(orderID, productID)
    if (parsedTarget == null) {
      return [
        _ProductRatingState(state, {
          flashMessage: "Invalid order or product ID.",
        }),
        cmd(),
      ]
    }

    const parsedScore = parseRatingScore(scoreRaw)
    if (parsedScore == null) {
      return [
        _ProductRatingState(state, {
          flashMessage: "Rating score must be between 1 and 5.",
        }),
        cmd(),
      ]
    }

    const feedbackResult = parseRatingFeedback(feedbackRaw)
    if (feedbackResult._t === "Err") {
      return [
        _ProductRatingState(state, {
          flashMessage: "Feedback text is too long.",
        }),
        cmd(),
      ]
    }

    return [
      _ProductRatingState(state, {
        ratingKey: key,
        createResponse: RD.loading(),
        flashMessage: null,
      }),
      cmd(
        UserCreateRatingApi.call({
          orderID: parsedTarget.orderID,
          productID: parsedTarget.productID,
          score: parsedScore,
          feedback: feedbackResult.feedback,
        }).then((response) => onCreateRatingResponse(key, response)),
      ),
    ]
  }
}

function onCreateRatingResponse(
  key: string,
  response: UserCreateRatingApi.Response,
): Action {
  return (state) => {
    if (response._t === "Err") {
      return [
        _ProductRatingState(state, {
          ratingKey: null,
          createResponse: RD.failure(response.error),
          flashMessage: UserCreateRatingApi.errorString(response.error),
        }),
        cmd(),
      ]
    }

    return [
      _ProductRatingState(state, {
        ratingKey: null,
        createResponse: RD.success(response.value),
        userRatings: {
          ...state.productRating.userRatings,
          [key]: response.value.rating,
        },
        scoreDraftByKey: {
          ...state.productRating.scoreDraftByKey,
          [key]: "",
        },
        feedbackDraftByKey: {
          ...state.productRating.feedbackDraftByKey,
          [key]: "",
        },
        flashMessage: `Rating submitted! Score: ${response.value.rating.score.unwrap()}/5`,
      }),
      cmd(),
    ]
  }
}

export function onLoadUserRatingsResponse(
  response: UserListRatingApi.Response,
): Action {
  return (state) => {
    if (response._t === "Err") {
      return [state, cmd()]
    }
    type SingleRating = (typeof response.value.ratings)[number]
    const userRatingsByKey: Record<string, SingleRating> = Object.fromEntries(
      response.value.ratings.map((rating) => [
        `${rating.orderID.unwrap()}:${rating.productID.unwrap()}`,
        rating,
      ]),
    )

    return [
      _ProductRatingState(state, {
        userRatings: userRatingsByKey,
      }),
      cmd(),
    ]
  }
}

function parseRatingTarget(
  orderID: string,
  productID: string,
): { orderID: OrderPaymentID; productID: ProductID } | null {
  try {
    return {
      orderID: orderPaymentIDDecoder.verify(orderID),
      productID: productIDDecoder.verify(productID),
    }
  } catch (_e) {
    return null
  }
}

function parseRatingScore(
  value: number,
): UserCreateRatingApi.BodyParams["score"] | null {
  try {
    return ratingDecoder.verify(value)
  } catch (_e) {
    return null
  }
}

type FeedbackParseResult =
  | { _t: "Ok"; feedback: UserCreateRatingApi.BodyParams["feedback"] }
  | { _t: "Err" }

function parseRatingFeedback(raw: string | null): FeedbackParseResult {
  if (raw == null) {
    return { _t: "Ok", feedback: null }
  }

  try {
    return { _t: "Ok", feedback: ratingFeedbackDecoder.verify(raw) }
  } catch (_e) {
    return { _t: "Err" }
  }
}
