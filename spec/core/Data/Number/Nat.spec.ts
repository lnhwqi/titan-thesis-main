import {
  createNat,
  createNatE,
  createAbsoluteNat,
  increment,
  decrement,
  add,
  sum,
  fromPositiveInt,
  Nat0,
  Nat1,
  Nat5,
} from "../../../../Core/Data/Number/Nat"
import { PositiveInt1 } from "../../../../Core/Data/Number/PositiveInt"
import { _fromOk, _fromErr } from "../../../Fixture/Result"
import { _notNull } from "../../../Fixture/Maybe"

describe("Data/Number/Nat", () => {
  it("createNat returns Nat for 0", () => {
    const n = _notNull(createNat(0))
    assert.strictEqual(n.unwrap(), 0)
  })

  it("createNat returns Nat for positive integer", () => {
    const n = _notNull(createNat(42))
    assert.strictEqual(n.unwrap(), 42)
  })

  it("createNat returns null for negative", () => {
    assert.strictEqual(createNat(-1), null)
  })

  it("createNat returns null for non-integer", () => {
    assert.strictEqual(createNat(1.5), null)
  })

  it("createNatE returns error for negative", () => {
    assert.strictEqual(_fromErr(createNatE(-1)), "NOT_A_NAT")
  })

  it("createNatE returns error for non-integer", () => {
    assert.strictEqual(_fromErr(createNatE(1.5)), "NOT_AN_INT")
  })

  it("createAbsoluteNat makes positive and rounds up", () => {
    assert.strictEqual(createAbsoluteNat(-3.2).unwrap(), 4)
    assert.strictEqual(createAbsoluteNat(0).unwrap(), 0)
    assert.strictEqual(createAbsoluteNat(NaN).unwrap(), 0)
  })

  it("increment adds 1", () => {
    assert.strictEqual(increment(Nat5).unwrap(), 6)
  })

  it("decrement subtracts 1", () => {
    const r = decrement(Nat1)
    if (r == null) throw new Error("Should not be null")
    assert.strictEqual(r.unwrap(), 0)
  })

  it("decrement returns null for 0", () => {
    assert.strictEqual(decrement(Nat0), null)
  })

  it("add sums two Nats", () => {
    assert.strictEqual(add(Nat1, Nat5).unwrap(), 6)
  })

  it("sum sums array of Nats", () => {
    assert.strictEqual(sum([Nat1, Nat5, Nat0]).unwrap(), 6)
  })

  it("fromPositiveInt converts PositiveInt to Nat", () => {
    assert.strictEqual(fromPositiveInt(PositiveInt1).unwrap(), 1)
  })
})
