import {
  createVacationMode,
  createVacationModeE,
} from "../../../../Core/App/Seller/VacationMode"

describe("App/Seller/VacationMode", () => {
  it("valid vacation mode true", () => {
    const result = createVacationMode(true)
    if (result == null) throw new Error("Should not be null")
    assert.strictEqual(result.unwrap(), true)
  })

  it("valid vacation mode false", () => {
    const result = createVacationMode(false)
    if (result == null) throw new Error("Should not be null")
    assert.strictEqual(result.unwrap(), false)
  })
})
