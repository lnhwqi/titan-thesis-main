import { unsnoc, uniqueBy } from "../../../Core/Data/Array"

describe("Data/Array", () => {
  it("unsnoc returns last and init for non-empty array", () => {
    const result = unsnoc([1, 2, 3])
    assert.deepStrictEqual(result, { init: [1, 2], last: 3 })
  })

  it("unsnoc returns single element", () => {
    const result = unsnoc([42])
    assert.deepStrictEqual(result, { init: [], last: 42 })
  })

  it("unsnoc returns null for empty array", () => {
    assert.strictEqual(unsnoc([]), null)
  })

  it("uniqueBy removes duplicates", () => {
    const result = uniqueBy(
      [
        { id: 1, name: "a" },
        { id: 2, name: "b" },
        { id: 1, name: "c" },
      ],
      (item) => item.id,
    )
    assert.deepStrictEqual(result, [
      { id: 1, name: "a" },
      { id: 2, name: "b" },
    ])
  })

  it("uniqueBy returns empty for empty array", () => {
    assert.deepStrictEqual(
      uniqueBy([], (x) => x),
      [],
    )
  })

  it("uniqueBy keeps all when no duplicates", () => {
    const result = uniqueBy([1, 2, 3], (x) => x)
    assert.deepStrictEqual(result, [1, 2, 3])
  })
})
