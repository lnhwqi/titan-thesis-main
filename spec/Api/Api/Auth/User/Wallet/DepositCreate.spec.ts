import { afterEach, vi } from "vitest"
import { handler } from "../../../../../../Api/src/Api/Auth/User/Wallet/DepositCreate"
import db from "../../../../../../Api/src/Database"
import { _createUser, _fromErr, _fromOk } from "../../../../../Fixture"
import { activeDecoder } from "../../../../../../Core/App/User/Active"

describe("Api/Auth/User/Wallet/DepositCreate", () => {
  function callHandler(user: unknown, params: unknown) {
    return Reflect.apply(handler, null, [user, params])
  }

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test("returns ACCOUNT_SUSPENDED for suspended user", async () => {
    const user = await _createUser("wallet-deposit-suspended@example.com", {
      active: activeDecoder.verify(false),
    })

    const result = await callHandler(user, { amount: 10000 })

    expect(_fromErr(result)).toBe("ACCOUNT_SUSPENDED")
  })

  test("returns INVALID_AMOUNT for non-positive amount", async () => {
    const user = await _createUser("wallet-deposit-invalid@example.com")

    const result = await callHandler(user, { amount: 0 })

    expect(_fromErr(result)).toBe("INVALID_AMOUNT")
  })

  test("returns CREATE_FAILED when provider request fails", async () => {
    const user = await _createUser("wallet-deposit-fetch-fail@example.com")

    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"))

    const result = await callHandler(user, { amount: 10000 })

    expect(_fromErr(result)).toBe("CREATE_FAILED")
  })

  test("creates wallet deposit and stores pending row", async () => {
    const user = await _createUser("wallet-deposit-success@example.com")

    const response = new Response(
      JSON.stringify({
        return_code: 1,
        order_url: "https://pay.example.com/order",
        qr_code: "qr-payload",
        zp_trans_token: "token-123",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )

    vi.spyOn(globalThis, "fetch").mockResolvedValue(response)

    const payload = await callHandler(user, { amount: 15000 }).then(_fromOk)

    const deposit = await db
      .selectFrom("wallet_deposit")
      .selectAll()
      .where("appTransID", "=", payload.appTransID)
      .where("userId", "=", user.id.unwrap())
      .executeTakeFirst()

    expect(payload.orderURL).toContain("https://")
    expect(payload.zpTransToken).toBe("token-123")
    expect(deposit?.status).toBe("PENDING")
    expect(deposit?.amount).toBe(15000)
  })
})
