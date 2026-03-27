import { Poster } from "../../../Core/App/Poster"
import { PosterRow } from "../Database/PosterRow"

export function toPoster(row: PosterRow): Poster {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    imageUrl: row.imageUrl,
    imageScalePercent: row.imageScalePercent,
    imageOffsetXPercent: row.imageOffsetXPercent,
    imageOffsetYPercent: row.imageOffsetYPercent,
    startDate: row.startDate,
    endDate: row.endDate,
    isPermanent: row.isPermanent,
  }
}
