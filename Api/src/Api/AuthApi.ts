import * as JD from "decoders"
import * as Express from "express"
import { UrlRecord } from "../../../Core/Data/UrlToken"
import { Result, err, mapOk } from "../../../Core/Data/Result"
import {
  internalErr500,
  decodeParams,
  removeQuery,
  catchCallback,
  decoderErrorMessage,
  internalErrMessage,
  authOk200,
  authErr400,
  authInternalErr500,
  unauthorised,
} from "../Api"
import * as UserRow from "../Database/UserRow"
import * as SellerRow from "../Database/SellerRow"
import * as AdminRow from "../Database/AdminRow"
import { Method } from "../../../Core/Data/Api"
import { AuthApi, AuthResponseJson } from "../../../Core/Data/Api/Auth"

import * as AccessToken from "../App/AccessTokenUser"

import { userIDDecoder, UserID } from "../../../Core/App/User/UserID"
import { sellerIDDecoder, SellerID } from "../../../Core/App/Seller/SellerID"
import { adminIDDecoder, AdminID } from "../../../Core/App/Admin/AdminID"

export type AuthHandler<U, P, E, T> = (
  authUser: U,
  params: P,
) => Promise<Result<E, T>>

export type AuthUser = UserRow.UserRow
export type AuthSeller = SellerRow.SellerRow
export type AuthAdmin = AdminRow.AdminRow

export type AuthActor = AuthAdmin | AuthSeller | AuthUser

export function authApi<
  _A extends AuthActor,
  _ID,
  ApiMethod extends Method,
  Route extends string,
  UrlParams extends UrlRecord<Route>,
  RequestBody,
  ErrorCode,
  Payload,
>(
  app: Express.Express,
  api: {
    contract: AuthApi<
      _A,
      ApiMethod,
      Route,
      UrlParams,
      RequestBody,
      ErrorCode,
      Payload
    >
    handler: AuthHandler<_A, UrlParams & RequestBody, ErrorCode, Payload>
  },
  actorFetcher: (id: _ID) => Promise<_A | null>,
  idDecoder: JD.Decoder<_ID>,
): void {
  const { contract, handler } = api
  const { method, route, urlDecoder, bodyDecoder } = contract
  const expressRoute = removeQuery(route)

  const handlerRunner = catchCallback((req, res) => {
    const paramsResult = decodeParams(req, urlDecoder, bodyDecoder)
    return paramsResult._t === "Ok"
      ? runAuthHandler(
          paramsResult.value,
          handler,
          actorFetcher,
          idDecoder,
          req,
          res,
        )
      : internalErr500(
          res,
          paramsResult.error,
          decoderErrorMessage(req.query, paramsResult.error),
        )
  })

  switch (method) {
    case "GET":
      app.get(expressRoute, handlerRunner)
      break
    case "DELETE":
      app.delete(expressRoute, handlerRunner)
      break
    case "POST":
      app.post(expressRoute, handlerRunner)
      break
    case "PATCH":
      app.patch(expressRoute, handlerRunner)
      break
    case "PUT":
      app.put(expressRoute, handlerRunner)
      break
  }
}

async function runAuthHandler<_A, _ID, ErrorCode, Params, Payload>(
  params: Params,
  handler: AuthHandler<_A, Params, ErrorCode, Payload>,
  actorFetcher: (id: _ID) => Promise<_A | null>,
  idDecoder: JD.Decoder<_ID>,
  req: Express.Request,
  res: Express.Response<AuthResponseJson<ErrorCode, Payload>>,
): Promise<void> {
  const jwtPayloadResult = await verifyToken(req)
  if (jwtPayloadResult._t === "Err")
    return unauthorised(res, jwtPayloadResult.error)

  const payload = jwtPayloadResult.value

  // Type Guard 1: Đảm bảo payload thực sự là một Object chứ không phải null hay undefined
  if (typeof payload !== "object" || payload === null) {
    return unauthorised(res, "Invalid token payload structure")
  }

  // Type Guard 2: Trích xuất ID một cách an toàn nhất (Không dùng bất kỳ chữ 'any' hay 'as' nào)
  let rawId: string | null = null

  if ("actorID" in payload && typeof payload.actorID === "string") {
    rawId = payload.actorID
  } else if ("userID" in payload && typeof payload.userID === "string") {
    rawId = payload.userID
  } else if ("id" in payload && typeof payload.id === "string") {
    rawId = payload.id
  }

  if (rawId === null) {
    return unauthorised(res, "Token is missing actor identifier")
  }

  // Ép chuỗi string từ Token thành đúng Opaque Type (UserID/SellerID/AdminID)
  let parsedId: _ID
  try {
    parsedId = idDecoder.verify(rawId)
  } catch (e) {
    return unauthorised(res, `Invalid ID format in token: ${e}`)
  }

  // Lấy Actor từ DB bằng cái ID chuẩn
  const actor = await actorFetcher(parsedId)
  if (actor == null) {
    return unauthorised(res, `Invalid actor with id ${rawId}`)
  }

  return handler(actor, params)
    .then((result) => {
      return result._t === "Ok"
        ? authOk200(res, result.value)
        : authErr400(res, result.error)
    })
    .catch((error) => {
      return authInternalErr500(
        res,
        error,
        internalErrMessage("Handler Uncaught Exception", params, error),
      )
    })
}

// Trả về unknown, để phía trên xử lý Type Guard
async function verifyToken(
  req: Express.Request,
): Promise<Result<string, unknown>> {
  const { authorization } = req.headers
  if (authorization == null || authorization.startsWith("Bearer ") === false) {
    return err(`Invalid authorization header`)
  } else {
    const token = authorization.slice(7)
    return AccessToken.verify(token).then((result) => {
      return mapOk(result, (accessToken) => accessToken.unwrap())
    })
  }
}

// ---------------------------------------------------------------------------
// BỘ 3 MIDDLEWARE AUTH API CHUẨN CHỈNH CHO 3 ROLE
// ---------------------------------------------------------------------------

export const userAuthApi = <
  M extends Method,
  Route extends string,
  U extends UrlRecord<Route>,
  B,
  E,
  P,
>(
  app: Express.Express,
  api: {
    contract: AuthApi<AuthUser, M, Route, U, B, E, P>
    handler: AuthHandler<AuthUser, U & B, E, P>
  },
) =>
  authApi<AuthUser, UserID, M, Route, U, B, E, P>(
    app,
    api,
    UserRow.getByID,
    userIDDecoder,
  )

export const sellerAuthApi = <
  M extends Method,
  Route extends string,
  U extends UrlRecord<Route>,
  B,
  E,
  P,
>(
  app: Express.Express,
  api: {
    contract: AuthApi<AuthSeller, M, Route, U, B, E, P>
    handler: AuthHandler<AuthSeller, U & B, E, P>
  },
) =>
  authApi<AuthSeller, SellerID, M, Route, U, B, E, P>(
    app,
    api,
    async (id) => {
      const seller = await SellerRow.getByID(id)
      if (seller == null || seller.verified.unwrap() === false) {
        return null
      }
      return seller
    },
    sellerIDDecoder,
  )

export const adminAuthApi = <
  M extends Method,
  Route extends string,
  U extends UrlRecord<Route>,
  B,
  E,
  P,
>(
  app: Express.Express,
  api: {
    contract: AuthApi<AuthAdmin, M, Route, U, B, E, P>
    handler: AuthHandler<AuthAdmin, U & B, E, P>
  },
) =>
  authApi<AuthAdmin, AdminID, M, Route, U, B, E, P>(
    app,
    api,
    AdminRow.getByID,
    adminIDDecoder,
  )
