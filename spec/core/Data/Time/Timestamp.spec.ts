import {
  createTimestamp,
  createTimestampE,
  createNow,
  fromDate,
  afterNow,
  beforeNow,
  diffTimestamp,
  addSeconds,
  isSameDay,
  toDate,
} from "../../../../Core/Data/Time/Timestamp"
import { PositiveInt10 } from "../../../../Core/Data/Number/PositiveInt"
import { _fromOk, _fromErr } from "../../../Fixture/Result"

describe("Data/Time/Timestamp", () => {
  it("createNow returns a valid timestamp", () => {
    const ts = createNow()
    assert.ok(ts.unwrap() > 0)
  })

  it("createTimestamp returns value for valid epoch", () => {
    const ts = createTimestamp(1000000)
    if (ts == null) throw new Error("Should not be null")
    assert.strictEqual(ts.unwrap(), 1000000)
  })

  it("createTimestamp returns null for non-integer", () => {
    assert.strictEqual(createTimestamp(1.5), null)
  })

  it("createTimestampE returns error for non-integer", () => {
    assert.strictEqual(_fromErr(createTimestampE(1.5)), "NOT_AN_INT")
  })

  it("fromDate creates timestamp from Date", () => {
    const date = new Date("2025-01-01T00:00:00Z")
    const ts = fromDate(date)
    assert.strictEqual(ts.unwrap(), date.getTime())
  })

  it("afterNow returns true for future timestamp", () => {
    const future = fromDate(new Date(Date.now() + 100000))
    assert.strictEqual(afterNow(future), true)
  })

  it("beforeNow returns true for past timestamp", () => {
    const past = fromDate(new Date(Date.now() - 100000))
    assert.strictEqual(beforeNow(past), true)
  })

  it("diffTimestamp returns difference", () => {
    const ts1 = fromDate(new Date(2000))
    const ts2 = fromDate(new Date(1000))
    assert.strictEqual(diffTimestamp(ts1, ts2), 1000)
  })

  it("addSeconds adds time", () => {
    const ts = fromDate(new Date(0))
    const result = addSeconds(ts, PositiveInt10)
    assert.strictEqual(result.unwrap(), 10000)
  })

  it("isSameDay returns true for same day", () => {
    const ts1 = fromDate(new Date(2025, 0, 1, 10, 0, 0))
    const ts2 = fromDate(new Date(2025, 0, 1, 20, 0, 0))
    assert.strictEqual(isSameDay(ts1, ts2), true)
  })

  it("isSameDay returns false for different days", () => {
    const ts1 = fromDate(new Date("2025-01-01T00:00:00Z"))
    const ts2 = fromDate(new Date("2025-01-02T00:00:00Z"))
    assert.strictEqual(isSameDay(ts1, ts2), false)
  })

  it("toDate converts back to Date", () => {
    const date = new Date("2025-06-15T12:00:00Z")
    const ts = fromDate(date)
    assert.strictEqual(toDate(ts).getTime(), date.getTime())
  })
})
