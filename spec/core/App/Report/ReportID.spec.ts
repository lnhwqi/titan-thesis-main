import { createReportID } from "../../../../Core/App/Report/ReportID"

describe("App/Report/ReportID", () => {
  it("createReportID generates a valid ID", () => {
    const id = createReportID()
    assert.ok(id.unwrap().length > 0)
  })

  it("createReportID generates unique IDs", () => {
    const id1 = createReportID()
    const id2 = createReportID()
    assert.notStrictEqual(id1.unwrap(), id2.unwrap())
  })
})
