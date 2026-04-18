import {
  createPositiveInt,
  createPositiveIntE,
  increment,
  add,
  PositiveInt1,
  PositiveInt10,
} from "../../../../Core/Data/Number/PositiveInt"
import { _fromOk, _fromErr } from "../../../Fixture/Result"
import { _notNull } from "../../../Fixture/Maybe"

describe("Data/Number/PositiveInt", () => {
  it("createPositiveInt returns PositiveInt for positive integer", () => {
    const n = _notNull(createPositiveInt(5))
    assert.strictEqual(n.unwrap(), 5)
  })

  it("createPositiveInt returns null for 0", () => {
    assert.strictEqual(createPositiveInt(0), null)
  })

  it("createPositiveInt returns null for negative", () => {
    assert.strictEqual(createPositiveInt(-1), null)
  })

  it("createPositiveInt returns null for non-integer", () => {
    assert.strictEqual(createPositiveInt(1.5), null)
  })

  it("createPositiveIntE returns error for 0", () => {
    assert.strictEqual(_fromErr(createPositiveIntE(0)), "NOT_A_POSITIVE_INT")
  })

  it("createPositiveIntE returns error for non-integer", () => {
    assert.strictEqual(_fromErr(createPositiveIntE(1.5)), "NOT_AN_INT")
  })

  it("increment adds 1", () => {
    assert.strictEqual(increment(PositiveInt1).unwrap(), 2)
  })

  it("add sums two PositiveInts", () => {
    assert.strictEqual(add(PositiveInt1, PositiveInt10).unwrap(), 11)
  })
})
