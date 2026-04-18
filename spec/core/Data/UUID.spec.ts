import { createUUID, uuidDecoder } from "../../../Core/Data/UUID"

describe("Data/UUID", () => {
  it("createUUID generates a valid UUID", () => {
    const uuid = createUUID()
    assert.ok(uuid.unwrap().length > 0)
  })

  it("createUUID generates unique values", () => {
    const uuid1 = createUUID()
    const uuid2 = createUUID()
    assert.notStrictEqual(uuid1.unwrap(), uuid2.unwrap())
  })

  it("uuidDecoder decodes a valid UUID", () => {
    const uuid = createUUID()
    const decoded = uuidDecoder.verify(uuid.unwrap())
    assert.strictEqual(decoded.unwrap(), uuid.unwrap())
  })

  it("uuidDecoder rejects invalid UUID", () => {
    const result = uuidDecoder.decode("not-a-uuid")
    assert.strictEqual(result.ok, false)
  })
})
