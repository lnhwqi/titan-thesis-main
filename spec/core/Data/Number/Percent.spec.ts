import {
  add,
  fromFraction,
  isPercent100,
  Percent0,
  Percent100,
} from "../../../../Core/Data/Number/Percent"
import { Nat10 } from "../../../../Core/Data/Number/Nat"

describe("Data/Number/Percent", () => {
  it("Percent0 is 0", () => {
    assert.strictEqual(Percent0.unwrap(), 0)
  })

  it("Percent100 is 100", () => {
    assert.strictEqual(Percent100.unwrap(), 100)
  })

  it("add increments percent", () => {
    const result = add(Nat10, Percent0)
    assert.strictEqual(result.unwrap(), 10)
  })

  it("add clamps at 100", () => {
    const result = add(Nat10, Percent100)
    assert.strictEqual(result.unwrap(), 100)
  })

  it("fromFraction converts fraction to percent", () => {
    assert.strictEqual(fromFraction(0.5).unwrap(), 50)
    assert.strictEqual(fromFraction(1).unwrap(), 100)
    assert.strictEqual(fromFraction(0).unwrap(), 0)
  })

  it("isPercent100 returns true for 100", () => {
    assert.strictEqual(isPercent100(Percent100), true)
  })

  it("isPercent100 returns false for non-100", () => {
    assert.strictEqual(isPercent100(Percent0), false)
  })
})
