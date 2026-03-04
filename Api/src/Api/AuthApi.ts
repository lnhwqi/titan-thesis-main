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

import { JwtPayload } from "../../../Core/App/BaseProfile/AccessToken"
import * as AccessToken from "../App/AccessToken"
import { UserID } from "../../../Core/App/BaseProfile/UserID"

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
  actorFetcher: (id: UserID) => Promise<_A | null>,
): void {
  const { contract, handler } = api
  const { method, route, urlDecoder, bodyDecoder } = contract
  const expressRoute = removeQuery(route)

  const handlerRunner = catchCallback((req, res) => {
    const paramsResult = decodeParams(req, urlDecoder, bodyDecoder)
    return paramsResult._t === "Ok"
      ? runAuthHandler(paramsResult.value, handler, actorFetcher, req, res)
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

async function runAuthHandler<_A, ErrorCode, Params, Payload>(
  params: Params,
  handler: AuthHandler<_A, Params, ErrorCode, Payload>,
  actorFetcher: (id: UserID) => Promise<_A | null>,
  req: Express.Request,
  res: Express.Response<AuthResponseJson<ErrorCode, Payload>>,
): Promise<void> {
  const jwtPayload = await verifyToken(req)
  if (jwtPayload._t === "Err") return unauthorised(res, jwtPayload.error)

  const { userID } = jwtPayload.value

  const actor = await actorFetcher(userID)
  if (actor == null) {
    return unauthorised(res, `Invalid actor with id ${userID.unwrap()}`)
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

async function verifyToken(
  req: Express.Request,
): Promise<Result<string, JwtPayload>> {
  const { authorization } = req.headers
  if (authorization == null || authorization.startsWith("Bearer ") === false) {
    return err(`Invalid authorization header: ${authorization}`)
  } else {
    const token = authorization.slice(7)
    return AccessToken.verify(token).then((result) => {
      return mapOk(result, (accessToken) => accessToken.unwrap())
    })
  }
}
