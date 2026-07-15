import { afterEach, vi } from "vitest"
import { handler } from "../../../../../../Api/src/Api/Auth/User/Wallet/DepositQuery"
import db from "../../../../../../Api/src/Database"
import { _createUser, _fromErr, _fromOk } from "../../../../../Fixture"
import { createUUID } from "../../../../../../Core/Data/UUID"
import { insertWalletDeposit } from "../TestHelper"

describe("Api/Auth/User/Wallet/DepositQuery", () => {
  function callHandler(user: unknown, params: unknown) {
    return Reflect.apply(handler, null, [user, params])
  }

  function createZaloQueryResponse(returnCode: number, returnMessage: string) {
    return new Response(
      JSON.stringify({
        return_code: returnCode,
        return_message: returnMessage,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  }

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test("returns DEPOSIT_NOT_FOUND for unknown appTransID", async () => {
    const user = await _createUser("wallet-query-not-found@example.com")

    const result = await callHandler(user, {
      appTransID: `missing-${createUUID().unwrap()}`,
    })

    expect(_fromErr(result)).toBe("DEPOSIT_NOT_FOUND")
  })

  test("keeps status PENDING when provider returns pending", async () => {
    const user = await _createUser("wallet-query-pending@example.com")

    await insertWalletDeposit({
      userID: user.id,
      appTransID: "pending-trans-id",
      amount: 9000,
      status: "PENDING",
    })

    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      createZaloQueryResponse(3, "processing"),
    )

    const payload = await callHandler(user, {
      appTransID: "pending-trans-id",
    }).then(_fromOk)

    expect(payload.status).toBe("PENDING")
    expect(payload.user.wallet.unwrap()).toBe(0)
  })

  test("credits wallet once when provider returns success", async () => {
    const user = await _createUser("wallet-query-success@example.com")

    await insertWalletDeposit({
      userID: user.id,
      appTransID: "success-trans-id",
      amount: 12000,
      status: "PENDING",
    })

    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      createZaloQueryResponse(1, "ok"),
    )

    const first = await callHandler(user, {
      appTransID: "success-trans-id",
    }).then(_fromOk)

    const second = await callHandler(user, {
      appTransID: "success-trans-id",
    }).then(_fromOk)

    const deposit = await db
      .selectFrom("wallet_deposit")
      .selectAll()
      .where("appTransID", "=", "success-trans-id")
      .executeTakeFirstOrThrow()

    expect(first.status).toBe("SUCCESS")
    expect(first.user.wallet.unwrap()).toBe(12000)
    expect(second.user.wallet.unwrap()).toBe(12000)
    expect(deposit.status).toBe("SUCCESS")
    expect(deposit.creditedAt).not.toBeNull()
  })

  test("marks deposit FAILED when provider returns failure code", async () => {
    const user = await _createUser("wallet-query-failed@example.com")

    await insertWalletDeposit({
      userID: user.id,
      appTransID: "failed-trans-id",
      amount: 7000,
      status: "PENDING",
    })

    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      createZaloQueryResponse(-1, "rejected"),
    )

    const payload = await callHandler(user, {
      appTransID: "failed-trans-id",
    }).then(_fromOk)

    const deposit = await db
      .selectFrom("wallet_deposit")
      .selectAll()
      .where("appTransID", "=", "failed-trans-id")
      .executeTakeFirstOrThrow()

    expect(payload.status).toBe("FAILED")
    expect(deposit.status).toBe("FAILED")
  })
})
