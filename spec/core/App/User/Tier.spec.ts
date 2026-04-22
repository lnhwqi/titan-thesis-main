import { createTier, createTierE } from "../../../../Core/App/User/Tier"
import { _fromErr } from "../../../Fixture/Result"

describe("App/User/Tier", () => {
  it("valid tiers", () => {
    ;["bronze", "silver", "gold", "diamond"].forEach((t) => {
      const result = createTier(t)
      if (result == null) throw new Error(`${t} should be valid`)
      assert.strictEqual(result.unwrap(), t)
    })
  })

  it("invalid tiers", () => {
    ;["", "platinum", "BRONZE", "invalid"].forEach((t) => {
      assert.strictEqual(createTier(t), null)
    })
  })

  it("createTierE returns error for invalid", () => {
    assert.strictEqual(_fromErr(createTierE("invalid")), "INVALID_TIER")
  })
})
