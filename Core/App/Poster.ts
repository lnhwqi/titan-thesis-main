import * as JD from "decoders"
import { SDate, sdateStringDecoder } from "../Data/Time/SDate"
import { PosterID, posterIDDecoder } from "./Poster/PosterID"
import { PosterName, posterNameDecoder } from "./Poster/PosterName"
import {
  PosterDescription,
  posterDescriptionDecoder,
} from "./Poster/PosterDescription"
import { ImageUrl, imageUrlDecoder } from "./Product/ProductImageUrl"

export type Poster = {
  id: PosterID
  name: PosterName
  description: PosterDescription
  imageUrl: ImageUrl
  imageScalePercent: number
  imageOffsetXPercent: number
  imageOffsetYPercent: number
  startDate: SDate
  endDate: SDate | null
  isPermanent: boolean
}

export const posterDecoder: JD.Decoder<Poster> = JD.object({
  id: posterIDDecoder,
  name: posterNameDecoder,
  description: posterDescriptionDecoder,
  imageUrl: imageUrlDecoder,
  imageScalePercent: JD.number,
  imageOffsetXPercent: JD.number,
  imageOffsetYPercent: JD.number,
  startDate: sdateStringDecoder,
  endDate: JD.nullable(sdateStringDecoder),
  isPermanent: JD.boolean,
})
